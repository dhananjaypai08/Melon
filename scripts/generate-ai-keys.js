#!/usr/bin/env node

const crypto = require("crypto");

// Generate Ed25519 key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");

// Export keys in DER format (compatible with all Node.js versions)
const publicKeyDer = publicKey.export({ format: "der", type: "spki" });
const privateKeyDer = privateKey.export({ format: "der", type: "pkcs8" });

// Convert to base64 for storage
const publicKeyB64 = publicKeyDer.toString("base64");
const privateKeyB64 = privateKeyDer.toString("base64");

console.log("=".repeat(80));
console.log("AI PROOF KEYS GENERATED");
console.log("=".repeat(80));
console.log("Add these to your .env file:");
console.log("");
console.log(`AI_PROOF_PRIVATE_KEY=${privateKeyB64}`);
console.log(`AI_PROOF_PUBLIC_KEY=${publicKeyB64}`);
console.log("");
console.log("=".repeat(80));
