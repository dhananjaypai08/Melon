export class AIVerificationEngine {
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

  // Canonical JSON serialization (exactly like server)
  canonicalPayload(payload) {
    return JSON.stringify(payload, Object.keys(payload).sort());
  }

  // Simple EXIF parser (reusing from hardware verification)
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

    // Parse EXIF data structure
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

  // Parse Individual Field Directory with enhanced UserComment detection
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
        // Undefined (raw bytes) - this is what Sharp uses for UserComment
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

      // UserComment is tag 0x9286 - Enhanced detection
      if (tag === 0x9286) {
        debugLog.push(
          `Found UserComment tag! Type: ${type}, Count: ${count}, ValueOffset: ${valueOffset}`
        );

        let dataOffset = count <= 4 ? currentOffset + 8 : valueOffset;
        if (dataOffset + count <= exifData.length) {
          const userCommentData = new Uint8Array(
            exifData.buffer,
            exifData.byteOffset + dataOffset,
            count
          );

          debugLog.push(`UserComment data length: ${userCommentData.length}`);
          debugLog.push(
            `First 20 bytes: ${Array.from(userCommentData.slice(0, 20))
              .map((b) => "0x" + b.toString(16).padStart(2, "0"))
              .join(" ")}`
          );

          // Try multiple approaches to decode the UserComment
          let userCommentString = null;

          // Approach 1: Direct UTF-8 decode
          try {
            userCommentString = new TextDecoder("utf-8", {
              fatal: false,
            }).decode(userCommentData);
            debugLog.push(
              `Direct decode attempt: ${userCommentString.slice(0, 50)}...`
            );
          } catch (e) {
            debugLog.push(`Direct decode failed: ${e.message}`);
          }

          // Approach 2: Skip potential charset identifier (Sharp sometimes adds this)
          if (!userCommentString || !userCommentString.includes("proof_type")) {
            try {
              // Sharp might add charset info at the beginning, try skipping first 8 bytes
              const skipBytes = 8;
              if (userCommentData.length > skipBytes) {
                const skippedData = userCommentData.slice(skipBytes);
                userCommentString = new TextDecoder("utf-8", {
                  fatal: false,
                }).decode(skippedData);
                debugLog.push(
                  `Skip-${skipBytes} decode attempt: ${userCommentString.slice(
                    0,
                    50
                  )}...`
                );
              }
            } catch (e) {
              debugLog.push(`Skip decode failed: ${e.message}`);
            }
          }

          // Approach 3: Look for JSON start marker
          if (!userCommentString || !userCommentString.includes("proof_type")) {
            try {
              // Find the first '{' character
              let jsonStart = -1;
              for (let j = 0; j < userCommentData.length; j++) {
                if (userCommentData[j] === 0x7b) {
                  // '{'
                  jsonStart = j;
                  break;
                }
              }

              if (jsonStart >= 0) {
                const jsonData = userCommentData.slice(jsonStart);
                userCommentString = new TextDecoder("utf-8", {
                  fatal: false,
                }).decode(jsonData);
                debugLog.push(
                  `JSON-marker decode attempt: ${userCommentString.slice(
                    0,
                    50
                  )}...`
                );
              }
            } catch (e) {
              debugLog.push(`JSON-marker decode failed: ${e.message}`);
            }
          }

          // Clean and try to parse
          if (userCommentString) {
            const cleanString = userCommentString.replace(/\0/g, "").trim();
            debugLog.push(`Cleaned string length: ${cleanString.length}`);

            try {
              const parsed = JSON.parse(cleanString);
              debugLog.push("✅ Successfully parsed UserComment JSON");
              tags[tag] = parsed; // Store parsed JSON instead of raw bytes
            } catch (e) {
              debugLog.push(
                `❌ Failed to parse UserComment as JSON: ${e.message}`
              );
              debugLog.push(
                `Clean string preview: ${cleanString.slice(0, 100)}`
              );

              // Store as string for further debugging
              tags[tag] = cleanString;
            }
          } else {
            debugLog.push(
              "❌ No valid string could be decoded from UserComment"
            );
            tags[tag] = userCommentData; // Keep raw bytes for debugging
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

  // Hash image content (same method as server)
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

          // Get clean image bytes without EXIF
          canvas.toBlob(
            async (blob) => {
              try {
                const cleanImageBytes = await blob.arrayBuffer();

                // Hash the clean image bytes
                const hashBuffer = await crypto.subtle.digest(
                  "SHA-256",
                  cleanImageBytes
                );
                const hashHex = this.arrayBufferToHex(hashBuffer);
                resolve(hashHex);
              } catch (error) {
                reject(error);
              }
            },
            "image/png",
            1.0
          );
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
      console.error("Signature verification error:", error);
      return false;
    }
  }

  // Extract proof from image using both Sharp and manual parsing
  async extractProofFromImage(file) {
    try {
      // First try using Sharp to extract metadata
      const buffer = await file.arrayBuffer();

      // Try to import Sharp dynamically (only available server-side)
      try {
        const sharp = (await import("sharp")).default;
        const metadata = await sharp(buffer).metadata();

        if (metadata.exif) {
          console.log("Found EXIF metadata with Sharp");

          // Parse the EXIF buffer to find UserComment
          const userComment = this.parseUserCommentFromExif(metadata.exif);
          if (userComment) {
            console.log("Extracted UserComment from Sharp metadata");
            const proof = JSON.parse(userComment);
            return proof;
          }
        }
      } catch (sharpError) {
        console.log(
          "Sharp not available (client-side) or metadata extraction failed, trying manual approach"
        );
      }

      // Fallback to manual EXIF parsing (works both client and server side)
      const exifResult = this.parseExifLikePiexif(buffer);
      if (!exifResult.exifDict) {
        throw new Error("No EXIF data found in image");
      }

      // Get UserComment from Exif IFD
      const userComment = exifResult.exifDict.Exif[0x9286];
      if (!userComment) {
        throw new Error("No AI proof found in EXIF UserComment");
      }

      let proof;
      if (typeof userComment === "string") {
        // Sharp stores UserComment as string
        proof = JSON.parse(userComment);
      } else if (
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

      return proof;
    } catch (error) {
      throw new Error(`Failed to extract proof: ${error.message}`);
    }
  }

  // Parse UserComment from raw EXIF buffer
  parseUserCommentFromExif(exifBuffer) {
    try {
      // Convert to Uint8Array if needed
      const buffer =
        exifBuffer instanceof ArrayBuffer
          ? new Uint8Array(exifBuffer)
          : exifBuffer;

      // Look for UserComment tag (0x9286) in the EXIF data
      for (let i = 0; i < buffer.length - 20; i++) {
        // Check for UserComment tag in little endian
        if (buffer[i] === 0x86 && buffer[i + 1] === 0x92) {
          // Found potential UserComment tag
          try {
            // Skip ahead to find the data
            let dataStart = i + 12; // Basic offset

            // Look for JSON-like data starting with {
            for (
              let j = dataStart;
              j < Math.min(dataStart + 100, buffer.length - 50);
              j++
            ) {
              if (buffer[j] === 0x7b) {
                // '{' character
                // Found start of JSON, extract until we find the end
                let jsonEnd = j;
                let braceCount = 0;
                for (let k = j; k < buffer.length; k++) {
                  if (buffer[k] === 0x7b) braceCount++; // '{'
                  else if (buffer[k] === 0x7d) braceCount--; // '}'

                  if (braceCount === 0) {
                    jsonEnd = k;
                    break;
                  }
                }

                if (jsonEnd > j) {
                  const jsonBytes = buffer.slice(j, jsonEnd + 1);
                  const jsonString = new TextDecoder("utf-8").decode(jsonBytes);

                  // Validate it looks like our proof
                  if (
                    jsonString.includes("proof_type") &&
                    jsonString.includes("ai_generated")
                  ) {
                    return jsonString;
                  }
                }
              }
            }
          } catch (e) {
            // Continue searching
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Error parsing UserComment from EXIF:", error);
      return null;
    }
  }

  // Main verification function for AI images
  async verifyAIImageProof(file) {
    try {
      // Extract proof from image
      const proof = await this.extractProofFromImage(file);

      // Verify this is an AI proof
      if (proof.proof_type !== "ai_generated") {
        throw new Error("This is not an AI-generated image proof");
      }

      // Verify required fields
      if (
        !proof.image_hash ||
        !proof.signature ||
        !proof.public_key_b64 ||
        !proof.prompt ||
        !proof.ai_model
      ) {
        throw new Error("Invalid AI proof format - missing required fields");
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

      // Canonicalize payload
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

      if (signatureValid && debug.hashMatch) {
        return {
          verificationResult: {
            success: true,
            message: "AI image authenticity verified successfully!",
            details: { ...debug, signatureValid: true },
            proofType: "ai_generated",
          },
          debugInfo: debug,
          proofData: proof,
          exifDebugInfo: {
            exifDict: { Exif: { 0x9286: proof } },
            debugLog: ["Proof extracted successfully"],
          },
        };
      } else {
        return {
          verificationResult: {
            success: false,
            message: !signatureValid
              ? "Signature verification failed"
              : "Image content has been modified",
            details: { ...debug, signatureValid },
            proofType: "ai_generated",
          },
          debugInfo: debug,
          proofData: proof,
          exifDebugInfo: {
            exifDict: { Exif: { 0x9286: proof } },
            debugLog: ["Proof extracted but verification failed"],
          },
        };
      }
    } catch (error) {
      throw error;
    }
  }
}
