import { NextRequest, NextResponse } from "next/server";
import { ZgFile, Indexer } from "@0glabs/0g-ts-sdk";
import { ethers } from "ethers";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// 0G Storage Configuration
const OG_CONFIG = {
  RPC_URL: process.env.NEXT_PUBLIC_0G_RPC_URL,
  INDEXER_RPC: process.env.NEXT_PUBLIC_0G_INDEXER_RPC,
  PRIVATE_KEY: process.env.OG_PRIVATE_KEY,
};

function createOGClient() {
  try {
    const provider = new ethers.JsonRpcProvider(OG_CONFIG.RPC_URL);
    const signer = new ethers.Wallet(OG_CONFIG.PRIVATE_KEY, provider);
    const indexer = new Indexer(OG_CONFIG.INDEXER_RPC);

    return {
      indexer,
      signer,
      provider,
      rpcUrl: OG_CONFIG.RPC_URL,
    };
  } catch (error) {
    console.error("Failed to create 0G Storage client:", error);
    throw new Error("0G Storage initialization failed");
  }
}

function isOGStorageConfigured() {
  return !!(
    OG_CONFIG.RPC_URL &&
    OG_CONFIG.INDEXER_RPC &&
    OG_CONFIG.PRIVATE_KEY
  );
}

function createProofPackage(
  fileName,
  fileSize,
  fileType,
  proofData,
  verificationResult
) {
  return {
    metadata: {
      uploadTimestamp: new Date().toISOString(),
      originalFileName: fileName,
      fileSize: fileSize,
      fileType: fileType,
      verificationStatus: verificationResult.success ? "verified" : "failed",
      verificationMessage: verificationResult.message,
    },
    deviceInfo: {
      deviceId: proofData.device_id,
      firmware: proofData.firmware,
      signatureAlgorithm: proofData.sig_alg,
      publicKey: proofData.public_key_b64,
    },
    captureDetails: {
      timestamp: proofData.timestamp,
      nonce: proofData.nonce,
      imageHash: proofData.image_hash,
    },
    cryptographicProof: {
      signature: proofData.signature,
      publicKeyB64: proofData.public_key_b64,
      imageHash: proofData.image_hash,
    },
    verificationDetails: {
      verifiedAt: new Date().toISOString(),
      success: verificationResult.success,
      message: verificationResult.message,
    },
  };
}

export async function POST(request) {
  try {
    if (!isOGStorageConfigured()) {
      return NextResponse.json(
        { success: false, error: "0G Storage not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { fileName, fileSize, fileType, proofData, verificationResult } =
      body;

    if (!proofData || !verificationResult) {
      return NextResponse.json(
        { success: false, error: "Missing proof data or verification result" },
        { status: 400 }
      );
    }

    // Create proof package
    const proofPackage = createProofPackage(
      fileName,
      fileSize,
      fileType,
      proofData,
      verificationResult
    );

    // Convert proof package to JSON string
    const proofJson = JSON.stringify(proofPackage, null, 2);

    // Create temporary file
    const tempFileName = `proof_${proofData.device_id}_${Date.now()}.json`;
    const tempFilePath = join(tmpdir(), tempFileName);

    // Write JSON to temporary file
    writeFileSync(tempFilePath, proofJson, "utf-8");

    let zgFile;
    try {
      // Create 0G file from file path
      zgFile = await ZgFile.fromFilePath(tempFilePath);

      // Initialize 0G client
      const { indexer, signer, rpcUrl } = createOGClient();

      // Generate Merkle tree
      const [tree, treeErr] = await zgFile.merkleTree();
      if (treeErr !== null) {
        throw new Error(`Error generating Merkle tree: ${treeErr}`);
      }

      const rootHash = tree?.rootHash();
      console.log("Proof package root hash:", rootHash);

      // Upload to 0G Storage
      const [tx, uploadErr] = await indexer.upload(zgFile, rpcUrl, signer);
      if (uploadErr !== null) {
        throw new Error(`Upload error: ${uploadErr}`);
      }

      // Extract transaction hash properly (tx might be an object)
      const transactionHash =
        typeof tx === "string" ? tx : tx?.txHash || tx?.hash || tx;

      return NextResponse.json({
        success: true,
        rootHash: rootHash,
        transactionHash: transactionHash,
        proofPackage: proofPackage,
      });
    } finally {
      // Clean up
      if (zgFile) {
        await zgFile.close();
      }
      try {
        unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.warn("Failed to cleanup temp file:", cleanupError);
      }
    }
  } catch (error) {
    console.error("Failed to upload proof to 0G Storage:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    configured: isOGStorageConfigured(),
    message: isOGStorageConfigured()
      ? "0G Storage is configured"
      : "0G Storage not configured",
  });
}
