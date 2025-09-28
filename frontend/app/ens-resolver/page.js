"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useReadContract,
  useEnsAddress,
  useEnsResolver,
  useEnsName,
} from "wagmi";
import { normalize } from "viem/ens";
import { isAddress } from "viem";

// ENS Registry address on mainnet
const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";

// Basic ENS Registry ABI for resolver lookup
const ENS_REGISTRY_ABI = [
  {
    type: "function",
    name: "resolver",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ type: "address" }],
  },
];

// PublicResolver ABI for addr function
const PUBLIC_RESOLVER_ABI = [
  {
    type: "function",
    name: "addr",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "text",
    stateMutability: "view",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "key", type: "string" },
    ],
    outputs: [{ type: "string" }],
  },
];

export default function ENSResolverPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchType, setSearchType] = useState("auto"); // auto, name, address
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const { isConnected } = useAccount();

  // Auto-detect if input is an address or ENS name
  const detectedType = searchInput
    ? isAddress(searchInput)
      ? "address"
      : searchInput.includes(".")
      ? "name"
      : "unknown"
    : null;

  // ENS name to address resolution using Wagmi's built-in hook
  const {
    data: ensAddress,
    error: ensAddressError,
    isLoading: isLoadingAddress,
  } = useEnsAddress({
    name: detectedType === "name" ? normalize(searchInput) : undefined,
    chainId: 11155111,
  });

  // Reverse ENS lookup (address to name) - we'll use useEnsName for this
  const {
    data: ensName,
    error: ensNameError,
    isLoading: isLoadingName,
  } = useEnsName({
    address: detectedType === "address" ? searchInput : undefined,
    chainId: 11155111, // Mainnet for ENS
  });

  // Get resolver address for the ENS name
  const {
    data: resolverAddress,
    isLoading: isLoadingResolver,
  } = useEnsResolver({
    name: detectedType === "name" ? normalize(searchInput) : undefined,
    chainId: 11155111,
  });

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      setError("Please enter an ENS name or Ethereum address");
      return;
    }

    setIsSearching(true);
    setError("");
    setResults(null);

    try {
      // Results will be handled by the useEffect below
      // The actual resolution happens automatically via the hooks
    } catch (err) {
      console.error("Search failed:", err);
      setError("Search failed: " + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  // Update results when hooks return data
  useEffect(() => {
    if (detectedType === "name" && (ensAddress || ensAddressError)) {
      setResults({
        type: "name",
        input: searchInput,
        resolvedAddress: ensAddress,
        resolverAddress: resolverAddress,
        error: ensAddressError?.message,
      });
      setIsSearching(false);
    } else if (detectedType === "address" && (ensName || ensNameError)) {
      setResults({
        type: "address", 
        input: searchInput,
        resolvedName: ensName,
        error: ensNameError?.message,
      });
      setIsSearching(false);
    } else if (detectedType === "unknown" && searchInput) {
      setError("Please enter a valid ENS name (e.g., vitalik.eth) or Ethereum address");
      setIsSearching(false);
    }
  }, [ensAddress, ensAddressError, ensName, ensNameError, detectedType, searchInput, resolverAddress]);

  const resetSearch = () => {
    setSearchInput("");
    setResults(null);
    setError("");
    setIsSearching(false);
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
              <Image src="/logo.png" alt="Melon logo" width={32} height={32} className="h-8 w-8" />
            </span>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-white/50">
                Melon
              </p>
              <p className="text-lg font-semibold tracking-tight text-white">
                ENS Resolver
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
                Please connect your wallet to resolve ENS names and addresses.
              </p>
            </div>
          ) : results ? (
            <div className="rounded-[32px] border border-emerald-400/20 bg-emerald-400/5 p-8 backdrop-blur-xl">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-3xl font-semibold text-white mb-4">
                  Resolution Results
                </h2>
              </div>

              {results.error ? (
                <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-red-300 mb-6">
                  <p className="text-sm">{results.error}</p>
                </div>
              ) : (
                <div className="space-y-3 text-sm text-white/60 mb-8">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                    <span>Input:</span>
                    <span className="text-white font-mono break-all">
                      {results.input}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                    <span>Type:</span>
                    <span className="text-white font-medium">
                      {results.type === "name" ? "ENS Name → Address" : "Address → ENS Name"}
                    </span>
                  </div>

                  {results.resolvedAddress && (
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span>Resolved Address:</span>
                      <a
                        href={`https://etherscan.io/address/${results.resolvedAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 font-mono break-all"
                      >
                        {results.resolvedAddress}
                      </a>
                    </div>
                  )}

                  {results.resolvedName && (
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span>Resolved Name:</span>
                      <span className="text-emerald-400 font-medium">
                        {results.resolvedName}
                      </span>
                    </div>
                  )}

                  {results.resolverAddress && (
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span>Resolver Contract:</span>
                      <a
                        href={`https://etherscan.io/address/${results.resolverAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 font-mono"
                      >
                        {results.resolverAddress?.slice(0, 10)}...{results.resolverAddress?.slice(-8)}
                      </a>
                    </div>
                  )}

                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                    <span>Network:</span>
                    <span className="text-white font-medium">Ethereum Sepolia</span>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                    <span>Status:</span>
                    <span className="inline-flex items-center gap-2 text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      Resolved
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={resetSearch}
                className="w-full rounded-2xl border border-white/30 px-6 py-3 text-white/70 transition hover:border-white/50 hover:text-white"
              >
                Search Another
              </button>
            </div>
          ) : (
            <div className="rounded-[32px] border border-white/15 bg-white/[0.06] p-8 backdrop-blur-xl">
              <h1 className="text-3xl font-semibold text-white mb-6 text-center">
                ENS Name Resolver
              </h1>

              <p className="text-center text-white/70 mb-8">
                Resolve ENS names to addresses or addresses to ENS names
              </p>

              {error && (
                <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-red-300">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    ENS Name or Ethereum Address
                  </label>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Enter ENS name (e.g., vitalik.eth) or address (0x...)"
                    className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 backdrop-blur focus:border-white/40 focus:outline-none"
                    disabled={isSearching}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                  {searchInput && detectedType && (
                    <p className="text-xs text-white/50 mt-2">
                      Detected: {detectedType === "address" ? "Ethereum Address" : detectedType === "name" ? "ENS Name" : "Unknown format"}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="font-medium text-white mb-2">
                    Resolution Details
                  </h3>
                  <div className="space-y-2 text-sm text-white/70">
                    <div className="flex justify-between">
                      <span>Supported Types:</span>
                      <span className="text-white font-medium">ENS Names ↔ Addresses</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network:</span>
                      <span className="text-white font-medium">Ethereum Sepolia</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Resolution Method:</span>
                      <span className="text-white font-medium">ENS Registry + Universal Resolver</span>
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                {(isSearching || isLoadingAddress || isLoadingName || isLoadingResolver) && (
                  <div className="rounded-2xl border border-blue-400/20 bg-blue-400/5 p-4">
                    <div className="flex items-center gap-3 text-blue-300">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-300/30 border-t-blue-300"></div>
                      <span className="text-sm">
                        {isLoadingResolver && "Getting resolver address..."}
                        {isLoadingAddress && "Resolving ENS name to address..."}
                        {isLoadingName && "Resolving address to ENS name..."}
                        {isSearching && !isLoadingAddress && !isLoadingName && !isLoadingResolver && "Processing..."}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSearch}
                  disabled={isSearching || isLoadingAddress || isLoadingName || isLoadingResolver || !searchInput.trim()}
                  className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 px-8 py-4 text-lg font-medium text-white shadow-lg shadow-purple-600/40 transition hover:scale-[1.01] hover:shadow-purple-500/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSearching || isLoadingAddress || isLoadingName || isLoadingResolver ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                      Resolving...
                    </div>
                  ) : (
                    "Resolve ENS"
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