"use client";

import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  PROOF_OF_CAPTURE_ADDRESS,
  PROOF_OF_CAPTURE_ABI,
  STAKING_AMOUNT,
} from "../../lib/contract";

export default function ApprovePage() {
  const [deviceId, setDeviceId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { address, isConnected } = useAccount();
  const {
    data: hash,
    error: writeError,
    isPending,
    writeContract,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Handle transaction hash from writeContract
  useEffect(() => {
    if (hash && !txHash) {
      console.log("Transaction hash received:", hash);
      setTxHash(hash);
    }
  }, [hash, txHash]);

  // Handle successful transaction confirmation
  useEffect(() => {
    if (isConfirmed && txHash) {
      console.log("Transaction confirmed!", txHash);
      setSuccess(true);
      setIsLoading(false);
    }
  }, [isConfirmed, txHash]);

  // Handle write error
  useEffect(() => {
    if (writeError) {
      console.error("Write error:", writeError);
      setError(
        "Transaction failed: " + (writeError.shortMessage || writeError.message)
      );
      setIsLoading(false);
      setTxHash("");
    }
  }, [writeError]);

  // Handle transaction error
  useEffect(() => {
    if (txError) {
      console.error("Transaction error:", txError);
      setError("Transaction failed: " + txError.message);
      setIsLoading(false);
      setTxHash("");
    }
  }, [txError]);

  const handleStake = async () => {
    if (!deviceId.trim()) {
      setError("Please enter a device ID");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess(false);
    setTxHash("");

    try {
      console.log("Starting transaction...");
      console.log("Device ID:", deviceId);
      console.log("Staking amount:", STAKING_AMOUNT);

      writeContract({
        address: PROOF_OF_CAPTURE_ADDRESS,
        abi: PROOF_OF_CAPTURE_ABI,
        functionName: "stakeTokens",
        args: [deviceId],
        value: STAKING_AMOUNT,
      });
    } catch (error) {
      console.error("Transaction failed:", error);
      setError("Transaction failed: " + (error.shortMessage || error.message));
      setIsLoading(false);
      setTxHash("");
    }
  };

  const resetForm = () => {
    setDeviceId("");
    setTxHash("");
    setSuccess(false);
    setError("");
    setIsLoading(false);
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
              <span className="text-2xl">📸</span>
            </span>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-white/50">
                PhotoProof
              </p>
              <p className="text-lg font-semibold tracking-tight text-white">
                Device Approval
              </p>
            </div>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 px-6 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl">
          {!isConnected ? (
            <div className="text-center">
              <h1 className="text-4xl font-semibold text-white mb-6">
                Connect Your Wallet
              </h1>
              <p className="text-lg text-white/70 mb-8">
                Please connect your wallet to stake tokens and whitelist your
                device.
              </p>
            </div>
          ) : success ? (
            <div className="rounded-[32px] border border-emerald-400/20 bg-emerald-400/5 p-8 text-center backdrop-blur-xl">
              <div className="text-6xl mb-6">✅</div>
              <h2 className="text-3xl font-semibold text-white mb-4">
                Successfully Staked!
              </h2>
              <p className="text-lg text-white/70 mb-6">
                Device ID{" "}
                <span className="text-emerald-400 font-medium">{deviceId}</span>{" "}
                has been whitelisted.
              </p>
              <div className="space-y-3 text-sm text-white/60 mb-8">
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                  <span>Transaction Hash:</span>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-mono"
                  >
                    {txHash?.slice(0, 10)}...{txHash?.slice(-8)}
                  </a>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                  <span>Staked Amount:</span>
                  <span className="text-white font-medium">0.01 ETH</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                  <span>Status:</span>
                  <span className="inline-flex items-center gap-2 text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                    Confirmed
                  </span>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="rounded-2xl border border-white/30 px-6 py-3 text-white/70 transition hover:border-white/50 hover:text-white"
              >
                Stake Another Device
              </button>
            </div>
          ) : (
            <div className="rounded-[32px] border border-white/15 bg-white/[0.06] p-8 backdrop-blur-xl">
              <h1 className="text-3xl font-semibold text-white mb-6 text-center">
                Stake to Whitelist Device
              </h1>

              {error && (
                <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-red-300">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Device ID
                  </label>
                  <input
                    type="text"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    placeholder="Enter your device ID (e.g., SONY-A7RV-118)"
                    className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 backdrop-blur focus:border-white/40 focus:outline-none"
                    disabled={isLoading || isConfirming}
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="font-medium text-white mb-2">
                    Staking Details
                  </h3>
                  <div className="space-y-2 text-sm text-white/70">
                    <div className="flex justify-between">
                      <span>Required Stake:</span>
                      <span className="text-white font-medium">0.01 ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network:</span>
                      <span className="text-white font-medium">
                        Sepolia Testnet
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Connected Wallet:</span>
                      <span className="text-white font-medium">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaction Status */}
                {(isLoading || isConfirming) && (
                  <div className="rounded-2xl border border-blue-400/20 bg-blue-400/5 p-4">
                    <div className="flex items-center gap-3 text-blue-300">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-300/30 border-t-blue-300"></div>
                      <span className="text-sm">
                        {isPending &&
                          !txHash &&
                          "Waiting for wallet confirmation..."}
                        {txHash &&
                          isConfirming &&
                          "Transaction submitted, waiting for confirmation..."}
                      </span>
                    </div>
                    {txHash && (
                      <div className="mt-2 text-xs text-blue-200">
                        <a
                          href={`https://sepolia.etherscan.io/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          View on Etherscan: {txHash.slice(0, 20)}...
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleStake}
                  disabled={isLoading || isConfirming || !deviceId.trim()}
                  className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 px-8 py-4 text-lg font-medium text-white shadow-lg shadow-purple-600/40 transition hover:scale-[1.01] hover:shadow-purple-500/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading || isConfirming ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                      {isPending && !txHash && "Confirm in Wallet..."}
                      {txHash && isConfirming && "Processing Transaction..."}
                    </div>
                  ) : (
                    "Stake to Whitelist Device"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
