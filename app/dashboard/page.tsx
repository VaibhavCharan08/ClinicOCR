import { getDashboardStats } from "@/actions/prescriptions";
import { getPatients } from "@/actions/patients";
import Link from "next/link";
import { Users, FileText, Upload, Plus, Clock } from "lucide-react";
import { formatDistanceToNow } from "@/utils/date";

export default async function DashboardPage() {
  const [stats] = await Promise.all([getDashboardStats()]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome to ClinicOCR — your prescription digitization platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={<Users className="h-6 w-6 text-blue-600" />}
          color="blue"
        />
        <StatCard
          title="Total Prescriptions"
          value={stats.totalPrescriptions}
          icon={<FileText className="h-6 w-6 text-emerald-600" />}
          color="emerald"
        />
        <StatCard
          title="Recent Uploads"
          value={stats.recentPrescriptions.length}
          icon={<Clock className="h-6 w-6 text-violet-600" />}
          color="violet"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/upload"
          className="flex items-center gap-4 rounded-xl border border-blue-200 bg-blue-50 p-5 hover:bg-blue-100 transition-colors group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
            <Upload className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-blue-900">Upload Prescription</p>
            <p className="text-sm text-blue-700">Digitize a handwritten prescription instantly</p>
          </div>
        </Link>
        <Link
          href="/patients"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 hover:bg-slate-50 transition-colors group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800 shadow-sm">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Add / View Patients</p>
            <p className="text-sm text-slate-500">Manage your patient records</p>
          </div>
        </Link>
      </div>

      {/* Recent Uploads */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Uploads</h2>
        {stats.recentPrescriptions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No prescriptions uploaded yet.</p>
            <Link href="/upload" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
              Upload your first prescription →
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left font-medium text-slate-500 px-4 py-3">Patient</th>
                  <th className="text-left font-medium text-slate-500 px-4 py-3">Summary</th>
                  <th className="text-left font-medium text-slate-500 px-4 py-3">Uploaded</th>
                  <th className="text-left font-medium text-slate-500 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPrescriptions.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {p.patient?.name ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                      {p.aiSummary ?? "No summary"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDistanceToNow(new Date(p.createdAt))}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/prescriptions/${p.id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "emerald" | "violet";
}) {
  const bg = {
    blue: "bg-blue-50 border-blue-200",
    emerald: "bg-emerald-50 border-emerald-200",
    violet: "bg-violet-50 border-violet-200",
  }[color];

  return (
    <div className={`rounded-xl border p-6 ${bg}`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        {icon}
      </div>
      <p className="text-3xl font-bold text-slate-900">{value.toLocaleString()}</p>
    </div>
  );
}
