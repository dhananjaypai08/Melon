export class VerificationEngine {
  // Convert ArrayBuffer to hex string
  arrayBufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Base64 decode function
  base64Decode(str) {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // Canonical JSON serialization (exactly like Python)
  canonicalPayload(payload) {
    return JSON.stringify(payload, Object.keys(payload).sort());
  }

  // Simple EXIF parser that mimics piexif behavior
  parseExifLikePiexif(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    const debugLog = [];

    // Find EXIF segment
    if (view.getUint16(0) !== 0xffd8) {
      throw new Error("Not a valid JPEG file");
    }

    let offset = 2;
    let exifData = null;

    while (offset < view.byteLength - 1) {
      const marker = view.getUint16(offset);

      if (marker === 0xffe1) {
        // APP1 segment
        const segmentLength = view.getUint16(offset + 2);

        // Check for EXIF header
        const exifHeader = new Uint8Array(arrayBuffer, offset + 4, 6);
        const exifString = String.fromCharCode.apply(null, exifHeader);

        if (exifString === "Exif\0\0") {
          exifData = new Uint8Array(
            arrayBuffer,
            offset + 10,
            segmentLength - 8
          );
          debugLog.push(`Found EXIF data: ${exifData.length} bytes`);
          break;
        }
      }

      if ((marker & 0xff00) !== 0xff00) break;
      const segmentLength = view.getUint16(offset + 2);
      offset += 2 + segmentLength;
    }

    if (!exifData) {
      debugLog.push("No EXIF data found");
      return { exifDict: null, debugLog };
    }

    // Parse EXIF data structure (similar to piexif)
    const exifView = new DataView(
      exifData.buffer,
      exifData.byteOffset,
      exifData.byteLength
    );

    // Check byte order
    const byteOrder = exifView.getUint16(0);
    const littleEndian = byteOrder === 0x4949;
    debugLog.push(`Byte order: ${littleEndian ? "Little" : "Big"} Endian`);

    if (byteOrder !== 0x4949 && byteOrder !== 0x4d4d) {
      debugLog.push("Invalid TIFF header");
      return { exifDict: null, debugLog };
    }

    const tiffMagic = exifView.getUint16(2, littleEndian);
    if (tiffMagic !== 42) {
      debugLog.push("Invalid TIFF magic number");
      return { exifDict: null, debugLog };
    }

    let ifdOffset = exifView.getUint32(4, littleEndian);
    const exifDict = {
      "0th": {},
      Exif: {},
      GPS: {},
      "1st": {},
      thumbnail: null,
    };

    // Parse main IFD (0th)
    if (ifdOffset < exifData.length) {
      const mainIfd = this.parseIFD(
        exifView,
        ifdOffset,
        littleEndian,
        exifData,
        debugLog
      );
      exifDict["0th"] = mainIfd.tags;

      // Check for Exif IFD pointer (tag 0x8769)
      if (mainIfd.tags[0x8769]) {
        const exifIfdOffset = mainIfd.tags[0x8769];
        debugLog.push(`Found Exif IFD pointer at offset: ${exifIfdOffset}`);

        if (exifIfdOffset < exifData.length) {
          const exifIfd = this.parseIFD(
            exifView,
            exifIfdOffset,
            littleEndian,
            exifData,
            debugLog
          );
          exifDict["Exif"] = exifIfd.tags;
          debugLog.push(
            `Exif IFD parsed, found ${Object.keys(exifIfd.tags).length} tags`
          );
        }
      }
    }

    return { exifDict, debugLog };
  }

  // Parse Individual Field Directory
  parseIFD(view, offset, littleEndian, exifData, debugLog) {
    const tags = {};

    if (offset + 2 > exifData.length) {
      debugLog.push("IFD offset out of bounds");
      return { tags, nextIfdOffset: 0 };
    }

    const entryCount = view.getUint16(offset, littleEndian);
    debugLog.push(`IFD at ${offset}: ${entryCount} entries`);

    let currentOffset = offset + 2;

    for (
      let i = 0;
      i < entryCount && currentOffset + 12 <= exifData.length;
      i++
    ) {
      const tag = view.getUint16(currentOffset, littleEndian);
      const type = view.getUint16(currentOffset + 2, littleEndian);
      const count = view.getUint32(currentOffset + 4, littleEndian);
      const valueOffset = view.getUint32(currentOffset + 8, littleEndian);

      let value = null;

      // Handle different data types
      if (type === 2) {
        // ASCII string
        let dataOffset = count <= 4 ? currentOffset + 8 : valueOffset;
        if (dataOffset + count <= exifData.length) {
          const stringData = new Uint8Array(
            exifData.buffer,
            exifData.byteOffset + dataOffset,
            count
          );
          value = new TextDecoder("utf-8", { fatal: false })
            .decode(stringData)
            .replace(/\0+$/, "");
        }
      } else if (type === 7) {
        // Undefined (raw bytes)
        let dataOffset = count <= 4 ? currentOffset + 8 : valueOffset;
        if (dataOffset + count <= exifData.length) {
          value = new Uint8Array(
            exifData.buffer,
            exifData.byteOffset + dataOffset,
            count
          );
        }
      } else if (type === 3) {
        // Short
        value =
          count <= 2
            ? view.getUint16(currentOffset + 8, littleEndian)
            : valueOffset;
      } else if (type === 4) {
        // Long
        value = valueOffset;
      } else {
        value = valueOffset;
      }

      tags[tag] = value;

      // UserComment is tag 0x9286
      if (tag === 0x9286) {
        debugLog.push(`Found UserComment tag! Type: ${type}, Count: ${count}`);

        let dataOffset = count <= 4 ? currentOffset + 8 : valueOffset;
        if (dataOffset + count <= exifData.length) {
          const userCommentData = new Uint8Array(
            exifData.buffer,
            exifData.byteOffset + dataOffset,
            count
          );

          // Convert to string and try to parse JSON
          const userCommentString = new TextDecoder("utf-8", {
            fatal: false,
          }).decode(userCommentData);
          const cleanString = userCommentString.replace(/\0/g, "").trim();

          debugLog.push(`UserComment string length: ${cleanString.length}`);

          try {
            const parsed = JSON.parse(cleanString);
            debugLog.push("✅ Successfully parsed UserComment JSON");
            tags[tag] = parsed; // Store parsed JSON instead of raw bytes
          } catch (e) {
            debugLog.push(
              `❌ Failed to parse UserComment as JSON: ${e.message}`
            );
            tags[tag] = userCommentData; // Keep raw bytes
          }
        }
      }

      currentOffset += 12;
    }

    // Get next IFD offset
    let nextIfdOffset = 0;
    if (currentOffset + 4 <= exifData.length) {
      nextIfdOffset = view.getUint32(currentOffset, littleEndian);
    }

    return { tags, nextIfdOffset };
  }

  // Hash image content (matching Python strip_exif_and_hash exactly)
  async hashImageContent(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      img.onload = async () => {
        try {
          // Set canvas to exact image dimensions
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw image to canvas (this removes EXIF)
          ctx.drawImage(img, 0, 0);

          // Get clean JPEG bytes without EXIF (quality 95 to match Python)
          canvas.toBlob(
            async (blob) => {
              try {
                const cleanJpegBytes = await blob.arrayBuffer();

                // Hash the clean JPEG bytes (exactly like Python)
                const hashBuffer = await crypto.subtle.digest(
                  "SHA-256",
                  cleanJpegBytes
                );
                const hashHex = this.arrayBufferToHex(hashBuffer);
                resolve(hashHex);
              } catch (error) {
                // Fallback: try the pixel-based approach like Python's canonical_image_hash
                try {
                  // Get image data (pixels)
                  const imageData = ctx.getImageData(
                    0,
                    0,
                    img.width,
                    img.height
                  );

                  // Create hash of dimensions and pixel data (like Python fallback)
                  const dimensionsStr = `${img.width}x${img.height}`;
                  const dimensionsBytes = new TextEncoder().encode(
                    dimensionsStr
                  );
                  const pixelBytes = new Uint8Array(imageData.data.buffer);

                  // Combine dimensions and pixel data
                  const combinedData = new Uint8Array(
                    dimensionsBytes.length + pixelBytes.length
                  );
                  combinedData.set(dimensionsBytes, 0);
                  combinedData.set(pixelBytes, dimensionsBytes.length);

                  const hashBuffer = await crypto.subtle.digest(
                    "SHA-256",
                    combinedData
                  );
                  const hashHex = this.arrayBufferToHex(hashBuffer);
                  resolve(hashHex);
                } catch (fallbackError) {
                  reject(fallbackError);
                }
              }
            },
            "image/jpeg",
            0.95
          ); // Quality 95 to match Python
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error("Failed to load image for hashing"));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Verify Ed25519 signature
  async verifyEd25519Signature(message, signature, publicKeyBytes) {
    try {
      const publicKey = await crypto.subtle.importKey(
        "raw",
        publicKeyBytes,
        { name: "Ed25519" },
        false,
        ["verify"]
      );

      return await crypto.subtle.verify(
        "Ed25519",
        publicKey,
        signature,
        message
      );
    } catch (error) {
      return false;
    }
  }

  // Main verification function
  async verifyImageProof(file) {
    try {
      // Read file
      const arrayBuffer = await file.arrayBuffer();

      // Extract proof from EXIF (using piexif-like approach)
      const exifResult = this.parseExifLikePiexif(arrayBuffer);

      if (!exifResult.exifDict) {
        throw new Error("No EXIF data found in image");
      }

      // Get UserComment from Exif IFD
      const userComment = exifResult.exifDict.Exif[0x9286];
      if (!userComment) {
        throw new Error("No proof found in EXIF UserComment");
      }

      let proof;
      if (
        typeof userComment === "object" &&
        !(userComment instanceof Uint8Array)
      ) {
        proof = userComment;
      } else if (userComment instanceof Uint8Array) {
        const userCommentString = new TextDecoder("utf-8", {
          fatal: false,
        }).decode(userComment);
        const cleanString = userCommentString.replace(/\0/g, "").trim();
        proof = JSON.parse(cleanString);
      } else {
        throw new Error("Invalid UserComment format");
      }

      // Verify required fields
      if (!proof.image_hash || !proof.signature || !proof.public_key_b64) {
        throw new Error("Invalid proof format - missing required fields");
      }

      // Hash the image content
      const recomputedHash = await this.hashImageContent(file);
      const expectedHash = proof.image_hash;

      const debug = {
        recomputedHash,
        expectedHash,
        hashMatch: recomputedHash === expectedHash,
      };

      // Reconstruct payload for signature verification (exclude signature)
      const payload = { ...proof };
      delete payload.signature;

      // Canonicalize payload (exactly like Python)
      const canonicalMessage = this.canonicalPayload(payload);
      const messageBytes = new TextEncoder().encode(canonicalMessage);

      // Decode signature and public key
      const signature = this.base64Decode(proof.signature);
      const publicKeyBytes = this.base64Decode(proof.public_key_b64);

      // Verify Ed25519 signature
      const signatureValid = await this.verifyEd25519Signature(
        messageBytes,
        signature,
        publicKeyBytes
      );

      if (signatureValid) {
        return {
          verificationResult: {
            success: true,
            message: "Image authenticity verified successfully!",
            details: { ...debug, signatureValid: true },
          },
          debugInfo: debug,
          proofData: proof,
          exifDebugInfo: exifResult,
        };
      } else {
        return {
          verificationResult: {
            success: false,
            message: "Signature verification failed",
            details: { ...debug, signatureValid: false },
          },
          debugInfo: debug,
          proofData: proof,
          exifDebugInfo: exifResult,
        };
      }
    } catch (error) {
      throw error;
    }
  }
}
