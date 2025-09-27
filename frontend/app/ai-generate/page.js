"use client";
import { useState } from "react";

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState([]); // store File objects
  const [previews, setPreviews] = useState([]); // store preview URLs
  const [generatedImages, setGeneratedImages] = useState([]);
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
        setGeneratedImages(data.images); // array of base64 images
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

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Nano Banana AI Image Generator 🍌
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          className="w-full border rounded p-2"
          rows="3"
          placeholder="Enter your prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
        />

        {/* Preview selected images */}
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            {previews.map((file, idx) => (
              <div key={idx} className="border rounded p-2">
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-32 object-cover"
                />
                <p className="text-xs mt-1 truncate">{file.name}</p>
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>

      {/* Display generated images */}
      {generatedImages.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Generated Images</h2>
          <div className="grid grid-cols-2 gap-4">
            {generatedImages.map((img, idx) => (
              <img
                key={idx}
                src={`data:image/png;base64,${img}`}
                alt={`Generated ${idx}`}
                className="w-full rounded border"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
