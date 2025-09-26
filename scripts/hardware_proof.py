#!/usr/bin/env python3
"""
capture_sign_verify.py

Single-file workflow for Raspberry Pi 5 + Camera Module 3:
•⁠  ⁠capture image with picamera2
•⁠  ⁠compute canonical pixel-hash
•⁠  ⁠create proof JSON (device_id, timestamp, image_hash, nonce, firmware)
•⁠  ⁠sign with Ed25519 private key (kept at PRIVATE_KEY_PATH)
•⁠  ⁠embed proof JSON into EXIF UserComment
•⁠  ⁠export public key (device_public_key.pem)
•⁠  ⁠verify the embedded proof immediately

Notes:
•⁠  ⁠Uses pixel-data hashing (width|height|mode|raw bytes) so adding EXIF doesn't break verification.
•⁠  ⁠Private key file permissions are set to 0o600 for basic protection.
"""

import os
import json
import base64
import hashlib
import secrets
from datetime import datetime, timezone

# Crypto libs
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

# Image & EXIF
from PIL import Image
import piexif

# Camera (picamera2)
try:
    from picamera2 import Picamera2, Preview
except Exception:
    Picamera2 = None
    # The script will still work if you pre-populate an input image for testing.

### CONFIG - edit as needed ###
DEVICE_ID = "pi-serial-01"             # choose a stable device id (Pi serial / provisioning id)
PRIVATE_KEY_PATH = "device_private_key.pem"
PUBLIC_KEY_PATH = "device_public_key.pem"
FIRMWARE = "cam-v1.0"
RAW_IMAGE_PATH = "capture.jpg"         # intermediate raw capture
FINAL_IMAGE_PATH = "capture_with_proof.jpg"
### End config ###

# --------- Key management ----------
def ensure_private_key():
    """Load existing Ed25519 private key or create + save a new one."""
    if os.path.exists(PRIVATE_KEY_PATH):
        with open(PRIVATE_KEY_PATH, "rb") as f:
            key = serialization.load_pem_private_key(f.read(), password=None)
        return key
    # generate new key
    key = ed25519.Ed25519PrivateKey.generate()
    pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    with open(PRIVATE_KEY_PATH, "wb") as f:
        f.write(pem)
    os.chmod(PRIVATE_KEY_PATH, 0o600)
    print(f"[+] Generated new private key -> {PRIVATE_KEY_PATH}")
    return key

def export_public_key(privkey):
    """Export the public key to a PEM file."""
    pub = privkey.public_key()
    pem = pub.public_bytes(encoding=serialization.Encoding.PEM,
                           format=serialization.PublicFormat.SubjectPublicKeyInfo)
    with open(PUBLIC_KEY_PATH, "wb") as f:
        f.write(pem)
    # public key is okay to be world-readable
    os.chmod(PUBLIC_KEY_PATH, 0o644)
    print(f"[+] Exported public key -> {PUBLIC_KEY_PATH}")
    return PUBLIC_KEY_PATH

# --------- Camera capture ----------
def capture_photo(output_path):
    """
    Capture a photo using Picamera2.
    If Picamera2 is not available (e.g., running on dev machine), raise an informative error.
    """
    if Picamera2 is None:
        raise RuntimeError("Picamera2 not available. Install and enable camera, or provide an image file at capture path.")
    picam2 = Picamera2()
    config = picam2.create_still_configuration(main={"size": (4032, 3024)})  # example resolution; adjust if needed
    picam2.configure(config)
    picam2.start()
    # Small warmup (camera autofocus/exposure); adjust sleep if necessary
    import time
    time.sleep(0.5)
    picam2.capture_file(output_path)
    picam2.stop()
    print(f"[+] Captured image -> {output_path}")

# --------- Image hashing (pixel-based canonical hash) ----------
def canonical_image_hash(image_path: str) -> str:
    """
    Compute deterministic hash of the image pixel data:
    SHA256( width || height || mode || raw_bytes )
    This is robust to EXIF changes because pixel bytes remain the same.
    """
    with Image.open(image_path) as img:
        # convert to a canonical mode (RGB) for deterministic raw bytes
        img_canonical = img.convert("RGB")
        width, height = img_canonical.size
        mode = img_canonical.mode  # should be 'RGB'
        raw = img_canonical.tobytes()  # raw pixel bytes, row-major
    h = hashlib.sha256()
    # include dims and mode to avoid ambiguous collisions
    h.update(str(width).encode("ascii") + b"x" + str(height).encode("ascii") + b":" + mode.encode("ascii") + b":")
    h.update(raw)
    return h.hexdigest()

# --------- Proof canonicalization & signing ----------
def canonical_payload(payload: dict) -> bytes:
    # deterministic JSON: keys sorted, compact separators
    return json.dumps(payload, separators=(',', ':'), sort_keys=True).encode('utf-8')

def create_and_sign_proof(privkey, device_id, image_hash, firmware):
    timestamp = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    nonce = secrets.token_hex(16)
    payload = {
        "device_id": device_id,
        "timestamp": timestamp,
        "image_hash": image_hash,
        "nonce": nonce,
        "firmware": firmware,
        "sig_alg": "Ed25519"
    }
    msg = canonical_payload(payload)
    signature = privkey.sign(msg)
    payload["signature"] = base64.b64encode(signature).decode("ascii")
    return payload

# --------- EXIF embedding & extraction ----------
def embed_proof_into_exif(input_image_path: str, proof: dict, output_image_path: str):
    """Embed proof JSON into EXIF UserComment. Saves output image."""
    # Load existing EXIF if present
    exif_dict = piexif.load(input_image_path)
    proof_json = json.dumps(proof, separators=(',', ':'))
    # piexif expects bytes; UserComment is in ExifIFD
    exif_dict["Exif"][piexif.ExifIFD.UserComment] = proof_json.encode("utf-8")
    exif_bytes = piexif.dump(exif_dict)
    piexif.insert(exif_bytes, input_image_path, output_image_path)
    print(f"[+] Embedded proof into EXIF -> {output_image_path}")

def extract_proof_from_exif(image_path: str) -> dict:
    exif_dict = piexif.load(image_path)
    raw = exif_dict["Exif"].get(piexif.ExifIFD.UserComment, b"")
    if not raw:
        raise ValueError("No proof found in EXIF UserComment")
    return json.loads(raw.decode("utf-8"))

# --------- Verification (verify embedded proof with public key) ----------
def verify_embedded_proof(image_path: str, pubkey_path: str) -> bool:
    # load public key
    with open(pubkey_path, "rb") as f:
        pub = serialization.load_pem_public_key(f.read())

    # extract proof
    proof = extract_proof_from_exif(image_path)

    # recompute image hash from pixel data (canonical)
    recomputed_hash = canonical_image_hash(image_path)
    expected_hash = proof.get("image_hash")
    if recomputed_hash != expected_hash:
        print("❌ Image pixel hash mismatch! Image may have been tampered.")
        print("   recomputed:", recomputed_hash)
        print("   expected:  ", expected_hash)
        return False

    # reconstruct canonical payload without signature
    payload = {k: proof[k] for k in proof if k != "signature"}
    msg = canonical_payload(payload)
    signature = base64.b64decode(proof["signature"])
    try:
        pub.verify(signature, msg)
        print("✅ Signature valid.")
        print("Proof:", json.dumps(proof, indent=2))
        return True
    except Exception as e:
        print("❌ Signature verification failed:", e)
        return False

# --------- Main flow ----------
def main():
    # 1) Ensure private key & export public key
    priv = ensure_private_key()
    export_public_key(priv)

    # 2) Capture a photo (if picamera2 available)
    try:
        capture_photo(RAW_IMAGE_PATH)
    except Exception as e:
        print("[!] Could not capture via camera:", e)
        # If capture fails, check if RAW_IMAGE_PATH exists (use pre-existing image for dev)
        if not os.path.exists(RAW_IMAGE_PATH):
            raise SystemExit("No image available to sign. Place an image at " + RAW_IMAGE_PATH)

    # 3) Compute canonical image hash (based on pixel data)
    img_hash = canonical_image_hash(RAW_IMAGE_PATH)
    print(f"[+] Canonical image pixel hash: {img_hash}")

    # 4) Create + sign proof
    proof = create_and_sign_proof(priv, DEVICE_ID, img_hash, FIRMWARE)
    # 5) Embed proof into EXIF and save final image
    embed_proof_into_exif(RAW_IMAGE_PATH, proof, FINAL_IMAGE_PATH)

    # 6) Verify immediately (using exported public key)
    ok = verify_embedded_proof(FINAL_IMAGE_PATH, PUBLIC_KEY_PATH)
    print("Verification result:", ok)

if __name__ == "__main__":
    main()
