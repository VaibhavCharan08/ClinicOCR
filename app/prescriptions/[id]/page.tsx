import { getPrescriptionById } from "@/actions/prescriptions";
import { notFound } from "next/navigation";
import { PrescriptionDetailClient } from "./PrescriptionDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PrescriptionDetailPage({ params }: Props) {
  const { id } = await params;
  const prescription = await getPrescriptionById(id);
  if (!prescription) notFound();

  return <PrescriptionDetailClient prescription={prescription} />;
}
