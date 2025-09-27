"use client";
import { useState } from "react";
import { Download, Shield, CheckCircle, AlertTriangle } from "lucide-react";

export default function HomePage() {
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
    link.href = `data:image/png;base64,${base64Image}`;
    link.download = `ai-generated-${index + 1}-with-proof.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#020512] text-white">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            AI Image Generator with Proof
          </h1>
          <p className="text-white/70">
            Generate images with embedded cryptographic proof of AI creation
          </p>
        </div>

        {/* Form */}
        <div className="rounded-[32px] border border-white/15 bg-white/[0.06] p-8 backdrop-blur-xl mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Prompt
              </label>
              <textarea
                className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 backdrop-blur focus:border-white/40 focus:outline-none"
                rows="3"
                placeholder="Describe the image you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Reference Images (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white"
              />
            </div>

            {/* Preview selected images */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {previews.map((file, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3"
                  >
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <p className="text-xs mt-2 text-white/60 truncate">
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 px-8 py-4 text-lg font-medium text-white shadow-lg shadow-purple-600/40 transition hover:scale-[1.01] hover:shadow-purple-500/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  Generating with Proof...
                </div>
              ) : (
                "Generate Images"
              )}
            </button>
          </form>
        </div>

        {/* Display generated images with proof info */}
        {generatedImages.length > 0 && (
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
              <Shield className="h-6 w-6 text-emerald-400" />
              Generated Images with Cryptographic Proof
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {generatedImages.map((img, idx) => (
                <div
                  key={idx}
                  className="rounded-[32px] border border-white/15 bg-white/[0.06] p-6 backdrop-blur-xl"
                >
                  <div className="space-y-4">
                    {/* Image */}
                    <div className="relative">
                      <img
                        src={`data:image/png;base64,${img}`}
                        alt={`Generated ${idx + 1}`}
                        className="w-full rounded-2xl border border-white/10"
                      />
                      <div className="absolute top-3 right-3">
                        <div className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 backdrop-blur">
                          {proofs[idx] ? (
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-400" />
                          )}
                          <span className="text-xs text-white">
                            {proofs[idx] ? "Proof Embedded" : "No Proof"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Proof Information */}
                    {proofs[idx] && (
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
                        <h4 className="text-sm font-medium text-emerald-300 mb-3 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Cryptographic Proof Embedded
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-white/60">Timestamp:</span>
                            <p className="text-white font-medium">
                              {new Date(proofs[idx].timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-white/60">AI Model:</span>
                            <p className="text-white font-medium truncate">
                              {proofs[idx].ai_model?.split("/").pop() ||
                                "Gemini"}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-white/60">Image Hash:</span>
                            <p className="text-white font-mono text-xs truncate">
                              {proofs[idx].image_hash?.slice(0, 32)}...
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Download Button */}
                    <button
                      onClick={() => downloadImage(img, idx)}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/30 px-4 py-3 text-white/70 transition hover:border-white/50 hover:text-white"
                    >
                      <Download className="h-4 w-4" />
                      Download with Proof
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className="rounded-[32px] border border-blue-400/20 bg-blue-400/5 p-6 backdrop-blur-xl">
              <h3 className="text-lg font-medium text-blue-300 mb-3">
                🔍 Verification Instructions
              </h3>
              <p className="text-blue-200 text-sm">
                Download these images and upload them to{" "}
                <strong>/ai-verify</strong> page to verify their authenticity
                and view the embedded proof data.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
