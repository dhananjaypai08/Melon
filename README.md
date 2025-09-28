# Melon : A platform to help seggregate IRL content from AI Generated content using cryptographic embedded proofs and trusted hardware sources

🎯 Problem Statement
In an era of deepfakes, AI manipulation, and digital misinformation, proving the authenticity of visual content has become critical. Traditional image verification methods are:

Easily circumvented by sophisticated editing tools
Not scalable for real-time verification needs
Lack cryptographic proof of origin and integrity
Don't provide device attestation for source validation

Melon solves this by creating an immutable chain of trust from camera sensor to final verification.

🚀 What is Melon?
Melon is a decentralized image verification platform that provides cryptographic proof of image authenticity through hardware attestation and blockchain technology. Our platform enables:

Hardware device registration with economic staking mechanisms
Cryptographic proof generation at point of capture
Real-time verification of image authenticity
AI-generated content labeling with embedded proofs
Decentralized storage on 0G Network for permanent archival

✨ Key Features
🔐 Hardware Attestation

Device fingerprinting with unique hardware identifiers
Ed25519 cryptographic signatures for tamper-proof validation
Firmware version tracking and nonce-based replay protection

⚡ Real-time Verification

Sub-6 second average verification time
EXIF metadata analysis and integrity checking
Cryptographic signature validation with public key verification

🛡️ Tamper Detection

Advanced heuristics for detecting image manipulation
Hash-based content integrity verification
Metadata stripping and recycling detection

🎯 Economic Security Model

0.01 ETH staking requirement for device registration
Slashing mechanisms for malicious actors
On-chain proof storage and verification

🤖 AI Content Verification

Embedded cryptographic proofs for AI-generated images
Model attestation and generation metadata
Distinguishable AI vs hardware-captured content

🌐 Decentralized Storage

Integration with 0G Storage network
Permanent, immutable proof archival
Content-addressed storage with merkle proofs

🏗️ Architecture
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Hardware │ │ Smart │ │ Frontend │
│ Devices │───▶│ Contracts │◀───│ Interface │
│ (Cameras, │ │ (Ethereum) │ │ (Next.js) │
│ Raspberry Pi) │ └─────────────────┘ └─────────────────┘
└─────────────────┘ │ │
│ │ │
▼ ▼ ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Proof │ │ 0G Storage │ │ AI Studio │
│ Generation │ │ Network │ │ (Gemini) │
│ (Python) │ │ (Permanent) │ │ Integration │
└─────────────────┘ └─────────────────┘ └─────────────────┘

🛠️ Technology Stack
Frontend

Next.js 15.5.4 - React framework with App Router
Tailwind CSS 4 - Utility-first styling
RainbowKit 2.2.8 - Wallet connection interface
Wagmi 2.17.5 - Ethereum interactions
Three.js 0.170.0 - 3D hardware visualization

Smart Contracts

Solidity ^0.8.13 - Contract language
Foundry - Development framework
OpenZeppelin 5.4.0 - Security libraries
Ethereum Sepolia - Testnet deployment

Backend & Storage

0G Storage SDK 0.3.1 - Decentralized storage
Sharp 0.34.4 - Server-side image processing
Node.js Crypto - Cryptographic operations

Hardware Integration

Python 3.9+ - Hardware proof generation
PiCamera2 - Raspberry Pi camera integration
PIL/Pillow - Image manipulation
Cryptography Library - Ed25519 signatures

AI Integration

Google Gemini 2.5 Flash - Image generation
Vercel AI SDK 5.0.56 - LLM orchestration

## 📋 Smart Contract Addresses

### Sepolia Testnet

Contract Address : 0x50302bdcc8dcb8ddbf5a09636ed9a22e05f65849
Staking Amount: 0.01 ETH

### 0G Testnet

Contract Address: 0x66f0c4c9a21b78d4d92358d087176964982e1c21
Staking Amount: 0.01 OG

### OG Mainnet

Contract Address : 0x66f0c4c9a21b78d4d92358d087176964982e1c21
Staking Amount: 0.01 OG

### Setup and Running

> Note: We currently support Raspberry Pi5 machine based hardware

1. Run this cmd on the hardware

```
./script/capture_and_embed.sh
```

This gives you a `Hardware-uuid` which is hardware specific UUID.

Our scripts generate a ed25519 compatible pubKey and privKey for hardware and prevents from malicious usage by staking tokens.

We have a payload with signature using the hardware based privKey and encoded pubKey inside the hash and embed it into EXIF format for images before saving it into JPG/png format

We then verify the signature against the pubkey using ed25519 scheme
We also use pkcs7 format with a forked version of zkPDF to further verify the payload itself and the hardware based certificate using RSA + SHA256 and asn1 format

2. Copy the hardware-uuid and paste it on our platform and stake 0.01 tokens to whitelist the harddware as a trusted source of truth

3. On your local machine fetch the captured file using

```sh
./scripts/fetch.sh
```

4. Upload the image on our portal to verify hardware details and ownership

5. Playaround with our AI Playground to generate images with Embedded proofs for our ai agents that generates images with an ai proof
