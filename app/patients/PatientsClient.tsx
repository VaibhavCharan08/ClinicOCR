"use client";

import { useState, useTransition } from "react";
import { PatientForm } from "@/components/forms/PatientForm";
import { deletePatient, searchPatients } from "@/actions/patients";
import type { Patient } from "@/types";
import { Users, Plus, Search, Pencil, Trash2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatDate } from "@/utils/date";

export function PatientsClient({ initialPatients }: { initialPatients: Patient[] }) {
  const [patients, setPatients] = useState(initialPatients);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setPatients(initialPatients);
      return;
    }
    startTransition(async () => {
      const results = await searchPatients(value);
      setPatients(results);
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete patient "${name}"? This will also delete all their prescriptions.`)) return;
    startTransition(async () => {
      const result = await deletePatient(id);
      if (result.success) {
        setPatients((prev) => prev.filter((p) => p.id !== id));
        toast.success("Patient deleted");
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleSuccess = (patient: Patient) => {
    if (editPatient) {
      setPatients((prev) => prev.map((p) => (p.id === patient.id ? patient : p)));
      setEditPatient(null);
    } else {
      setPatients((prev) => [patient, ...prev]);
      setShowForm(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-slate-500 mt-1">{patients.length} patient{patients.length !== 1 ? "s" : ""} registered</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditPatient(null); }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Patient
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showForm || editPatient) && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/50 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            {editPatient ? `Edit Patient — ${editPatient.name}` : "Add New Patient"}
          </h2>
          <PatientForm
            patient={editPatient ?? undefined}
            onSuccess={handleSuccess}
            onCancel={() => { setShowForm(false); setEditPatient(null); }}
          />
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Patient List */}
      {patients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No patients found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left font-medium text-slate-500 px-4 py-3">Name</th>
                <th className="text-left font-medium text-slate-500 px-4 py-3">Age</th>
                <th className="text-left font-medium text-slate-500 px-4 py-3">Gender</th>
                <th className="text-left font-medium text-slate-500 px-4 py-3">Phone</th>
                <th className="text-left font-medium text-slate-500 px-4 py-3">Registered</th>
                <th className="text-left font-medium text-slate-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link href={`/patients/${patient.id}`} className="hover:text-blue-600 flex items-center gap-1">
                      {patient.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{patient.age}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{patient.gender}</td>
                  <td className="px-4 py-3 text-slate-600">{patient.phone}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(new Date(patient.createdAt))}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditPatient(patient); setShowForm(false); }}
                        className="rounded p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(patient.id, patient.name)}
                        className="rounded p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/patients/${patient.id}`}
                        className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
