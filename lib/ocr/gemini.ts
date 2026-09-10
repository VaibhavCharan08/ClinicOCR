import type { GeminiResponse } from "@/types";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `You are a medical document AI assistant specializing in analyzing handwritten prescriptions.
Your task is to process raw OCR text (and the prescription image if provided) and return accurate, structured medical data.

Rules:
1. Extract doctor details, patient details, diagnosis, prescribed medicines, dosages, frequencies, and duration accurately.
2. Never hallucinate or invent medications not indicated in the prescription.
3. If handwriting is ambiguous, prefix the medicine name with "Possibly " (e.g., "Possibly Levolin").
4. Return ONLY valid JSON matching the exact schema provided. No extra markdown.
5. If a field cannot be determined, use an empty string or empty array.`;

const USER_PROMPT_TEMPLATE = (rawOcr: string) => `
Analyze this handwritten medical prescription using the OCR text below:

Raw OCR Text:
---
${rawOcr}
---

Return a JSON object with this exact structure:
{
  "corrected_text": "Full corrected, legible, and formatted transcription of the entire prescription",
  "summary": "1-2 sentence concise clinical summary of the prescription",
  "medicines": [
    {
      "name": "Medicine name (prefix with 'Possibly ' if uncertain)",
      "dosage": "Dosage (e.g., 500mg, 10ml, 1 tab)",
      "frequency": "Frequency (e.g., 1-0-1 after food, twice daily, OD, BD, TDS)"
    }
  ],
  "important_findings": ["Any significant findings, diagnosis, vitals, warnings, or special instructions"],
  "tags": ["Relevant medical tags like: Fever, Antibiotic, Pediatric, Dermatology, Hypertension, etc."]
}`;

const CANDIDATE_MODELS = [
  "gemini-3.6-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-flash",
];

export async function processWithGemini(
  rawOcr: string,
  imageBase64?: string,
  mimeType: string = "image/jpeg"
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured");
  }

  const genAI = new GoogleGenAI({ apiKey });
  const model = genAI.models;

  const parts: any[] = [
    { text: `${SYSTEM_PROMPT}\n\n${USER_PROMPT_TEMPLATE(rawOcr)}` }
  ];

  if (imageBase64) {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    parts.unshift({
      inlineData: {
        data: cleanBase64,
        mimeType: mimeType || "image/jpeg",
      },
    });
  }

  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const response = await model.generateContent({
        model: modelName,
        contents: [
          {
            role: "user",
            parts,
          },
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const text = response.text;
      if (!text) continue;

      const cleaned = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const parsed: GeminiResponse = JSON.parse(cleaned);
      return parsed;
    } catch (err: any) {
      console.warn(`Model ${modelName} failed, trying next:`, err?.message || err);
      lastError = err;
    }
  }

  throw new Error(
    lastError?.message || "Failed to generate structured data from Gemini"
  );
}
