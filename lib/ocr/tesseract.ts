import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

// Look for tesseract binary in common locations
const TESSERACT_PATHS = [
  "/opt/homebrew/bin/tesseract",
  "/usr/local/bin/tesseract",
  "/usr/bin/tesseract",
  "tesseract",
];

async function getTesseractBinary(): Promise<string | null> {
  for (const p of TESSERACT_PATHS) {
    try {
      await execFileAsync(p, ["--version"]);
      return p;
    } catch {
      continue;
    }
  }
  return null;
}

export async function runNativeTesseract(
  imageBuffer: Buffer
): Promise<{ text: string; confidence: number }> {
  const binary = await getTesseractBinary();

  if (!binary) {
    throw new Error("Native Tesseract binary not found on system");
  }

  const tempFilePath = path.join(
    os.tmpdir(),
    `clinic_ocr_${Date.now()}_${Math.random().toString(36).substring(7)}.png`
  );

  try {
    await fs.writeFile(tempFilePath, imageBuffer);

    // Run tesseract with timeout of 10s
    const { stdout } = await execFileAsync(
      binary,
      [tempFilePath, "stdout", "-l", "eng", "--psm", "3"],
      { timeout: 10000, maxBuffer: 10 * 1024 * 1024 }
    );

    const trimmed = stdout.trim();
    return {
      text: trimmed || "(No legible text detected by OCR)",
      confidence: trimmed ? 85 : 0,
    };
  } finally {
    try {
      await fs.unlink(tempFilePath);
    } catch {
      // ignore cleanup errors
    }
  }
}
