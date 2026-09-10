import { getPatientById } from "@/actions/patients";
import { getPrescriptionsByPatient } from "@/actions/prescriptions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Phone, Upload, FileText, Star } from "lucide-react";
import { formatDate, formatDistanceToNow } from "@/utils/date";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PatientDetailPage({ params }: Props) {
  const { id } = await params;
  const [patient, prescriptions] = await Promise.all([
    getPatientById(id),
    getPrescriptionsByPatient(id),
  ]);

  if (!patient) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link href="/patients" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Patients
      </Link>

      {/* Patient Info */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
              <User className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{patient.name}</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {patient.age} years old • <span className="capitalize">{patient.gender}</span>
              </p>
              <p className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                <Phone className="h-3.5 w-3.5" />
                {patient.phone}
              </p>
            </div>
          </div>
          <Link
            href={`/upload?patientId=${patient.id}`}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload Prescription
          </Link>
        </div>
      </div>

      {/* Prescription History */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Prescription History ({prescriptions.length})
        </h2>

        {prescriptions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No prescriptions yet.</p>
            <Link
              href={`/upload?patientId=${patient.id}`}
              className="mt-2 inline-block text-sm text-blue-600 hover:underline"
            >
              Upload the first prescription →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {prescriptions.map((rx) => (
              <Link
                key={rx.id}
                href={`/prescriptions/${rx.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {rx.important && (
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      )}
                      <p className="text-xs text-slate-400">{formatDate(new Date(rx.createdAt))}</p>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2">
                      {rx.aiSummary ?? rx.correctedText}
                    </p>
                    {rx.tags && rx.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {rx.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {rx.imageUrl && (
                    <img
                      src={rx.imageUrl}
                      alt="Prescription"
                      className="h-16 w-16 rounded-lg object-cover ml-4 border border-slate-200"
                    />
                  )}
                </div>
                {rx.medicinesJson && rx.medicinesJson.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                    {rx.medicinesJson.slice(0, 3).map((med, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
                      >
                        💊 {med.name}
                      </span>
                    ))}
                    {rx.medicinesJson.length > 3 && (
                      <span className="text-xs text-slate-400">+{rx.medicinesJson.length - 3} more</span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
