import base64
import json
import subprocess
import tempfile
from datetime import datetime, timezone
import secrets
import hashlib
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography import x509

def canonical_payload(payload: dict) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")


def create_and_sign_proof_pkcs7(
    privkey_pem: str,
    cert_pem: str,
    device_id: str,
    image_hash: str,
    firmware: str,
    public_key_raw_bytes: bytes,
):
    timestamp = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    nonce = secrets.token_hex(16)

    public_key_b64 = base64.b64encode(public_key_raw_bytes).decode("ascii") if public_key_raw_bytes else None

    payload = {
        "device_id": device_id,
        "timestamp": timestamp,
        "image_hash": image_hash,
        "nonce": nonce,
        "firmware": firmware,
        "sig_alg": "PKCS7-RSA-SHA256",
        "public_key_b64": public_key_b64,
    }

    msg = canonical_payload(payload)

    # Write payload to a temporary file
    with tempfile.NamedTemporaryFile(delete=False) as data_file:
        data_file.write(msg)
        data_file.flush()
        data_path = data_file.name

    # Output PKCS#7 detached signature
    with tempfile.NamedTemporaryFile(delete=False) as sig_file:
        sig_path = sig_file.name

    subprocess.run(
        [
            "openssl",
            "smime",
            "-sign",
            "-in",
            data_path,
            "-signer",
            cert_pem,
            "-inkey",
            privkey_pem,
            "-outform",
            "DER",
            "-binary",
            "-noattr",
            "-out",
            sig_path,
            "-md",
            "sha256",
        ],
        check=True,
    )

    # Load signature
    with open(sig_path, "rb") as f:
        signature_der = f.read()

    payload["signature_pkcs7"] = base64.b64encode(signature_der).decode("ascii")

    # Create buffer for hashing (canonical JSON including signature)
    buffer = canonical_payload(payload)
    sha256_hash = hashlib.sha256(buffer).hexdigest()
    print("SHA-256 hash:", sha256_hash)

    # --- Verification ---
    # Load certificate
    with open(cert_pem, "rb") as f:
        cert = x509.load_pem_x509_certificate(f.read())

    pubkey = cert.public_key()  # This is RSA public key

    # Verify the signature against the original message (canonical payload without "signature_pkcs7")
    try:
        pubkey.verify(
            signature_der,  # PKCS#7 DER blob
            msg,  # original message bytes
            padding.PKCS1v15(),
            hashes.SHA256(),
        )
        print("RSA signature verification: SUCCESS")
    except Exception as e:
        print("RSA signature verification: FAILED", e)

    return payload


# Example usage
proof = create_and_sign_proof_pkcs7(
    privkey_pem="rsa_priv.pem",
    cert_pem="rsa_cert.pem",
    device_id="dev123",
    image_hash="abc123",
    firmware="1.0.0",
    public_key_raw_bytes=b"\x01\x02\x03",
)
print(proof)