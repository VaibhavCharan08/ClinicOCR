import { NextRequest, NextResponse } from "next/server";
import { processWithGemini } from "@/lib/ocr/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawOcr, imageBase64, mimeType } = body;

    if (!rawOcr && !imageBase64) {
      return NextResponse.json(
        { error: "rawOcr text or imageBase64 is required" },
        { status: 400 }
      );
    }

    const result = await processWithGemini(
      rawOcr || "Prescription handwritten document",
      imageBase64,
      mimeType
    );
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("AI route error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process with AI" },
      { status: 500 }
    );
  }
}

export const maxDuration = 30;
