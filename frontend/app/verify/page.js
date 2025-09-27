// app/verify/page.jsx
"use client";

import React, { useState, useRef } from "react";
import * as ed from "@noble/ed25519";
import piexif from "piexifjs";

export default function VerifyPage() {
  const [fileName, setFileName] = useState(null);
  const [status, setStatus] = useState("");
  const [proof, setProof] = useState(null);
  const [recomputedHash, setRecomputedHash] = useState(null);
  const [errors, setErrors] = useState(null);
  const canvasRef = useRef();

  // helper: deterministic JSON (sort keys, separators=(',',':'))
  function canonicalPayloadBytes(obj) {
    // Build object with keys sorted
    const sortedKeys = Object.keys(obj).sort();
    const ordered = {};
    for (const k of sortedKeys) {
      ordered[k] = obj[k];
    }
    // Note: JSON.stringify of ordered object with no spaces => separators(',',':')
    return new TextEncoder().encode(JSON.stringify(ordered));
  }

  // convert dataURL to binary string for piexifjs
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

    // Read as DataURL for piexif
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dataURL = e.target.result;
        // extract exif
        const binaryStr = dataURLtoBinary(dataURL);
        let exifObj = {};
        try {
          exifObj = piexif.load(binaryStr);
        } catch (ex) {
          // piexif might throw if no exif - handle below
          exifObj = {};
        }

        const userCommentRaw =
          (exifObj?.Exif && exifObj.Exif[piexif.ExifIFD.UserComment]) || null;
        if (!userCommentRaw) {
          setStatus("No proof found in EXIF UserComment.");
          setErrors("No proof present in EXIF UserComment.");
          return;
        }

        // piexif returns bytes as string; ensure it's UTF-8
        // userCommentRaw can be a binary string - convert to UTF-8 properly
        // simplest: if already string, use it; else convert:
        let proofJsonStr;
        if (typeof userCommentRaw === "string") {
          // piexif sometimes gives a byte string; convert using decodeURIComponent trick
          try {
            proofJsonStr = decodeURIComponent(escape(userCommentRaw));
          } catch {
            proofJsonStr = userCommentRaw;
          }
        } else {
          // fallback
          proofJsonStr = String(userCommentRaw);
        }

        // ensure it's valid JSON
        let extractedProof;
        try {
          extractedProof = JSON.parse(proofJsonStr);
        } catch (ex) {
          // sometimes piexif stores as bytes; try to decode from binary
          // convert binary string to Uint8Array then to UTF-8
          const bytes = new Uint8Array(
            userCommentRaw.split("").map((c) => c.charCodeAt(0))
          );
          proofJsonStr = new TextDecoder().decode(bytes);
          extractedProof = JSON.parse(proofJsonStr);
        }

        setProof(extractedProof);
        setStatus("Proof extracted. Recomputing image hash...");

        // Now recompute canonical image hash in browser
        // We need the raw RGB bytes (row-major) and width/height and mode='RGB'
        const img = new Image();
        img.src = dataURL;
        img.onload = async () => {
          const width = img.naturalWidth;
          const height = img.naturalHeight;

          // draw to canvas
          let canvas = canvasRef.current;
          if (!canvas) {
            canvas = document.createElement("canvas");
            canvasRef.current = canvas;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const imData = ctx.getImageData(0, 0, width, height);
          const rgba = imData.data; // Uint8ClampedArray (RGBA)
          // convert to RGB (drop alpha)
          const rgb = new Uint8Array(width * height * 3);
          let ri = 0;
          for (let i = 0; i < rgba.length; i += 4) {
            rgb[ri++] = rgba[i]; // R
            rgb[ri++] = rgba[i + 1]; // G
            rgb[ri++] = rgba[i + 2]; // B
          }
          // Build the same header: `${width}x${height}:RGB:`
          const headerStr = `${width}x${height}:RGB:`;
          const headerBytes = new TextEncoder().encode(headerStr);
          // compute SHA-256 over headerBytes + rgb
          const combined = new Uint8Array(headerBytes.length + rgb.length);
          combined.set(headerBytes, 0);
          combined.set(rgb, headerBytes.length);
          const digest = await crypto.subtle.digest("SHA-256", combined);
          const digestHex = Array.from(new Uint8Array(digest))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          setRecomputedHash(digestHex);

          // compare with embedded image_hash
          const expectedHash = extractedProof.image_hash;
          if (digestHex !== expectedHash) {
            setStatus(
              "Image pixel hash mismatch! Image may have been tampered."
            );
            setErrors("Pixel hash mismatch");
            return;
          } else {
            setStatus("Pixel hash matches. Verifying signature...");
          }

          // Reconstruct canonical payload (payload keys except signature) sorted
          const payload = {};
          for (const k of Object.keys(extractedProof)) {
            if (k === "signature") continue;
            payload[k] = extractedProof[k];
          }
          const msgBytes = canonicalPayloadBytes(payload);

          // signature & public key
          const signatureB64 = extractedProof.signature;
          const sigBytes = Uint8Array.from(atob(signatureB64), (c) =>
            c.charCodeAt(0)
          );

          const publicKeyB64 = extractedProof.public_key_b64;
          if (!publicKeyB64) {
            setStatus("No embedded public_key_b64 in proof. Cannot verify.");
            setErrors("Missing public key in proof");
            return;
          }
          const pubBytes = Uint8Array.from(atob(publicKeyB64), (c) =>
            c.charCodeAt(0)
          );

          // use noble-ed25519 to verify
          try {
            const ok = await ed.verify(sigBytes, msgBytes, pubBytes);
            if (ok) {
              setStatus("✅ Signature valid. Proof verified.");
            } else {
              setStatus("❌ Signature verification FAILED.");
              setErrors("Signature invalid");
            }
          } catch (ex) {
            setStatus("Error verifying signature: " + String(ex));
            setErrors(String(ex));
          }
        }; // img.onload
      } catch (err) {
        setStatus("Error processing file: " + String(err));
        setErrors(String(err));
      }
    };
    reader.onerror = (e) => {
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
          <strong>Recomputed pixel hash:</strong> <code>{recomputedHash}</code>
        </div>
      )}
      {/* hidden canvas for computation */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
