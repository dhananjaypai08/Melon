"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Download,
  Shield,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Bot,
  Upload,
  ImagePlus,
} from "lucide-react";

export default function AIGeneratePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState([]); // store File objects
  const [previews, setPreviews] = useState([]); // store preview URLs
  const [generatedImages, setGeneratedImages] = useState([]);
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);

    const newPreviews = selectedFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    setPreviews((prev) => {
      // Revoke the URL to prevent memory leaks
      URL.revokeObjectURL(prev[indexToRemove].url);
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt && files.length === 0) return;

    setLoading(true);
    setGeneratedImages([]);
    setProofs([]);

    const formData = new FormData();
    formData.append("prompt", prompt);
    files.forEach((file) => formData.append("images", file));

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.images) {
        setGeneratedImages(data.images);
        setProofs(data.proofs || []);

        if (data.errors && data.errors.length > 0) {
          console.warn("Some images failed proof embedding:", data.errors);
        }
      } else {
        alert("No images returned from API");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error generating images");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (base64Image, index) => {
    const link = document.createElement("a");
    link.href = `data:image/jpeg;base64,${base64Image}`;
    link.download = `ai-generated-${index + 1}-with-proof.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020512] text-white">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-x-[-20%] top-[-35%] h-[520px] rounded-full bg-gradient-to-br from-violet-500/40 via-purple-500/30 to-indigo-500/30 blur-3xl"></div>
      <div className="pointer-events-none absolute inset-y-[-30%] right-[-25%] w-[520px] rounded-full bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-teal-400/20 blur-[120px]"></div>

      {/* Header */}
      <header className="relative z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 sm:px-8 lg:px-10">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex cursor-pointer items-center gap-3 transition hover:opacity-90"
            aria-label="Go to landing page"
          >
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
                AI Studio
              </p>
            </div>
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/ai-verify")}
              className="rounded-2xl border border-white/30 px-6 py-3 text-white/70 transition hover:border-white/50 hover:text-white"
            >
              Verify AI Image
            </button>
            <button
              onClick={() => router.push("/")}
              className="rounded-2xl border border-white/30 px-6 py-3 text-white/70 transition hover:border-white/50 hover:text-white"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 px-6 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex self-start items-center gap-3 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm text-white/70 backdrop-blur mb-6">
              <Bot className="h-4 w-4 text-purple-400" />
              AI Content Generation
              <span className="text-white/40">•</span>
              <Sparkles className="h-4 w-4 text-yellow-400" />
              Cryptographic Proof
            </div>
            <h1 className="text-4xl font-semibold text-white mb-4 sm:text-5xl">
              Generate AI Images with Proof
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Create stunning AI-generated images with embedded cryptographic
              proof of authenticity. Every image includes tamper-proof metadata
              and digital signatures.
            </p>
          </div>

          {/* Generation Form */}
          <div className="rounded-[32px] border border-white/15 bg-white/[0.06] p-8 backdrop-blur-xl mb-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Prompt Input */}
              <div>
                <label className="block text-lg font-medium text-white mb-3">
                  Describe Your Vision
                </label>
                <textarea
                  className="w-full rounded-2xl border border-white/20 bg-white/5 px-6 py-4 text-white placeholder-white/40 backdrop-blur focus:border-white/40 focus:outline-none resize-none"
                  rows="4"
                  placeholder="A serene mountain landscape at sunset with golden light reflecting on a crystal clear lake, photorealistic style..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <p className="text-sm text-white/50 mt-2">
                  Be descriptive to get the best results. Include style, mood,
                  colors, and composition details.
                </p>
              </div>

              {/* Reference Images */}
              <div>
                <label className="block text-lg font-medium text-white mb-3">
                  Reference Images{" "}
                  <span className="text-white/50 text-sm font-normal">
                    (Optional)
                  </span>
                </label>
                <div className="border-2 border-dashed border-white/20 rounded-[24px] p-8 text-center hover:border-white/40 transition-colors">
                  <ImagePlus className="mx-auto h-12 w-12 text-white/40 mb-4" />
                  <p className="text-white/70 mb-4">
                    Upload reference images to guide the AI generation
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById("file-upload").click()
                    }
                    className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-400/30 px-6 py-3 text-purple-300 transition hover:bg-gradient-to-r hover:from-purple-500/30 hover:to-indigo-500/30"
                  >
                    <Upload className="h-5 w-5" />
                    Choose Files
                  </button>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Preview Selected Images */}
              {previews.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">
                    Reference Images
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {previews.map((file, idx) => (
                      <div
                        key={idx}
                        className="group relative rounded-2xl border border-white/10 bg-white/5 p-3 hover:border-white/30 transition-colors"
                      >
                        <div className="relative">
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                        <p className="text-xs mt-2 text-white/60 truncate">
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                type="submit"
                disabled={loading || (!prompt.trim() && files.length === 0)}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 px-8 py-6 text-xl font-medium text-white shadow-lg shadow-purple-600/40 transition hover:scale-[1.01] hover:shadow-purple-500/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    <span>Generating with Cryptographic Proof...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <Sparkles className="h-6 w-6" />
                    <span>Generate AI Images</span>
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Generated Images Results */}
          {generatedImages.length > 0 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-semibold text-white mb-4 flex items-center justify-center gap-3">
                  <Shield className="h-8 w-8 text-emerald-400" />
                  Generated with Cryptographic Proof
                </h2>
                <p className="text-white/70">
                  Each image contains embedded proof of AI generation with
                  digital signatures
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {generatedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="group rounded-[32px] border border-white/15 bg-white/[0.06] p-6 backdrop-blur-xl hover:border-white/25 transition-colors"
                  >
                    <div className="space-y-6">
                      {/* Image Container */}
                      <div className="relative">
                        <div className="relative overflow-hidden rounded-2xl border border-white/10">
                          <img
                            src={`data:image/jpeg;base64,${img}`}
                            alt={`AI Generated ${idx + 1}`}
                            className="w-full aspect-square object-cover"
                          />
                          {/* Proof Badge */}
                          <div className="absolute top-4 right-4">
                            <div className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 backdrop-blur">
                              {proofs[idx] ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                                  <span className="text-sm text-emerald-300 font-medium">
                                    Proof Embedded
                                  </span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                                  <span className="text-sm text-yellow-300 font-medium">
                                    No Proof
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Proof Information */}
                      {proofs[idx] && (
                        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6">
                          <h4 className="text-lg font-medium text-emerald-300 mb-4 flex items-center gap-3">
                            <Shield className="h-5 w-5" />
                            Cryptographic Proof Details
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-3">
                              <div>
                                <span className="text-white/60">
                                  Generation Time:
                                </span>
                                <p className="text-white font-medium">
                                  {new Date(
                                    proofs[idx].timestamp
                                  ).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <span className="text-white/60">AI Model:</span>
                                <p className="text-white font-medium">
                                  {proofs[idx].ai_model?.split("/").pop() ||
                                    "Gemini 2.5 Flash"}
                                </p>
                              </div>
                              <div>
                                <span className="text-white/60">
                                  Proof Type:
                                </span>
                                <p className="text-white font-medium">
                                  {proofs[idx].proof_type || "AI Generated"}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <span className="text-white/60">Nonce:</span>
                                <p className="text-white font-mono text-xs">
                                  {proofs[idx].nonce?.slice(0, 16)}...
                                </p>
                              </div>
                              <div>
                                <span className="text-white/60">
                                  Image Hash:
                                </span>
                                <p className="text-white font-mono text-xs">
                                  {proofs[idx].image_hash?.slice(0, 16)}...
                                </p>
                              </div>
                              <div>
                                <span className="text-white/60">
                                  Signature:
                                </span>
                                <p className="text-white font-mono text-xs">
                                  {proofs[idx].signature?.slice(0, 16)}...
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-4">
                        <button
                          onClick={() => downloadImage(img, idx)}
                          className="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-4 text-white font-medium shadow-lg shadow-emerald-600/40 transition hover:scale-[1.01] hover:shadow-emerald-500/60"
                        >
                          <Download className="h-5 w-5" />
                          Download with Proof
                        </button>
                        <button
                          onClick={() => router.push("/ai-verify")}
                          className="px-6 py-4 rounded-2xl border border-white/30 text-white/70 transition hover:border-white/50 hover:text-white"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Instructions */}
              <div className="rounded-[32px] border border-blue-400/20 bg-blue-400/5 p-8 backdrop-blur-xl">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-400/20">
                    <Sparkles className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-blue-300 mb-3">
                      Next Steps: Verify Your AI Images
                    </h3>
                    <p className="text-blue-200 text-lg mb-4">
                      Download these images and test the verification process on
                      our
                      <strong> AI Verify</strong> page to see the embedded proof
                      data in action.
                    </p>
                    <button
                      onClick={() => router.push("/ai-verify")}
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-500/20 border border-blue-400/30 px-6 py-3 text-blue-300 transition hover:bg-blue-500/30"
                    >
                      <Shield className="h-5 w-5" />
                      Go to AI Verify
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
