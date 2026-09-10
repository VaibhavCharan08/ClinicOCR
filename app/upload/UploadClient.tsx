"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadZone } from "@/components/upload/UploadZone";
import { ProcessingSteps, type Step, type StepStatus } from "@/components/upload/ProcessingSteps";
import { ReviewForm } from "@/components/prescription/ReviewForm";
import { createPrescription } from "@/actions/prescriptions";
import type { Patient, GeminiResponse } from "@/types";
import { UserCircle, Sparkles, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Props {
  patients: Patient[];
  defaultPatientId?: string;
}

type Phase = "select" | "upload" | "processing" | "review";

const initialSteps: Step[] = [
  { id: "ocr", label: "Tesseract OCR Extraction", status: "pending", description: "Extracting raw text from prescription" },
  { id: "ai", label: "Gemini AI Medical Intelligence", status: "pending", description: "Correcting OCR, extracting medicines & dosages" },
  { id: "structure", label: "Structuring Medical Record", status: "pending", description: "Organizing patient treatment plan" },
];

export function UploadClient({ patients, defaultPatientId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [phase, setPhase] = useState<Phase>(defaultPatientId ? "upload" : "select");
  const [selectedPatientId, setSelectedPatientId] = useState(defaultPatientId ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [rawOcr, setRawOcr] = useState("");
  const [aiResult, setAiResult] = useState<GeminiResponse | null>(null);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const updateStep = (id: string, status: StepStatus, description?: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status, description: description ?? s.description } : s))
    );
  };

  const handleImageSelected = (file: File, dataUrl: string) => {
    setImageFile(file);
    setImagePreview(dataUrl);
    setPhase("upload");
  };

  const handleAnalyze = async () => {
    if (!imageFile || !selectedPatientId) {
      toast.error("Please select a patient and upload a prescription image");
      return;
    }

    setPhase("processing");
    setSteps(initialSteps.map((s) => ({ ...s, status: "pending" })));

    try {
      // Step 1: Fast Native Tesseract OCR
      updateStep("ocr", "loading", "Analyzing handwriting with Tesseract...");
      const formData = new FormData();
      formData.append("image", imageFile);

      let extractedOcr = "";
      try {
        const ocrRes = await fetch("/api/ocr", { method: "POST", body: formData });
        if (ocrRes.ok) {
          const ocrJson = await ocrRes.json();
          extractedOcr = ocrJson.rawOcr || "";
          setRawOcr(extractedOcr);
          updateStep("ocr", "done", `OCR completed (${ocrJson.engine || "Tesseract"})`);
        } else {
          updateStep("ocr", "done", "OCR extraction completed with AI fallback");
        }
      } catch (e) {
        console.warn("OCR API error:", e);
        updateStep("ocr", "done", "Proceeding directly with Gemini multimodal AI");
      }

      // Step 2: Gemini AI (Multimodal Vision + OCR text)
      updateStep("ai", "loading", "Gemini 2.0 Flash analyzing medications & instructions...");
      const aiRes = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawOcr: extractedOcr,
          imageBase64: imagePreview,
          mimeType: imageFile.type || "image/jpeg",
        }),
      });

      if (!aiRes.ok) {
        const err = await aiRes.json().catch(() => ({}));
        throw new Error(err.error || "AI processing failed");
      }

      const aiData: GeminiResponse = await aiRes.json();
      setAiResult(aiData);
      updateStep("ai", "done", "Medications and diagnosis successfully extracted");

      // Step 3: Structuring
      updateStep("structure", "loading", "Formatting structured review form...");
      await new Promise((r) => setTimeout(r, 200));
      updateStep("structure", "done", "Ready for doctor review");

      setPhase("review");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Processing failed. Please try again.");
      setSteps((prev) => prev.map((s) => (s.status === "loading" ? { ...s, status: "error" } : s)));
      setPhase("upload");
    }
  };

  const handleSave = async (reviewedData: {
    correctedText: string;
    aiSummary: string;
    medicines: GeminiResponse["medicines"];
    importantFindings: string[];
    tags: string[];
    doctorNotes: string;
  }) => {
    if (!selectedPatientId) return;

    startTransition(async () => {
      const imageUrl = imagePreview ?? "";

      const result = await createPrescription({
        patientId: selectedPatientId,
        imageUrl,
        rawOcr: rawOcr || reviewedData.correctedText,
        correctedText: reviewedData.correctedText,
        aiSummary: reviewedData.aiSummary,
        medicinesJson: reviewedData.medicines,
        doctorNotes: reviewedData.doctorNotes,
        tags: reviewedData.tags,
      });

      if (result.success) {
        toast.success("Prescription saved to patient record!");
        router.push(`/prescriptions/${result.data.id}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Upload & Digitize Prescription</h1>
        <p className="text-slate-500 mt-1">Convert handwritten prescriptions into structured digital medical records</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        {["Select Patient", "Upload Image", "AI Processing", "Doctor Review"].map((label, i) => {
          const phaseMap: Phase[] = ["select", "upload", "processing", "review"];
          const current = phaseMap.indexOf(phase);
          const isActive = i === current;
          const isDone = i < current;

          return (
            <div key={label} className="flex items-center gap-2 shrink-0">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  isDone
                    ? "bg-emerald-500 text-white"
                    : isActive
                    ? "bg-blue-600 text-white ring-4 ring-blue-100"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {isDone ? "✓" : i + 1}
              </div>
              <span className={`text-sm ${isActive ? "font-semibold text-slate-900" : "text-slate-500"}`}>
                {label}
              </span>
              {i < 3 && <div className="h-px w-6 bg-slate-200 mx-1" />}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Selector */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="block text-sm font-semibold text-slate-800 mb-3">
              <UserCircle className="inline h-4 w-4 mr-1.5 text-blue-600" />
              1. Select Patient
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => {
                setSelectedPatientId(e.target.value);
                if (e.target.value && phase === "select") setPhase("upload");
              }}
              disabled={phase === "processing"}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">— Choose an existing patient —</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.age} yrs ({p.gender}) • Tel: {p.phone}
                </option>
              ))}
            </select>
            {patients.length === 0 && (
              <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                <span>No patients registered yet. Add your first patient to proceed.</span>
                <Link href="/patients" className="font-semibold underline ml-2">
                  Add Patient →
                </Link>
              </div>
            )}
          </div>

          {/* Upload Zone */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-800 mb-3">
              <FileText className="inline h-4 w-4 mr-1.5 text-blue-600" />
              2. Upload Prescription Image
            </p>
            <UploadZone
              onImageSelected={handleImageSelected}
              disabled={phase === "processing"}
            />
          </div>

          {/* Raw OCR Display (if available) */}
          {rawOcr && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-800 mb-2">Raw Tesseract OCR Output</p>
              <pre className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3.5 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                {rawOcr}
              </pre>
            </div>
          )}

          {/* Analyze Button */}
          {phase === "upload" && (
            <button
              onClick={handleAnalyze}
              disabled={!selectedPatientId || !imageFile}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg disabled:hover:shadow-none"
            >
              <Sparkles className="h-4 w-4" />
              Process with Tesseract & Gemini AI
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Processing Steps Indicator */}
          {(phase === "processing" || phase === "review") && (
            <ProcessingSteps steps={steps} />
          )}

          {/* Selected Patient Info Card */}
          {selectedPatient && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
              <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-3">Patient Record</p>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white font-semibold shadow-sm">
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{selectedPatient.name}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {selectedPatient.age} yrs • <span className="capitalize">{selectedPatient.gender}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">📞 {selectedPatient.phone}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Doctor Review Form */}
      {phase === "review" && aiResult && (
        <div className="mt-8 pt-8 border-t border-slate-200">
          <ReviewForm
            aiResult={aiResult}
            rawOcr={rawOcr}
            onSave={handleSave}
            isSaving={isPending}
          />
        </div>
      )}
    </div>
  );
}
