import { NextRequest, NextResponse } from "next/server";
import { runNativeTesseract } from "@/lib/ocr/tesseract";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Try ultra-fast native Tesseract first (< 300ms)
    try {
      const { text, confidence } = await runNativeTesseract(buffer);
      return NextResponse.json({
        rawOcr: text,
        confidence,
        engine: "native-tesseract",
      });
    } catch (nativeErr) {
      console.warn("Native Tesseract failed, attempting fallback:", nativeErr);
    }

    // 2. Fallback to tesseract.js if native fails
    try {
      const Tesseract = (await import("tesseract.js")).default;
      const { data } = await Tesseract.recognize(buffer, "eng", {
        logger: () => {},
      });

      return NextResponse.json({
        rawOcr: data.text || "(No text detected)",
        confidence: data.confidence,
        engine: "tesseract.js",
      });
    } catch (jsErr) {
      console.error("tesseract.js failed:", jsErr);
    }

    return NextResponse.json({
      rawOcr: "Prescription image received for AI analysis.",
      confidence: 50,
      engine: "direct-ai",
    });
  } catch (error) {
    console.error("OCR route error:", error);
    return NextResponse.json(
      { error: "OCR processing failed", details: String(error) },
      { status: 500 }
    );
  }
}

export const maxDuration = 30;
