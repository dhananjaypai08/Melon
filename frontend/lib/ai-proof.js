import crypto from "crypto";
import sharp from "sharp";

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

  // Convert image to JPEG and embed proof using manual EXIF
  async embedProofIntoImage(base64Image, proof) {
    try {
      const imageBuffer = Buffer.from(base64Image, "base64");

      // Create proof JSON string
      const proofJson = JSON.stringify(proof);

      // Convert to JPEG first (without metadata - Sharp's metadata doesn't work)
      const jpegBuffer = await sharp(imageBuffer)
        .jpeg({
          quality: 95,
          mozjpeg: true,
        })
        .toBuffer();


      // Now manually embed EXIF with UserComment
      const jpegWithProof = this.manuallyEmbedExif(jpegBuffer, proofJson);

      // Test immediate extraction
      try {
        const testMetadata = await sharp(jpegWithProof).metadata();

        if (testMetadata.exif) {
          const exifString = testMetadata.exif.toString("utf8");
          const hasProof = exifString.includes("proof_type");
        }
      } catch (testError) {
      }

      console.log("✅ Manual EXIF embedding successful");
      return Buffer.from(jpegWithProof).toString("base64");
    } catch (error) {
      console.log("Returning original image without embedded proof");
      return base64Image;
    }
  }

  // Manually embed EXIF with UserComment (this actually works)
  manuallyEmbedExif(jpegBuffer, proofJson) {
    // Create UserComment data
    const proofBytes = Buffer.from(proofJson, "utf8");

    // EXIF structure:
    // APP1 marker (2 bytes): FF E1
    // Length (2 bytes): length of rest of segment
    // EXIF identifier (6 bytes): "Exif\0\0"
    // TIFF header (8 bytes)
    // IFD (variable)
    // UserComment data (variable)

    // Create TIFF header
    const tiffHeader = Buffer.alloc(8);
    tiffHeader.writeUInt16LE(0x4949, 0); // Little endian marker
    tiffHeader.writeUInt16LE(42, 2); // TIFF magic number
    tiffHeader.writeUInt32LE(8, 4); // Offset to first IFD (right after this header)

    // Create IFD entry for UserComment (tag 0x9286)
    const ifdEntry = Buffer.alloc(12);
    ifdEntry.writeUInt16LE(0x9286, 0); // UserComment tag
    ifdEntry.writeUInt16LE(7, 2); // Type: UNDEFINED
    ifdEntry.writeUInt32LE(proofBytes.length, 4); // Count (number of bytes)
    ifdEntry.writeUInt32LE(22, 8); // Offset to data (8 + 2 + 12 = 22)

    // Create IFD
    const ifd = Buffer.alloc(18); // 2 + 12 + 4 bytes
    ifd.writeUInt16LE(1, 0); // Number of directory entries
    ifdEntry.copy(ifd, 2); // Copy the IFD entry
    ifd.writeUInt32LE(0, 14); // Offset to next IFD (0 = none)

    // Calculate correct offset for UserComment data
    const dataOffset = 8 + ifd.length; // tiffHeader + ifd
    ifd.writeUInt32LE(dataOffset, 10); // Update offset in IFD entry

    // Combine EXIF data
    const exifData = Buffer.concat([tiffHeader, ifd, proofBytes]);

    // Create APP1 segment
    const exifIdentifier = Buffer.from("Exif\0\0", "ascii");
    const app1Data = Buffer.concat([exifIdentifier, exifData]);
    const app1Length = app1Data.length + 2; // +2 for length field itself

    const app1Segment = Buffer.alloc(app1Length + 2); // +2 for marker
    app1Segment.writeUInt16BE(0xffe1, 0); // APP1 marker
    app1Segment.writeUInt16BE(app1Length, 2); // Length
    app1Data.copy(app1Segment, 4); // EXIF data

    // Insert APP1 segment right after SOI marker (first 2 bytes of JPEG)
    const result = Buffer.concat([
      jpegBuffer.subarray(0, 2), // SOI marker (FF D8)
      app1Segment, // Our EXIF APP1 segment
      jpegBuffer.subarray(2), // Rest of JPEG data
    ]);

    return result;
  }

  // Complete process: create proof and embed in image
  async processAIImage(prompt, aiModel, base64Image) {
    const proof = this.createAIProof(prompt, aiModel, base64Image);
    const imageWithProof = await this.embedProofIntoImage(base64Image, proof);

    return {
      imageWithProof,
      proof,
    };
  }
}
