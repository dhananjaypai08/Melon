import { generateText } from "ai";
import { NextResponse } from "next/server";
import { AIProofEngine } from "../../../lib/ai-proof.js";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const prompt = formData.get("prompt") || "";

    // Collect all uploaded images
    const imageFiles = formData.getAll("images");

    // Convert files into Gemini-compatible format (async)
    const imageContents = await Promise.all(
      imageFiles.map(async (file) => ({
        type: "image",
        image: Buffer.from(await file.arrayBuffer()),
        mediaType: file.type,
      }))
    );

    const userContent = [{ type: "text", text: prompt }, ...imageContents];

    const result = await generateText({
      model: "google/gemini-2.5-flash-image-preview",
      prompt: [{ role: "user", content: userContent }],
    });

    // Get generated images
    const generatedImages = result.files
      .filter((f) => f.mediaType.startsWith("image/"))
      .map((f) => Buffer.from(f.uint8Array).toString("base64"));

    // Initialize AI proof engine
    const aiProof = new AIProofEngine();

    // Process each image to add proof
    const processedImages = generatedImages.map((base64Image, index) => {
      try {
        const { imageWithProof, proof } = aiProof.processAIImage(
          prompt,
          "google/gemini-2.5-flash-image-preview",
          base64Image
        );

        return {
          image: imageWithProof,
          proof: proof,
          index: index,
        };
      } catch (error) {
        console.error(`Failed to add proof to image ${index}:`, error);
        // Return original image if proof embedding fails
        return {
          image: base64Image,
          proof: null,
          index: index,
          error: "Proof embedding failed",
        };
      }
    });

    return NextResponse.json({
      images: processedImages.map((item) => item.image),
      proofs: processedImages.map((item) => item.proof),
      errors: processedImages
        .filter((item) => item.error)
        .map((item) => ({ index: item.index, error: item.error })),
    });
  } catch (err) {
    console.error("Image generation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate images" },
      { status: 500 }
    );
  }
}
