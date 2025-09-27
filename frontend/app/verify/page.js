"use client";

import React, { useState } from "react";
import * as ed from "@noble/ed25519";
import piexif from "piexifjs";

export default function VerifyPage() {
  const [fileName, setFileName] = useState(null);
  const [status, setStatus] = useState("");
  const [proof, setProof] = useState(null);
  const [recomputedHash, setRecomputedHash] = useState(null);
  const [errors, setErrors] = useState(null);

  // helper: deterministic JSON (sort keys)
  function canonicalPayloadBytes(obj) {
    const sortedKeys = Object.keys(obj).sort();
    const ordered = {};
    for (const k of sortedKeys) ordered[k] = obj[k];
    return new TextEncoder().encode(JSON.stringify(ordered));
  }

  // convert DataURL to binary string (for piexif)
  function dataURLtoBinary(dataURL) {
    const idx = dataURL.indexOf(",") + 1;
    const b64 = dataURL.substring(idx);
    const binaryStr = atob(b64);
    return binaryStr;
  }

  async function handleFile(ev) {
    setErrors(null);
    setProof(null);
    setRecomputedHash(null);
    setStatus("Reading file...");
    const file = ev.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dataURL = e.target.result;
        const binaryStr = dataURLtoBinary(dataURL);

        // Load EXIF
        let exifObj = {};
        try {
          exifObj = piexif.load(binaryStr);
        } catch {
          exifObj = {};
        }

        const userCommentRaw =
          (exifObj?.Exif && exifObj.Exif[piexif.ExifIFD.UserComment]) || null;
        if (!userCommentRaw) {
          setStatus("No proof found in EXIF UserComment.");
          setErrors("No proof present in EXIF UserComment.");
          return;
        }

        // Decode EXIF UserComment
        let proofJsonStr;
        if (typeof userCommentRaw === "string") {
          try {
            proofJsonStr = decodeURIComponent(escape(userCommentRaw));
          } catch {
            proofJsonStr = userCommentRaw;
          }
        } else {
          const bytes = new Uint8Array(
            userCommentRaw.split("").map((c) => c.charCodeAt(0))
          );
          proofJsonStr = new TextDecoder().decode(bytes);
        }

        // Parse the embedded proof JSON
        let extractedProof;
        try {
          extractedProof = JSON.parse(proofJsonStr);
        } catch (err) {
          setStatus("Invalid proof JSON in EXIF.");
          setErrors("Invalid proof JSON in EXIF.");
          return;
        }

        setProof(extractedProof);
        setStatus("Proof extracted. Recomputing image hash...");

        // ✅ Compute SHA-256 of the actual JPEG bytes (not decoded pixels)
        const hashBuffer = await file.arrayBuffer();
        const hashBytes = new Uint8Array(hashBuffer);
        const digest = await crypto.subtle.digest("SHA-256", hashBytes);
        const digestHex = Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        setRecomputedHash(digestHex);

        // Compare with proof hash
        const expectedHash = extractedProof.image_hash;
        if (digestHex !== expectedHash) {
          setStatus("❌ Image hash mismatch! File may have been modified.");
          setErrors("Image hash mismatch");
          return;
        } else {
          setStatus("✅ Image hash matches. Verifying signature...");
        }

        // Rebuild canonical message (everything except signature)
        const payload = {};
        for (const k of Object.keys(extractedProof)) {
          if (k === "signature") continue;
          payload[k] = extractedProof[k];
        }
        const msgBytes = canonicalPayloadBytes(payload);

        // Decode base64 fields
        const signatureB64 = extractedProof.signature;
        const sigBytes = Uint8Array.from(atob(signatureB64), (c) =>
          c.charCodeAt(0)
        );

        const publicKeyB64 = extractedProof.public_key_b64;
        if (!publicKeyB64) {
          setStatus("Missing public key in proof. Cannot verify.");
          setErrors("Missing public key in proof.");
          return;
        }
        const pubBytes = Uint8Array.from(atob(publicKeyB64), (c) =>
          c.charCodeAt(0)
        );

        // ✅ Verify signature using Ed25519
        try {
          const ok = await ed.verify(sigBytes, msgBytes, pubBytes);
          if (ok) {
            setStatus("✅ Signature valid. Proof verified successfully!");
          } else {
            setStatus("❌ Signature verification FAILED.");
            setErrors("Signature invalid");
          }
        } catch (ex) {
          setStatus("Error verifying signature: " + String(ex));
          setErrors(String(ex));
        }
      } catch (err) {
        setStatus("Error processing file: " + String(err));
        setErrors(String(err));
      }
    };

    reader.onerror = () => {
      setStatus("File read error");
      setErrors("File read error");
    };

    reader.readAsDataURL(file);
  }

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "2rem auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 24 }}>Image Proof Verifier</h1>
      <p>
        Upload a JPEG produced by your Pi script (proof embedded into EXIF
        UserComment).
      </p>

      <input type="file" accept="image/*" onChange={handleFile} />

      <div style={{ marginTop: 16 }}>
        <strong>File:</strong> {fileName || "—"}
      </div>

      <div style={{ marginTop: 8 }}>
        <strong>Status:</strong> {status}
      </div>

      {errors && (
        <pre style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{errors}</pre>
      )}

      {proof && (
        <div
          style={{
            marginTop: 12,
            background: "#0f172a",
            color: "#fff",
            padding: 12,
            borderRadius: 8,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Extracted Proof</h3>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
            {JSON.stringify(proof, null, 2)}
          </pre>
        </div>
      )}

      {recomputedHash && (
        <div style={{ marginTop: 8 }}>
          <strong>Recomputed hash:</strong> <code>{recomputedHash}</code>
        </div>
      )}
    </div>
  );
}
