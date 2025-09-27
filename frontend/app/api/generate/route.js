import { generateText } from "ai";
import { NextResponse } from "next/server";

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

    const images = result.files
      .filter((f) => f.mediaType.startsWith("image/"))
      .map((f) => Buffer.from(f.uint8Array).toString("base64"));

    return NextResponse.json({ images });
  } catch (err) {
    console.error("Image generation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate images" },
      { status: 500 }
    );
  }
}
