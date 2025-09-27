import React from "react";
import {
  CheckCircle,
  XCircle,
  Upload,
  Database,
  ExternalLink,
} from "lucide-react";

export default function StorageStatus({ storageResult, loading }) {
  if (loading) {
    return (
      <div className="rounded-[32px] border border-blue-400/20 bg-blue-400/5 p-8 backdrop-blur-xl">
        <div className="flex items-center justify-center gap-4 text-blue-300">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-300/30 border-t-blue-300"></div>
          <span className="text-lg font-medium">
            Storing proof on 0G Storage...
          </span>
        </div>
      </div>
    );
  }

  if (!storageResult) {
    return null;
  }

  // Safely extract values and convert to strings
  const isSuccess = storageResult.success === true;
  const errorMessage = storageResult.error || "Failed to store proof";
  const rootHash = String(storageResult.rootHash || "");
  const transactionHash = String(storageResult.transactionHash || "");

  return (
    <div
      className={`rounded-[32px] border p-8 backdrop-blur-xl ${
        isSuccess
          ? "border-emerald-400/20 bg-emerald-400/5"
          : "border-red-400/20 bg-red-400/5"
      }`}
    >
      <div className="flex items-center gap-4 mb-6">
        {isSuccess ? (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400/20">
            <Database className="h-8 w-8 text-emerald-400" />
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-400/20">
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
        )}
        <div>
          <h3
            className={`text-2xl font-semibold ${
              isSuccess ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {isSuccess ? "Stored on 0G Storage" : "Storage Failed"}
          </h3>
          <p
            className={`text-lg ${
              isSuccess ? "text-emerald-200" : "text-red-200"
            }`}
          >
            {isSuccess
              ? "Proof permanently stored on decentralized network"
              : errorMessage}
          </p>
        </div>
      </div>

      {isSuccess && (
        <div className="space-y-6">
          {/* Storage Details */}
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-6">
            <h4 className="text-lg font-medium text-emerald-300 mb-4">
              ✅ Decentralized Storage Complete
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Storage Network:</span>
                <span className="text-emerald-300 font-medium">0G Storage</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Storage Type:</span>
                <span className="text-emerald-300 font-medium">Immutable</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Data Integrity:</span>
                <span className="text-emerald-300 font-medium">Verified</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Access:</span>
                <span className="text-emerald-300 font-medium">Permanent</span>
              </div>
            </div>
          </div>

          {/* Storage Hashes */}
          {rootHash && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h4 className="text-lg font-medium text-white mb-4">
                Storage References
              </h4>
              <div className="space-y-4">
                <div>
                  <span className="text-white/60 text-sm">0G Root Hash:</span>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-white font-mono text-xs break-all bg-white/5 p-3 rounded-lg flex-1">
                      {rootHash}
                    </p>
                    <button
                      onClick={() => navigator.clipboard.writeText(rootHash)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                </div>

                {transactionHash && (
                  <div>
                    <span className="text-white/60 text-sm">
                      Transaction Hash:
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-white font-mono text-xs break-all bg-white/5 p-3 rounded-lg flex-1">
                        {transactionHash}
                      </p>
                      <a
                        href={`https://chainscan-testnet.0g.ai/tx/${transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        title="View on explorer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Storage Package Info */}
          {storageResult.proofPackage && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h4 className="text-lg font-medium text-white mb-4">
                Stored Package Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/60">Device ID:</span>
                  <p className="text-white font-medium">
                    {String(
                      storageResult.proofPackage?.deviceInfo?.deviceId || "N/A"
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-white/60">File Size:</span>
                  <p className="text-white font-medium">
                    {storageResult.proofPackage?.metadata?.fileSize
                      ? `${(
                          storageResult.proofPackage.metadata.fileSize /
                          1024 /
                          1024
                        ).toFixed(2)} MB`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-white/60">Stored At:</span>
                  <p className="text-white font-medium">
                    {storageResult.proofPackage?.metadata?.uploadTimestamp
                      ? new Date(
                          storageResult.proofPackage.metadata.uploadTimestamp
                        ).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-white/60">Verification Status:</span>
                  <p className="text-emerald-300 font-medium">
                    {String(
                      storageResult.proofPackage?.metadata
                        ?.verificationStatus || "N/A"
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
