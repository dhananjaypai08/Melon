"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Upload, FileImage, Shield } from "lucide-react";
import { VerificationEngine } from "./libs/verificationEngine";
import VerificationResults from "./components/VerificationResults";

export default function VerifyPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [proofData, setProofData] = useState(null);
  const [exifDebugInfo, setExifDebugInfo] = useState(null);

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

  const handleVerify = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setVerificationResult(null);
    setDebugInfo(null);
    setProofData(null);
    setExifDebugInfo(null);

    try {
      const engine = new VerificationEngine();
      const result = await engine.verifyImageProof(selectedFile);

      setVerificationResult(result.verificationResult);
      setDebugInfo(result.debugInfo);
      setProofData(result.proofData);
      setExifDebugInfo(result.exifDebugInfo);
    } catch (error) {
      setVerificationResult({
        success: false,
        message: `Verification error: ${error.message}`,
        details: null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020512] text-white">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-x-[-20%] top-[-35%] h-[520px] rounded-full bg-gradient-to-br from-violet-500/40 via-purple-500/30 to-indigo-500/30 blur-3xl"></div>
      <div className="pointer-events-none absolute inset-y-[-30%] right-[-25%] w-[520px] rounded-full bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-teal-400/20 blur-[120px]"></div>

      {/* Header */}
      <header className="relative z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <Image
                src="/logo.png"
                alt="Melon logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
            </span>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-white/50">
                Melon
              </p>
              <p className="text-lg font-semibold tracking-tight text-white">
                Image Verification
              </p>
            </div>
          </div>
          <a
            href="/"
            className="rounded-2xl border border-white/30 px-6 py-3 text-white/70 transition hover:border-white/50 hover:text-white"
          >
            Back to Home
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 px-6 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex self-start items-center gap-3 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm text-white/70 backdrop-blur mb-6">
              <Shield className="h-4 w-4 text-emerald-400" />
              Cryptographic Verification
            </div>
            <h1 className="text-4xl font-semibold text-white mb-4 sm:text-5xl">
              Verify Image Authenticity
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Upload a JPEG image with embedded proof to verify its
              cryptographic authenticity and hardware attestation.
            </p>
          </div>

          {/* File Upload Section */}
          <div className="rounded-[32px] border border-white/15 bg-white/[0.06] p-8 backdrop-blur-xl mb-8">
            <div className="border-2 border-dashed border-white/20 rounded-[24px] p-12 text-center hover:border-white/40 transition-colors">
              <FileImage className="mx-auto h-16 w-16 text-white/40 mb-6" />

              {!selectedFile ? (
                <>
                  <h3 className="text-xl font-medium text-white mb-2">
                    Select Image for Verification
                  </h3>
                  <p className="text-white/60 mb-6">
                    Choose a JPEG image with embedded cryptographic proof
                  </p>
                  <div className="flex justify-center">
                    <button
                      onClick={() =>
                        document.getElementById("file-upload").click()
                      }
                      className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 px-8 py-4 text-lg font-medium text-white shadow-lg shadow-purple-600/40 transition hover:scale-[1.01] hover:shadow-purple-500/60"
                    >
                      <Upload className="h-5 w-5" />
                      Choose File
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-6 py-3 backdrop-blur">
                    <FileImage className="h-5 w-5 text-emerald-400" />
                    <span className="font-medium">File Selected</span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-white/70">
                      <span className="text-white font-medium">
                        {selectedFile.name}
                      </span>
                      <span className="ml-2">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={handleVerify}
                      disabled={loading}
                      className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-8 py-4 text-lg font-medium text-white shadow-lg shadow-emerald-600/40 transition hover:scale-[1.01] hover:shadow-emerald-500/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <Shield className="h-5 w-5" />
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                          Verifying...
                        </div>
                      ) : (
                        "Verify Image"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setVerificationResult(null);
                        setDebugInfo(null);
                        setProofData(null);
                        setExifDebugInfo(null);
                      }}
                      className="rounded-2xl border border-white/30 px-6 py-4 text-white/70 transition hover:border-white/50 hover:text-white"
                    >
                      Choose Different File
                    </button>
                  </div>
                </div>
              )}

              <input
                id="file-upload"
                type="file"
                accept="image/jpeg,.jpg"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Verification Results */}
          <VerificationResults
            verificationResult={verificationResult}
            debugInfo={debugInfo}
            proofData={proofData}
            exifDebugInfo={exifDebugInfo}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
}
