"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { GeminiResponse } from "@/types";
import { Plus, Trash2, Save } from "lucide-react";

const MedicineSchema = z.object({
  name: z.string().min(1),
  dosage: z.string(),
  frequency: z.string(),
});

const ReviewSchema = z.object({
  correctedText: z.string().min(1, "Corrected text is required"),
  aiSummary: z.string(),
  medicines: z.array(MedicineSchema),
  importantFindings: z.array(z.string()),
  tags: z.array(z.string()),
  doctorNotes: z.string(),
});

type ReviewValues = z.infer<typeof ReviewSchema>;

interface Props {
  aiResult: GeminiResponse;
  rawOcr: string;
  onSave: (data: ReviewValues) => Promise<void>;
  isSaving: boolean;
}

export function ReviewForm({ aiResult, rawOcr, onSave, isSaving }: Props) {
  const [newTag, setNewTag] = useState("");
  const [newFinding, setNewFinding] = useState("");

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ReviewValues>({
    resolver: zodResolver(ReviewSchema),
    defaultValues: {
      correctedText: aiResult.corrected_text,
      aiSummary: aiResult.summary,
      medicines: aiResult.medicines,
      importantFindings: aiResult.important_findings,
      tags: aiResult.tags,
      doctorNotes: "",
    },
  });

  const { fields: medicineFields, append: appendMedicine, remove: removeMedicine } = useFieldArray({
    control,
    name: "medicines",
  });

  const tags = watch("tags");
  const importantFindings = watch("importantFindings");

  const addTag = () => {
    if (newTag.trim()) {
      setValue("tags", [...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (idx: number) => {
    setValue("tags", tags.filter((_, i) => i !== idx));
  };

  const addFinding = () => {
    if (newFinding.trim()) {
      setValue("importantFindings", [...importantFindings, newFinding.trim()]);
      setNewFinding("");
    }
  };

  const removeFinding = (idx: number) => {
    setValue("importantFindings", importantFindings.filter((_, i) => i !== idx));
  };

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Review & Edit AI Output</h2>
        <p className="text-sm text-slate-500">Review all fields before saving</p>
      </div>

      {/* Corrected Text */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Corrected Prescription Text
          <span className="ml-2 text-xs text-slate-400 font-normal">(AI-corrected, editable)</span>
        </label>
        <textarea
          {...register("correctedText")}
          rows={6}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.correctedText && (
          <p className="text-xs text-red-500 mt-1">{errors.correctedText.message}</p>
        )}
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <label className="block text-sm font-semibold text-slate-700 mb-2">AI Summary</label>
        <textarea
          {...register("aiSummary")}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Medicines */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-semibold text-slate-700">Medicines</label>
          <button
            type="button"
            onClick={() => appendMedicine({ name: "", dosage: "", frequency: "" })}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Medicine
          </button>
        </div>
        <div className="space-y-3">
          {medicineFields.map((field, i) => (
            <div key={field.id} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <input
                  {...register(`medicines.${i}.name`)}
                  placeholder="Medicine name"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  {...register(`medicines.${i}.dosage`)}
                  placeholder="Dosage (e.g. 500mg)"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  {...register(`medicines.${i}.frequency`)}
                  placeholder="Frequency"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => removeMedicine(i)}
                className="mt-2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {medicineFields.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">No medicines extracted</p>
          )}
        </div>
      </div>

      {/* Important Findings */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <label className="block text-sm font-semibold text-slate-700 mb-3">Important Findings</label>
        <div className="space-y-2 mb-3">
          {importantFindings.map((finding, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 text-sm text-slate-600 bg-amber-50 rounded-lg px-3 py-1.5">
                {finding}
              </span>
              <button type="button" onClick={() => removeFinding(i)} className="text-slate-400 hover:text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newFinding}
            onChange={(e) => setNewFinding(e.target.value)}
            placeholder="Add a finding..."
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFinding())}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addFinding}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Tags */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <label className="block text-sm font-semibold text-slate-700 mb-3">Tags</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
            >
              {tag}
              <button type="button" onClick={() => removeTag(i)} className="hover:text-red-500 ml-0.5">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add a tag..."
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addTag}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Doctor Notes */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Doctor Notes</label>
        <textarea
          {...register("doctorNotes")}
          rows={3}
          placeholder="Add personal notes, follow-up instructions, observations..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Save */}
      <button
        type="submit"
        disabled={isSaving}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
      >
        <Save className="h-4 w-4" />
        {isSaving ? "Saving..." : "Save Prescription Record"}
      </button>
    </form>
  );
}
