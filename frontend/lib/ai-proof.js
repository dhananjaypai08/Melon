import crypto from "crypto";

/**
 * AI Proof utilities for generating and verifying AI content proofs
 * Server-side optimized version
 */
export class AIProofEngine {
  constructor() {
    this.privateKey = process.env.AI_PROOF_PRIVATE_KEY;
    this.publicKey = process.env.AI_PROOF_PUBLIC_KEY;

    if (!this.privateKey || !this.publicKey) {
      throw new Error(
        "AI proof keys not configured in environment. Please set AI_PROOF_PRIVATE_KEY and AI_PROOF_PUBLIC_KEY"
      );
    }
  }

  // Canonical JSON serialization (same as hardware proof)
  canonicalPayload(payload) {
    return JSON.stringify(payload, Object.keys(payload).sort());
  }

  // Hash image content from base64
  hashImageContent(base64Data) {
    try {
      const imageBuffer = Buffer.from(base64Data, "base64");
      return crypto.createHash("sha256").update(imageBuffer).digest("hex");
    } catch (error) {
      console.error("Error hashing image content:", error);
      throw new Error("Failed to hash image content");
    }
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
      throw new Error("Failed to sign payload: " + error.message);
    }
  }

  // Create complete AI proof
  createAIProof(prompt, aiModel, base64Image) {
    try {
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
    } catch (error) {
      console.error("Error creating AI proof:", error);
      throw new Error("Failed to create AI proof: " + error.message);
    }
  }

  // Convert image to JPEG and embed proof using manual EXIF (server-side with Sharp)
  async embedProofIntoImage(base64Image, proof) {
    try {
      // Check if Sharp is available (server-side)
      let sharp;
      try {
        sharp = (await import("sharp")).default;
      } catch (sharpError) {
        console.warn("Sharp not available, using fallback method");
        return this.embedProofManually(base64Image, proof);
      }

      const imageBuffer = Buffer.from(base64Image, "base64");

      // Create proof JSON string
      const proofJson = JSON.stringify(proof);

      // Convert to JPEG first
      const jpegBuffer = await sharp(imageBuffer)
        .jpeg({
          quality: 95,
          mozjpeg: true,
        })
        .toBuffer();

      // Manually embed EXIF with UserComment
      const jpegWithProof = this.manuallyEmbedExif(jpegBuffer, proofJson);

      console.log("✅ Sharp-based EXIF embedding successful");
      return Buffer.from(jpegWithProof).toString("base64");
    } catch (error) {
      console.error("Error embedding proof into image:", error);
      console.log("Returning original image without embedded proof");
      return base64Image;
    }
  }

  // Fallback method without Sharp
  embedProofManually(base64Image, proof) {
    try {
      const imageBuffer = Buffer.from(base64Image, "base64");
      const proofJson = JSON.stringify(proof);

      // Simple manual EXIF embedding
      const jpegWithProof = this.manuallyEmbedExif(imageBuffer, proofJson);

      console.log("✅ Manual EXIF embedding successful");
      return Buffer.from(jpegWithProof).toString("base64");
    } catch (error) {
      console.error("Manual embedding failed:", error);
      return base64Image;
    }
  }

  // Manually embed EXIF with UserComment (this actually works)
  manuallyEmbedExif(jpegBuffer, proofJson) {
    try {
      // Create UserComment data
      const proofBytes = Buffer.from(proofJson, "utf8");

      // Create TIFF header
      const tiffHeader = Buffer.alloc(8);
      tiffHeader.writeUInt16LE(0x4949, 0); // Little endian marker
      tiffHeader.writeUInt16LE(42, 2); // TIFF magic number
      tiffHeader.writeUInt32LE(8, 4); // Offset to first IFD

      // Create IFD entry for UserComment (tag 0x9286)
      const ifdEntry = Buffer.alloc(12);
      ifdEntry.writeUInt16LE(0x9286, 0); // UserComment tag
      ifdEntry.writeUInt16LE(7, 2); // Type: UNDEFINED
      ifdEntry.writeUInt32LE(proofBytes.length, 4); // Count
      ifdEntry.writeUInt32LE(22, 8); // Offset to data

      // Create IFD
      const ifd = Buffer.alloc(18);
      ifd.writeUInt16LE(1, 0); // Number of directory entries
      ifdEntry.copy(ifd, 2);
      ifd.writeUInt32LE(0, 14); // Offset to next IFD

      // Calculate correct offset for UserComment data
      const dataOffset = 8 + ifd.length;
      ifd.writeUInt32LE(dataOffset, 10);

      // Combine EXIF data
      const exifData = Buffer.concat([tiffHeader, ifd, proofBytes]);

      // Create APP1 segment
      const exifIdentifier = Buffer.from("Exif\0\0", "ascii");
      const app1Data = Buffer.concat([exifIdentifier, exifData]);
      const app1Length = app1Data.length + 2;

      const app1Segment = Buffer.alloc(app1Length + 2);
      app1Segment.writeUInt16BE(0xffe1, 0); // APP1 marker
      app1Segment.writeUInt16BE(app1Length, 2); // Length
      app1Data.copy(app1Segment, 4);

      // Insert APP1 segment right after SOI marker
      const result = Buffer.concat([
        jpegBuffer.subarray(0, 2), // SOI marker (FF D8)
        app1Segment, // Our EXIF APP1 segment
        jpegBuffer.subarray(2), // Rest of JPEG data
      ]);

      return result;
    } catch (error) {
      console.error("Manual EXIF embedding failed:", error);
      throw error;
    }
  }

  // Complete process: create proof and embed in image
  async processAIImage(prompt, aiModel, base64Image) {
    try {
      console.log("Creating AI proof...");
      const proof = this.createAIProof(prompt, aiModel, base64Image);

      console.log("Embedding proof into image...");
      const imageWithProof = await this.embedProofIntoImage(base64Image, proof);

      return {
        imageWithProof,
        proof,
      };
    } catch (error) {
      console.error("Error processing AI image:", error);
      throw new Error("Failed to process AI image: " + error.message);
    }
  }
}
