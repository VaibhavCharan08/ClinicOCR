import { getPatients } from "@/actions/patients";
import { PatientsClient } from "./PatientsClient";

export default async function PatientsPage() {
  const patients = await getPatients();
  return <PatientsClient initialPatients={patients} />;
}
