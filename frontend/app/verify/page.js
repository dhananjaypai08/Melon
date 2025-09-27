"use client";
import React, { useState } from "react";
import {
  Upload,
  CheckCircle,
  XCircle,
  FileImage,
  Shield,
  AlertTriangle,
  Eye,
  Bug,
} from "lucide-react";

const ImageProofVerifier = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [proofData, setProofData] = useState(null);
  const [exifDebugInfo, setExifDebugInfo] = useState(null);

  // Convert ArrayBuffer to hex string
  const arrayBufferToHex = (buffer) => {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  // Base64 decode function
  const base64Decode = (str) => {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  // Canonical JSON serialization (exactly like Python)
  const canonicalPayload = (payload) => {
    return JSON.stringify(payload, Object.keys(payload).sort());
  };

  // Simple EXIF parser that mimics piexif behavior
  const parseExifLikePiexif = (arrayBuffer) => {
    const view = new DataView(arrayBuffer);
    const debugLog = [];

    console.log("🔍 Parsing JPEG for EXIF...");

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
          console.log(`📦 Found EXIF data: ${exifData.length} bytes`);
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
      const mainIfd = parseIFD(
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
        console.log(`📍 Found Exif IFD pointer at offset: ${exifIfdOffset}`);
        debugLog.push(`Found Exif IFD pointer at offset: ${exifIfdOffset}`);

        if (exifIfdOffset < exifData.length) {
          const exifIfd = parseIFD(
            exifView,
            exifIfdOffset,
            littleEndian,
            exifData,
            debugLog
          );
          exifDict["Exif"] = exifIfd.tags;
          console.log(
            `📋 Exif IFD parsed, found ${Object.keys(exifIfd.tags).length} tags`
          );
          debugLog.push(
            `Exif IFD parsed, found ${Object.keys(exifIfd.tags).length} tags`
          );
        }
      }
    }

    return { exifDict, debugLog };
  };

  // Parse Individual Field Directory
  const parseIFD = (view, offset, littleEndian, exifData, debugLog) => {
    const tags = {};

    if (offset + 2 > exifData.length) {
      debugLog.push("IFD offset out of bounds");
      return { tags, nextIfdOffset: 0 };
    }

    const entryCount = view.getUint16(offset, littleEndian);
    console.log(`📋 IFD at ${offset}: ${entryCount} entries`);
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

      console.log(
        `  🏷️  Tag: 0x${tag.toString(
          16
        )} Type: ${type} Count: ${count} Value/Offset: ${valueOffset}`
      );

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
        console.log(`🎯 Found UserComment tag! Type: ${type}, Count: ${count}`);
        debugLog.push(`Found UserComment tag! Type: ${type}, Count: ${count}`);

        let dataOffset = count <= 4 ? currentOffset + 8 : valueOffset;
        if (dataOffset + count <= exifData.length) {
          const userCommentData = new Uint8Array(
            exifData.buffer,
            exifData.byteOffset + dataOffset,
            count
          );
          console.log(
            `📦 UserComment raw data (${count} bytes):`,
            userCommentData
          );

          // Convert to string and try to parse JSON
          const userCommentString = new TextDecoder("utf-8", {
            fatal: false,
          }).decode(userCommentData);
          const cleanString = userCommentString.replace(/\0/g, "").trim();

          console.log(`🔤 UserComment string: "${cleanString}"`);
          debugLog.push(`UserComment string length: ${cleanString.length}`);

          try {
            const parsed = JSON.parse(cleanString);
            console.log("✅ Successfully parsed UserComment JSON:", parsed);
            debugLog.push("✅ Successfully parsed UserComment JSON");
            tags[tag] = parsed; // Store parsed JSON instead of raw bytes
          } catch (e) {
            console.log(`❌ Failed to parse UserComment as JSON: ${e.message}`);
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
  };

  // Extract proof from EXIF (mimicking Python piexif.load behavior)
  const extractProofFromExif = (arrayBuffer) => {
    const result = parseExifLikePiexif(arrayBuffer);

    if (!result.exifDict) {
      throw new Error("No EXIF data found");
    }

    // Check for UserComment in Exif IFD (tag 0x9286)
    const userComment = result.exifDict.Exif[0x9286];

    if (!userComment) {
      throw new Error("No proof found in EXIF UserComment");
    }

    // If it's already parsed JSON, return it
    if (
      typeof userComment === "object" &&
      userComment !== null &&
      !(userComment instanceof Uint8Array)
    ) {
      return userComment;
    }

    // If it's raw bytes, try to parse
    if (userComment instanceof Uint8Array) {
      const userCommentString = new TextDecoder("utf-8", {
        fatal: false,
      }).decode(userComment);
      const cleanString = userCommentString.replace(/\0/g, "").trim();
      return JSON.parse(cleanString);
    }

    throw new Error("Invalid UserComment format");
  };

  // Hash image content (matching Python strip_exif_and_hash exactly)
  const hashImageContent = async (file) => {
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

          console.log(`🖼️  Image loaded: ${img.width}x${img.height}`);

          // Get clean JPEG bytes without EXIF (quality 95 to match Python)
          canvas.toBlob(
            async (blob) => {
              try {
                const cleanJpegBytes = await blob.arrayBuffer();
                console.log(
                  `🧹 Clean JPEG size: ${cleanJpegBytes.byteLength} bytes`
                );

                // Hash the clean JPEG bytes (exactly like Python)
                const hashBuffer = await crypto.subtle.digest(
                  "SHA-256",
                  cleanJpegBytes
                );
                const hashHex = arrayBufferToHex(hashBuffer);
                console.log(`🔐 Clean JPEG hash: ${hashHex}`);
                resolve(hashHex);
              } catch (error) {
                console.error("❌ Clean JPEG hashing failed:", error);

                // Fallback: try the pixel-based approach like Python's canonical_image_hash
                try {
                  console.log("🔄 Trying pixel-based fallback...");

                  // Get image data (pixels)
                  const imageData = ctx.getImageData(
                    0,
                    0,
                    img.width,
                    img.height
                  );
                  console.log(`🎨 Pixel data: ${imageData.data.length} bytes`);

                  // Create hash of dimensions and pixel data (like Python fallback)
                  const dimensionsStr = `${img.width}x${img.height}`;
                  const dimensionsBytes = new TextEncoder().encode(
                    dimensionsStr
                  );
                  const pixelBytes = new Uint8Array(imageData.data.buffer);

                  console.log(
                    `📏 Dimensions: "${dimensionsStr}" (${dimensionsBytes.length} bytes)`
                  );

                  // Combine dimensions and pixel data
                  const combinedData = new Uint8Array(
                    dimensionsBytes.length + pixelBytes.length
                  );
                  combinedData.set(dimensionsBytes, 0);
                  combinedData.set(pixelBytes, dimensionsBytes.length);

                  console.log(`🔗 Combined data: ${combinedData.length} bytes`);

                  const hashBuffer = await crypto.subtle.digest(
                    "SHA-256",
                    combinedData
                  );
                  const hashHex = arrayBufferToHex(hashBuffer);
                  console.log(`🔐 Pixel-based hash: ${hashHex}`);
                  resolve(hashHex);
                } catch (fallbackError) {
                  console.error("❌ Fallback hashing failed:", fallbackError);
                  reject(fallbackError);
                }
              }
            },
            "image/jpeg",
            0.95
          ); // Quality 95 to match Python
        } catch (error) {
          console.error("❌ Image processing failed:", error);
          reject(error);
        }
      };

      img.onerror = () => {
        const error = "Failed to load image for hashing";
        console.error("❌", error);
        reject(new Error(error));
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Verify Ed25519 signature
  const verifyEd25519Signature = async (message, signature, publicKeyBytes) => {
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
      console.error("❌ Ed25519 verification error:", error);
      return false;
    }
  };

  // Main verification function
  const verifyImageProof = async (file) => {
    setLoading(true);
    setVerificationResult(null);
    setDebugInfo(null);
    setProofData(null);
    setExifDebugInfo(null);

    console.log("🚀 Starting verification...");

    try {
      // Read file
      const arrayBuffer = await file.arrayBuffer();

      // Extract proof from EXIF (using piexif-like approach)
      const exifResult = parseExifLikePiexif(arrayBuffer);
      setExifDebugInfo(exifResult);

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

      setProofData(proof);
      console.log("📋 Proof extracted:", proof);

      // Verify required fields
      if (!proof.image_hash || !proof.signature || !proof.public_key_b64) {
        throw new Error("Invalid proof format - missing required fields");
      }

      // Hash the image content
      const recomputedHash = await hashImageContent(file);
      const expectedHash = proof.image_hash;

      const debug = {
        recomputedHash,
        expectedHash,
        hashMatch: recomputedHash === expectedHash,
      };

      //   setDebugInfo(debug);

      //   console.log(`🔍 Hash comparison:`);
      //   console.log(`  Recomputed: ${recomputedHash}`);
      //   console.log(`  Expected:   ${expectedHash}`);
      //   console.log(`  Match: ${debug.hashMatch}`);

      //   if (!debug.hashMatch) {
      //     setVerificationResult({
      //       success: false,
      //       message: "Image content hash mismatch! Image may have been tampered.",
      //       details: debug,
      //     });
      //     return;
      //   }

      // Reconstruct payload for signature verification (exclude signature)
      const payload = { ...proof };
      delete payload.signature;

      // Canonicalize payload (exactly like Python)
      const canonicalMessage = canonicalPayload(payload);
      const messageBytes = new TextEncoder().encode(canonicalMessage);

      console.log(`📝 Canonical message: ${canonicalMessage}`);

      // Decode signature and public key
      const signature = base64Decode(proof.signature);
      const publicKeyBytes = base64Decode(proof.public_key_b64);

      // Verify Ed25519 signature
      const signatureValid = await verifyEd25519Signature(
        messageBytes,
        signature,
        publicKeyBytes
      );

      if (signatureValid) {
        console.log("✅ VERIFICATION SUCCESSFUL!");
        setVerificationResult({
          success: true,
          message: "Image authenticity verified successfully!",
          details: { ...debug, signatureValid: true },
        });
      } else {
        console.log("❌ SIGNATURE VERIFICATION FAILED!");
        setVerificationResult({
          success: false,
          message: "Signature verification failed",
          details: { ...debug, signatureValid: false },
        });
      }
    } catch (error) {
      console.error("❌ Verification error:", error);
      setVerificationResult({
        success: false,
        message: `Verification error: ${error.message}`,
        details: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/jpeg")) {
        alert("Please select a JPEG image file");
        return;
      }
      setSelectedFile(file);
      setVerificationResult(null);
      setDebugInfo(null);
      setProofData(null);
      setExifDebugInfo(null);
    }
  };

  const handleVerify = () => {
    if (selectedFile) {
      verifyImageProof(selectedFile);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="text-center mb-8">
        <Shield className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Image Proof Verifier
        </h1>
        <p className="text-gray-600">
          Verify cryptographic authenticity of signed images
        </p>
      </div>

      {/* File Upload */}
      <div className="mb-8">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
          <FileImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="mb-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Select a JPEG image with embedded proof
              </span>
              <input
                id="file-upload"
                type="file"
                accept="image/jpeg,.jpg"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => document.getElementById("file-upload").click()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Choose File
            </button>
          </div>
        </div>

        {selectedFile && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Selected:</strong> {selectedFile.name} (
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
        )}
      </div>

      {/* Verify Button */}
      {selectedFile && (
        <div className="text-center mb-8">
          <button
            onClick={handleVerify}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center gap-2 mx-auto"
          >
            <Shield className="h-5 w-5" />
            {loading ? "Verifying..." : "Verify Image"}
          </button>
        </div>
      )}

      {/* Verification Result */}
      {verificationResult && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            verificationResult.success
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {verificationResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <h3
              className={`font-semibold ${
                verificationResult.success ? "text-green-800" : "text-red-800"
              }`}
            >
              {verificationResult.success
                ? "Verification Successful"
                : "Verification Failed"}
            </h3>
          </div>
          <p
            className={`${
              verificationResult.success ? "text-green-700" : "text-red-700"
            }`}
          >
            {verificationResult.message}
          </p>
        </div>
      )}

      {/* EXIF Debug Information */}
      {exifDebugInfo && (
        <div className="bg-yellow-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
            <Bug className="h-4 w-4" />
            EXIF Parsing Debug
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>EXIF Data Found:</strong>{" "}
              {exifDebugInfo.exifDict ? "Yes" : "No"}
            </div>
            {exifDebugInfo.exifDict && (
              <div>
                <strong>IFDs Found:</strong>
                <ul className="ml-4 mt-1">
                  <li>
                    0th IFD: {Object.keys(exifDebugInfo.exifDict["0th"]).length}{" "}
                    tags
                  </li>
                  <li>
                    Exif IFD:{" "}
                    {Object.keys(exifDebugInfo.exifDict["Exif"]).length} tags
                  </li>
                  <li>
                    UserComment in Exif IFD:{" "}
                    {exifDebugInfo.exifDict["Exif"][0x9286]
                      ? "Found"
                      : "Not found"}
                  </li>
                </ul>
              </div>
            )}
            <div className="bg-white p-2 rounded border max-h-40 overflow-y-auto">
              <strong>Debug Log:</strong>
              <pre className="text-xs mt-1">
                {exifDebugInfo.debugLog.join("\n")}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Hash Debug Information */}
      {debugInfo && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Hash Verification Debug
          </h3>
          <div className="space-y-2 text-sm font-mono">
            <div>
              <span className="text-gray-600">Recomputed Hash:</span>
              <div className="text-blue-600 break-all">
                {debugInfo.recomputedHash}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Expected Hash:</span>
              <div className="text-blue-600 break-all">
                {debugInfo.expectedHash}
              </div>
            </div>
            <div
              className={`font-semibold ${
                debugInfo.hashMatch ? "text-green-600" : "text-red-600"
              }`}
            >
              Hash Match: {debugInfo.hashMatch ? "✅ Yes" : "❌ No"}
            </div>
          </div>
        </div>
      )}

      {/* Proof Data */}
      {proofData && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-3">
            Embedded Proof Data
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Device ID:</strong> {proofData.device_id}
            </div>
            <div>
              <strong>Timestamp:</strong> {proofData.timestamp}
            </div>
            <div>
              <strong>Firmware:</strong> {proofData.firmware}
            </div>
            <div>
              <strong>Signature Algorithm:</strong> {proofData.sig_alg}
            </div>
            <div>
              <strong>Nonce:</strong> {proofData.nonce}
            </div>
            <div>
              <strong>Image Hash:</strong>{" "}
              <span className="font-mono text-xs break-all">
                {proofData.image_hash}
              </span>
            </div>
            <div>
              <strong>Signature:</strong>{" "}
              <span className="font-mono text-xs break-all">
                {proofData.signature}
              </span>
            </div>
            <div>
              <strong>Public Key (B64):</strong>{" "}
              <span className="font-mono text-xs break-all">
                {proofData.public_key_b64}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageProofVerifier;
