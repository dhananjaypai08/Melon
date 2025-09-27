#!/usr/bin/env python3
"""
capture_sign_verify.py

FIXED VERSION: Hashes JPEG image data (excluding EXIF) so the hash
remains consistent before and after EXIF embedding.
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

# Camera (picamera2) -- optional on dev machine
try:
    from picamera2 import Picamera2, Preview
except Exception:
    Picamera2 = None

### CONFIG - edit as needed ###
DEVICE_ID = "pi-serial-01"
PRIVATE_KEY_PATH = "device_private_key.pem"
PUBLIC_KEY_PATH = "device_public_key.pem"
FIRMWARE = "cam-v1.0"
RAW_IMAGE_PATH = "capture.jpg"
FINAL_IMAGE_PATH = "capture_with_proof.jpg"
### End config ###

# --------- Key management ----------
def ensure_private_key():
    if os.path.exists(PRIVATE_KEY_PATH):
        with open(PRIVATE_KEY_PATH, "rb") as f:
            key = serialization.load_pem_private_key(f.read(), password=None)
        return key
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
    pub = privkey.public_key()
    pem = pub.public_bytes(encoding=serialization.Encoding.PEM,
                           format=serialization.PublicFormat.SubjectPublicKeyInfo)
    with open(PUBLIC_KEY_PATH, "wb") as f:
        f.write(pem)
    os.chmod(PUBLIC_KEY_PATH, 0o644)
    print(f"[+] Exported public key -> {PUBLIC_KEY_PATH}")

    # Also return raw public key bytes (32 bytes) for embedding if supported
    try:
        raw = pub.public_bytes(encoding=serialization.Encoding.Raw,
                               format=serialization.PublicFormat.Raw)
        return pem, raw
    except Exception:
        # fallback - not expected on modern cryptography versions
        return pem, None

# --------- Camera capture ----------
def capture_photo(output_path):
    if Picamera2 is None:
        raise RuntimeError("Picamera2 not available. Provide an image file at capture path.")
    picam2 = Picamera2()
    config = picam2.create_still_configuration(main={"size": (4032, 3024)})
    picam2.configure(config)
    picam2.start()
    import time
    time.sleep(0.5)
    picam2.capture_file(output_path)
    picam2.stop()
    print(f"[+] Captured image -> {output_path}")

# --------- Image hashing ----------
def canonical_image_hash(image_path: str) -> str:
    """
    FIXED: Hash JPEG image data excluding EXIF metadata.
    This ensures the hash remains the same before and after EXIF embedding.
    """
    try:
        # Try to strip EXIF and hash only image data
        with Image.open(image_path) as img:
            # Convert to RGB to ensure consistent format
            img_rgb = img.convert("RGB")
            
            # Get image dimensions and raw pixel data
            width, height = img_rgb.size
            pixel_data = img_rgb.tobytes()
            
            # Create a deterministic hash of image content
            h = hashlib.sha256()
            h.update(f"{width}x{height}".encode("utf-8"))
            h.update(pixel_data)
            return h.hexdigest()
            
    except Exception as e:
        print(f"[!] Warning: Could not hash image pixels, falling back to file hash: {e}")
        # Fallback: hash raw file bytes
        with open(image_path, "rb") as f:
            raw_bytes = f.read()
        h = hashlib.sha256()
        h.update(raw_bytes)
        return h.hexdigest()

def strip_exif_and_hash(image_path: str) -> str:
    """
    Alternative approach: Remove EXIF data and hash the clean JPEG.
    This provides the most consistent hashing approach.
    """
    try:
        with Image.open(image_path) as img:
            # Remove all EXIF data
            clean_img = Image.new(img.mode, img.size)
            clean_img.putdata(list(img.getdata()))
            
            # Save to bytes without EXIF
            import io
            buffer = io.BytesIO()
            clean_img.save(buffer, format='JPEG', quality=95)
            clean_bytes = buffer.getvalue()
            
            # Hash the clean JPEG bytes
            h = hashlib.sha256()
            h.update(clean_bytes)
            return h.hexdigest()
            
    except Exception as e:
        print(f"[!] Could not strip EXIF for hashing: {e}")
        return canonical_image_hash(image_path)

# --------- Proof canonicalization & signing ----------
def canonical_payload(payload: dict) -> bytes:
    return json.dumps(payload, separators=(',', ':'), sort_keys=True).encode('utf-8')

def create_and_sign_proof(privkey, device_id, image_hash, firmware, public_key_raw_bytes):
    timestamp = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    nonce = secrets.token_hex(16)
    # embed base64 raw public key
    public_key_b64 = base64.b64encode(public_key_raw_bytes).decode("ascii") if public_key_raw_bytes else None

    payload = {
        "device_id": device_id,
        "timestamp": timestamp,
        "image_hash": image_hash,
        "nonce": nonce,
        "firmware": firmware,
        "sig_alg": "Ed25519",
        "public_key_b64": public_key_b64
    }
    # sign canonical payload (which includes public_key_b64)
    msg = canonical_payload(payload)
    signature = privkey.sign(msg)
    payload["signature"] = base64.b64encode(signature).decode("ascii")
    return payload

# --------- EXIF embedding & extraction ----------
def embed_proof_into_exif(input_image_path: str, proof: dict, output_image_path: str):
    """
    Insert EXIF UserComment into JPEG bytes without re-encoding the image pixels.
    """
    import piexif
    import json

    proof_json = json.dumps(proof, separators=(',', ':'))
    
    # Build a minimal exif dict if input doesn't already have EXIF
    try:
        exif_dict = piexif.load(input_image_path)
    except Exception:
        exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}, "thumbnail": None}

    # Put user comment into Exif/UserComment
    exif_dict.setdefault("Exif", {})
    exif_dict["Exif"][piexif.ExifIFD.UserComment] = proof_json.encode("utf-8")

    exif_bytes = piexif.dump(exif_dict)

    # Try different approaches to embed EXIF
    try:
        # Method 1: Binary insert with output path
        with open(input_image_path, "rb") as f:
            jpeg_bytes = f.read()
        
        # Some piexif versions expect 3 arguments
        try:
            piexif.insert(exif_bytes, input_image_path, output_image_path)
            print(f"[+] Embedded proof into EXIF (file insert) -> {output_image_path}")
            return
        except TypeError:
            # Try binary version
            new_jpeg = piexif.insert(exif_bytes, jpeg_bytes)
            with open(output_image_path, "wb") as out:
                out.write(new_jpeg)
            print(f"[+] Embedded proof into EXIF (binary insert) -> {output_image_path}")
            return
            
    except Exception as e:
        print(f"[!] piexif insert failed: {e}. Using Pillow fallback...")
        
        # Fallback: Use Pillow (may re-encode)
        from PIL import Image
        img = Image.open(input_image_path)
        img.save(output_image_path, "JPEG", exif=exif_bytes, quality=95)
        print(f"[+] Embedded proof using Pillow -> {output_image_path} (may have re-encoded)")

def extract_proof_from_exif(image_path: str) -> dict:
    exif_dict = piexif.load(image_path)
    raw = exif_dict["Exif"].get(piexif.ExifIFD.UserComment, b"")
    if not raw:
        raise ValueError("No proof found in EXIF UserComment")
    return json.loads(raw.decode("utf-8"))

# --------- Verification ----------
def verify_embedded_proof(image_path: str) -> bool:
    try:
        proof = extract_proof_from_exif(image_path)
        
        # Use the same hashing method for verification
        recomputed_hash = strip_exif_and_hash(image_path)
        expected_hash = proof.get("image_hash")
        
        print(f"[DEBUG] Recomputed hash: {recomputed_hash}")
        print(f"[DEBUG] Expected hash:   {expected_hash}")
        
        if recomputed_hash != expected_hash:
            print("❌ Image content hash mismatch! Image may have been tampered.")
            print("   recomputed:", recomputed_hash)
            print("   expected:  ", expected_hash)
            return False

        # reconstruct payload used for signing (everything except signature)
        payload = {k: proof[k] for k in proof if k != "signature"}
        msg = canonical_payload(payload)
        signature = base64.b64decode(proof["signature"])
        
        # load public key from embedded base64 raw
        pub_b64 = proof.get("public_key_b64")
        if not pub_b64:
            print("❌ No embedded public key found in proof.")
            return False
        pub_raw = base64.b64decode(pub_b64)
        
        # verify using cryptography (wrap raw bytes into Ed25519PublicKey)
        try:
            pubkey_obj = ed25519.Ed25519PublicKey.from_public_bytes(pub_raw)
            pubkey_obj.verify(signature, msg)
            print("✅ Signature valid.")
            print("✅ Image authenticity verified!")
            return True
        except Exception as e:
            print("❌ Signature verification failed:", e)
            return False
            
    except Exception as e:
        print(f"❌ Verification error: {e}")
        return False

# --------- Main flow ----------
def main():
    priv = ensure_private_key()
    pem, raw = export_public_key(priv)

    try:
        capture_photo(RAW_IMAGE_PATH)
    except Exception as e:
        print("[!] Could not capture via camera:", e)
        if not os.path.exists(RAW_IMAGE_PATH):
            raise SystemExit("No image available to sign. Place an image at " + RAW_IMAGE_PATH)

    # Hash the image content (excluding EXIF)
    img_hash = strip_exif_and_hash(RAW_IMAGE_PATH)
    print(f"[+] Image content hash: {img_hash}")

    proof = create_and_sign_proof(priv, DEVICE_ID, img_hash, FIRMWARE, raw)
    embed_proof_into_exif(RAW_IMAGE_PATH, proof, FINAL_IMAGE_PATH)

    # Verify the final image
    print("\n[+] Verifying embedded proof...")
    ok = verify_embedded_proof(FINAL_IMAGE_PATH)
    print(f"Verification result: {ok}")

if __name__ == "__main__":
    main()
