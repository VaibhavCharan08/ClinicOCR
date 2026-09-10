"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleImportant, deletePrescription } from "@/actions/prescriptions";
import type { PrescriptionWithPatient } from "@/types";
import { ArrowLeft, Star, Trash2, User, Pill, FileText, Lightbulb, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/utils/date";

export function PrescriptionDetailClient({ prescription }: { prescription: PrescriptionWithPatient }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggleImportant = () => {
    startTransition(async () => {
      const result = await toggleImportant(prescription.id, prescription.important);
      if (result.success) {
        toast.success(prescription.important ? "Removed from important" : "Marked as important");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this prescription? This action cannot be undone.")) return;
    startTransition(async () => {
      const result = await deletePrescription(prescription.id, prescription.patientId);
      if (result.success) {
        toast.success("Prescription deleted");
        router.push(`/patients/${prescription.patientId}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back + Actions */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/patients/${prescription.patientId}`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {prescription.patient?.name}
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleImportant}
            disabled={isPending}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              prescription.important
                ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Star className={`h-4 w-4 ${prescription.important ? "fill-amber-500 text-amber-500" : ""}`} />
            {prescription.important ? "Important" : "Mark Important"}
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 mb-6">
        <div className="flex items-start gap-4">
          {prescription.imageUrl && (
            <img
              src={prescription.imageUrl}
              alt="Prescription"
              className="h-24 w-24 rounded-lg object-cover border border-slate-200 flex-shrink-0"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {prescription.important && <Star className="h-4 w-4 fill-amber-500 text-amber-500" />}
              <span className="text-xs text-slate-400 font-medium">{formatDate(new Date(prescription.createdAt))}</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-slate-400" />
              <Link href={`/patients/${prescription.patientId}`} className="font-semibold text-blue-600 hover:underline">
                {prescription.patient?.name}
              </Link>
              <span className="text-slate-400 text-sm">
                ({prescription.patient?.age}y, {prescription.patient?.gender})
              </span>
            </div>
            {prescription.aiSummary && (
              <p className="text-sm text-slate-600 leading-relaxed">{prescription.aiSummary}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Corrected Text */}
          <Section title="Prescription Text" icon={<FileText className="h-4 w-4 text-blue-500" />}>
            <pre className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{prescription.correctedText}</pre>
          </Section>

          {/* Medicines */}
          {prescription.medicinesJson && prescription.medicinesJson.length > 0 && (
            <Section title="Medicines" icon={<Pill className="h-4 w-4 text-emerald-500" />}>
              <div className="space-y-3">
                {prescription.medicinesJson.map((med, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg bg-emerald-50 p-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 flex-shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{med.name}</p>
                      {(med.dosage || med.frequency) && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {[med.dosage, med.frequency].filter(Boolean).join(" • ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Raw OCR */}
          <Section title="Raw OCR Output" icon={<FileText className="h-4 w-4 text-slate-400" />}>
            <pre className="text-xs text-slate-500 bg-slate-50 rounded-lg p-4 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
              {prescription.rawOcr}
            </pre>
          </Section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Tags */}
          {prescription.tags && prescription.tags.length > 0 && (
            <Section title="Tags" icon={<Tag className="h-4 w-4 text-violet-500" />}>
              <div className="flex flex-wrap gap-1.5">
                {prescription.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                    {tag}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Doctor Notes */}
          {prescription.doctorNotes && (
            <Section title="Doctor Notes" icon={<Lightbulb className="h-4 w-4 text-amber-500" />}>
              <p className="text-sm text-slate-600 leading-relaxed">{prescription.doctorNotes}</p>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}
