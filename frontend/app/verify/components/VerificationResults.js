import React from "react";
import { CheckCircle, XCircle, AlertTriangle, Bug, Eye } from "lucide-react";
import StorageStatus from "./StorageStatus";

export default function VerificationResults({
  verificationResult,
  debugInfo,
  proofData,
  exifDebugInfo,
  loading,
  storageResult,
  storageLoading,
}) {
  if (loading) {
    return (
      <div className="rounded-[32px] border border-blue-400/20 bg-blue-400/5 p-8 backdrop-blur-xl">
        <div className="flex items-center justify-center gap-4 text-blue-300">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-300/30 border-t-blue-300"></div>
          <span className="text-lg font-medium">
            Verifying image authenticity...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Main Verification Result */}
      {verificationResult && (
        <div
          className={`rounded-[32px] border p-8 backdrop-blur-xl ${
            verificationResult.success
              ? "border-emerald-400/20 bg-emerald-400/5"
              : "border-red-400/20 bg-red-400/5"
          }`}
        >
          <div className="flex items-center gap-4 mb-6">
            {verificationResult.success ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400/20">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-400/20">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            )}
            <div>
              <h3
                className={`text-2xl font-semibold ${
                  verificationResult.success
                    ? "text-emerald-300"
                    : "text-red-300"
                }`}
              >
                {verificationResult.success
                  ? "Verification Successful"
                  : "Verification Failed"}
              </h3>
              <p
                className={`text-lg ${
                  verificationResult.success
                    ? "text-emerald-200"
                    : "text-red-200"
                }`}
              >
                {verificationResult.message}
              </p>
            </div>
          </div>

          {verificationResult.success && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-6">
              <h4 className="text-lg font-medium text-emerald-300 mb-4">
                ✅ Authentication Complete
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">
                    Cryptographic Signature:
                  </span>
                  <span className="text-emerald-300 font-medium">Valid</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Device Attestation:</span>
                  <span className="text-emerald-300 font-medium">Verified</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Tamper Detection:</span>
                  <span className="text-emerald-300 font-medium">Clean</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Proof Integrity:</span>
                  <span className="text-emerald-300 font-medium">Intact</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 0G Storage Status */}
      <StorageStatus storageResult={storageResult} loading={storageLoading} />

      {/* Proof Data */}
      {proofData && (
        <div className="rounded-[32px] border border-white/15 bg-white/[0.06] p-8 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-400/20">
              <Eye className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">
              Embedded Proof Metadata
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">
                  Device Information
                </p>
                <div className="space-y-2">
                  <div>
                    <span className="text-white/60 text-sm">Device ID:</span>
                    <p className="text-white font-medium">
                      {proofData.device_id}
                    </p>
                  </div>
                  <div>
                    <span className="text-white/60 text-sm">Firmware:</span>
                    <p className="text-white font-medium">
                      {proofData.firmware}
                    </p>
                  </div>
                  <div>
                    <span className="text-white/60 text-sm">
                      Signature Algorithm:
                    </span>
                    <p className="text-white font-medium">
                      {proofData.sig_alg}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">
                  Capture Details
                </p>
                <div className="space-y-2">
                  <div>
                    <span className="text-white/60 text-sm">Timestamp:</span>
                    <p className="text-white font-medium">
                      {proofData.timestamp}
                    </p>
                  </div>
                  <div>
                    <span className="text-white/60 text-sm">Nonce:</span>
                    <p className="text-white font-medium">{proofData.nonce}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">
                  Cryptographic Data
                </p>
                <div className="space-y-3">
                  <div>
                    <span className="text-white/60 text-sm">Image Hash:</span>
                    <p className="text-white font-mono text-xs break-all bg-white/5 p-2 rounded-lg mt-1">
                      {proofData.image_hash}
                    </p>
                  </div>
                  <div>
                    <span className="text-white/60 text-sm">
                      Digital Signature:
                    </span>
                    <p className="text-white font-mono text-xs break-all bg-white/5 p-2 rounded-lg mt-1">
                      {proofData.signature.slice(0, 64)}...
                    </p>
                  </div>
                  <div>
                    <span className="text-white/60 text-sm">Public Key:</span>
                    <p className="text-white font-mono text-xs break-all bg-white/5 p-2 rounded-lg mt-1">
                      {proofData.public_key_b64.slice(0, 64)}...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXIF Debug Information */}
      {exifDebugInfo && (
        <div className="rounded-[32px] border border-white/15 bg-white/[0.06] p-8 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-400/20">
              <Bug className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">
              EXIF Parsing Debug Information
            </h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">
                  EXIF Status
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">EXIF Data Found:</span>
                    <span
                      className={`font-medium ${
                        exifDebugInfo.exifDict
                          ? "text-emerald-300"
                          : "text-red-300"
                      }`}
                    >
                      {exifDebugInfo.exifDict ? "Yes" : "No"}
                    </span>
                  </div>
                  {exifDebugInfo.exifDict && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-white/60">0th IFD Tags:</span>
                        <span className="text-white font-medium">
                          {Object.keys(exifDebugInfo.exifDict["0th"]).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Exif IFD Tags:</span>
                        <span className="text-white font-medium">
                          {Object.keys(exifDebugInfo.exifDict["Exif"]).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">
                          UserComment Found:
                        </span>
                        <span
                          className={`font-medium ${
                            exifDebugInfo.exifDict["Exif"][0x9286]
                              ? "text-emerald-300"
                              : "text-red-300"
                          }`}
                        >
                          {exifDebugInfo.exifDict["Exif"][0x9286]
                            ? "Yes"
                            : "No"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">
                  Debug Log
                </p>
                <div className="bg-black/20 p-3 rounded-lg max-h-40 overflow-y-auto">
                  <pre className="text-xs text-white/70 whitespace-pre-wrap">
                    {exifDebugInfo.debugLog.join("\n")}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
