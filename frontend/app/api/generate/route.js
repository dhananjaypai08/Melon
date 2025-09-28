import { NextRequest, NextResponse } from "next/server";
import { AIProofEngine } from "../../../lib/ai-proof.js";

// Ensure this is treated as a dynamic route
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    console.log("API route called - starting image generation");

    // Parse form data
    const formData = await request.formData();
    const prompt = formData.get("prompt") || "";

    console.log("Prompt received:", prompt);

    // Validate environment variables
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
      return NextResponse.json(
        { error: "Google AI API key not configured" },
        { status: 500 }
      );
    }

    // Collect all uploaded images
    const imageFiles = formData.getAll("images");
    console.log("Number of images received:", imageFiles.length);

    // Dynamic import of 'ai' package to avoid build issues
    const { generateText } = await import("ai");

    // Convert files into Gemini-compatible format
    const imageContents = await Promise.all(
      imageFiles.map(async (file) => ({
        type: "image",
        image: Buffer.from(await file.arrayBuffer()),
        mediaType: file.type,
      }))
    );

    const userContent = [{ type: "text", text: prompt }, ...imageContents];

    console.log("Calling Gemini API...");

    // Call Gemini API
    const result = await generateText({
      model: "google/gemini-2.5-flash-image-preview",
      prompt: [{ role: "user", content: userContent }],
    });

    console.log("Gemini API response received");

    // Get generated images
    const generatedImages =
      result.files
        ?.filter((f) => f.mediaType.startsWith("image/"))
        ?.map((f) => Buffer.from(f.uint8Array).toString("base64")) || [];

    console.log("Number of generated images:", generatedImages.length);

    if (generatedImages.length === 0) {
      return NextResponse.json(
        { error: "No images were generated" },
        { status: 400 }
      );
    }

    // Initialize AI proof engine
    let aiProof;
    try {
      aiProof = new AIProofEngine();
    } catch (proofError) {
      console.warn("AI Proof Engine not available:", proofError.message);
      // Return images without proof if proof engine fails
      return NextResponse.json({
        images: generatedImages,
        proofs: generatedImages.map(() => null),
        errors: generatedImages.map((_, index) => ({
          index,
          error: "Proof generation not available",
        })),
      });
    }

    // Process each image to add proof
    const processedImages = await Promise.all(
      generatedImages.map(async (base64Image, index) => {
        try {
          console.log(`Processing image ${index + 1} for proof...`);

          const { imageWithProof, proof } = await aiProof.processAIImage(
            prompt,
            "google/gemini-2.5-flash-image-preview",
            base64Image
          );

          // Check if proof was actually embedded
          const proofEmbedded = imageWithProof !== base64Image;

          return {
            image: imageWithProof,
            proof: proof,
            index: index,
            proofEmbedded: proofEmbedded,
            error: proofEmbedded
              ? null
              : "EXIF embedding failed - proof generated but not embedded",
          };
        } catch (error) {
          console.error(`Failed to add proof to image ${index}:`, error);
          // Return original image if proof embedding fails
          return {
            image: base64Image,
            proof: null,
            index: index,
            proofEmbedded: false,
            error: "Proof generation failed",
          };
        }
      })
    );

    console.log("Image processing complete");

    return NextResponse.json({
      images: processedImages.map((item) => item.image),
      proofs: processedImages.map((item) => item.proof),
      errors: processedImages
        .filter((item) => item.error)
        .map((item) => ({ index: item.index, error: item.error })),
    });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to generate images",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Explicitly handle other methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}
