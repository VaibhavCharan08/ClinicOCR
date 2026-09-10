import { getPatients } from "@/actions/patients";
import { UploadClient } from "./UploadClient";

interface Props {
  searchParams: Promise<{ patientId?: string }>;
}

export default async function UploadPage({ searchParams }: Props) {
  const { patientId } = await searchParams;
  const patients = await getPatients();

  return <UploadClient patients={patients} defaultPatientId={patientId} />;
}
