"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Upload, FileImage, Bot, Sparkles } from "lucide-react";
import AIVerificationResults from "./components/AIVerificationResults";

export default function AIVerifyPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [proofData, setProofData] = useState(null);
  const [exifDebugInfo, setExifDebugInfo] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
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
      // Use server-side verification API
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("/api/ai-proof", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setVerificationResult({
          success: true,
          message: result.message,
          details: result.verificationDetails,
          proofType: "ai_generated",
        });
        setProofData(result.proofData);
        setDebugInfo(result.verificationDetails);
        setExifDebugInfo({
          exifDict: {
            "0th": {},
            Exif: { 0x9286: result.proofData },
            GPS: {},
            "1st": {},
            thumbnail: null,
          },
          debugLog: ["Proof extracted successfully via server-side API"],
        });
      } else {
        setVerificationResult({
          success: false,
          message: result.error || "Verification failed",
          details: result.verificationDetails || null,
          proofType: "unknown",
        });
      }
    } catch (error) {
      setVerificationResult({
        success: false,
        message: `Verification error: ${error.message}`,
        details: null,
        proofType: "unknown",
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
                AI Image Verification
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
              <Bot className="h-4 w-4 text-purple-400" />
              AI Content Verification
              <span className="text-white/40">•</span>
              <Sparkles className="h-4 w-4 text-yellow-400" />
              Cryptographic Proof
            </div>
            <h1 className="text-4xl font-semibold text-white mb-4 sm:text-5xl">
              Verify AI Image Authenticity
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Upload an AI-generated image to verify its cryptographic proof,
              view generation metadata, and confirm its authenticity.
            </p>
          </div>

          {/* File Upload Section */}
          <div className="rounded-[32px] border border-white/15 bg-white/[0.06] p-8 backdrop-blur-xl mb-8">
            <div className="border-2 border-dashed border-white/20 rounded-[24px] p-12 text-center hover:border-white/40 transition-colors">
              <Bot className="mx-auto h-16 w-16 text-white/40 mb-6" />

              {!selectedFile ? (
                <>
                  <h3 className="text-xl font-medium text-white mb-2">
                    Select AI Image for Verification
                  </h3>
                  <p className="text-white/60 mb-6">
                    Choose an AI-generated image with embedded cryptographic
                    proof
                  </p>
                  <div className="flex justify-center">
                    <button
                      onClick={() =>
                        document.getElementById("ai-file-upload").click()
                      }
                      className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-600 px-8 py-4 text-lg font-medium text-white shadow-lg shadow-purple-600/40 transition hover:scale-[1.01] hover:shadow-purple-500/60"
                    >
                      <Upload className="h-5 w-5" />
                      Choose AI Image
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-6 py-3 backdrop-blur">
                    <FileImage className="h-5 w-5 text-purple-400" />
                    <span className="font-medium">AI Image Selected</span>
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
                      <Bot className="h-5 w-5" />
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                          Verifying AI Image...
                        </div>
                      ) : (
                        "Verify AI Image"
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
                      disabled={loading}
                      className="rounded-2xl border border-white/30 px-6 py-4 text-white/70 transition hover:border-white/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Choose Different Image
                    </button>
                  </div>
                </div>
              )}

              <input
                id="ai-file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-[32px] border border-blue-400/20 bg-blue-400/5 p-6 backdrop-blur-xl mb-8">
            <div className="flex items-center gap-3 text-blue-300">
              <Sparkles className="h-5 w-5" />
              <div>
                <p className="font-medium">How AI Verification Works</p>
                <p className="text-sm text-blue-200 mt-1">
                  We extract the embedded cryptographic proof from the image's
                  EXIF data, then verify the digital signature and check that
                  the image content hasn't been modified.
                </p>
              </div>
            </div>
          </div>

          {/* Verification Results */}
          <AIVerificationResults
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
