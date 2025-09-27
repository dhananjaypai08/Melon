/**
 * Client-side 0G Storage utilities
 */

/**
 * Check if 0G Storage is configured
 */
export async function isOGStorageConfigured() {
  try {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/og-storage`);
    const data = await response.json();
    return data.configured;
  } catch (error) {
    console.error("Failed to check 0G Storage configuration:", error);
    return false;
  }
}

/**
 * Upload proof package to 0G Storage via API
 */
export async function uploadProofToOG(
  imageFile,
  proofData,
  verificationResult
) {
  try {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";

    const requestBody = {
      fileName: imageFile.name,
      fileSize: imageFile.size,
      fileType: imageFile.type,
      proofData: proofData,
      verificationResult: verificationResult,
    };

    const response = await fetch(`${baseUrl}/api/og-storage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Upload failed");
    }

    return result;
  } catch (error) {
    console.error("Failed to upload proof to 0G Storage:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
