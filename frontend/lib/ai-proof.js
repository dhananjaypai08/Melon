import crypto from "crypto";
import { createCanvas, loadImage } from "canvas";
import piexif from "piexifjs";

/**
 * AI Proof utilities for generating and verifying AI content proofs
 */
export class AIProofEngine {
  constructor() {
    this.privateKey = process.env.AI_PROOF_PRIVATE_KEY;
    this.publicKey = process.env.AI_PROOF_PUBLIC_KEY;

    if (!this.privateKey || !this.publicKey) {
      throw new Error("AI proof keys not configured in environment");
    }
  }

  // Canonical JSON serialization (same as hardware proof)
  canonicalPayload(payload) {
    return JSON.stringify(payload, Object.keys(payload).sort());
  }

  // Hash image content from base64
  hashImageContent(base64Data) {
    const imageBuffer = Buffer.from(base64Data, "base64");
    return crypto.createHash("sha256").update(imageBuffer).digest("hex");
  }

  // Generate cryptographic nonce
  generateNonce() {
    return crypto.randomBytes(16).toString("hex");
  }

  // Sign payload with Ed25519
  signPayload(payload) {
    try {
      const privateKeyBuffer = Buffer.from(this.privateKey, "base64");
      const privateKeyObj = crypto.createPrivateKey({
        key: privateKeyBuffer,
        format: "der",
        type: "pkcs8",
      });

      const message = Buffer.from(this.canonicalPayload(payload), "utf-8");
      const signature = crypto.sign(null, message, privateKeyObj);

      return signature.toString("base64");
    } catch (error) {
      console.error("Signing error:", error);
      throw new Error("Failed to sign payload");
    }
  }

  // Create complete AI proof
  createAIProof(prompt, aiModel, base64Image) {
    const timestamp = new Date().toISOString();
    const nonce = this.generateNonce();
    const imageHash = this.hashImageContent(base64Image);

    // Create payload (without signature first)
    const payload = {
      prompt: prompt,
      ai_model: aiModel,
      timestamp: timestamp,
      image_hash: imageHash,
      nonce: nonce,
      proof_type: "ai_generated",
      public_key_b64: this.publicKey,
    };

    // Sign the payload
    const signature = this.signPayload(payload);

    // Add signature to payload
    payload.signature = signature;

    return payload;
  }

  // Embed proof into image EXIF
  embedProofIntoImage(base64Image, proof) {
    try {
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(base64Image, "base64");

      // Create EXIF data
      const proofJson = JSON.stringify(proof);
      const exifDict = {
        "0th": {},
        Exif: {
          [piexif.ExifIFD.UserComment]: proofJson,
        },
        GPS: {},
        "1st": {},
        thumbnail: null,
      };

      // Generate EXIF bytes
      const exifBytes = piexif.dump(exifDict);

      // Insert EXIF into image
      const newImageBuffer = piexif.insert(exifBytes, imageBuffer);

      // Convert back to base64
      return Buffer.from(newImageBuffer).toString("base64");
    } catch (error) {
      console.error("EXIF embedding error:", error);
      throw new Error("Failed to embed proof into image");
    }
  }

  // Complete process: create proof and embed in image
  processAIImage(prompt, aiModel, base64Image) {
    const proof = this.createAIProof(prompt, aiModel, base64Image);
    const imageWithProof = this.embedProofIntoImage(base64Image, proof);

    return {
      imageWithProof,
      proof,
    };
  }
}
