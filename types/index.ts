export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  createdAt: Date;
}

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  imageUrl: string;
  rawOcr: string;
  correctedText: string;
  aiSummary: string | null;
  medicinesJson: Medicine[] | null;
  doctorNotes: string | null;
  tags: string[] | null;
  important: boolean;
  createdAt: Date;
}

export interface PrescriptionWithPatient extends Prescription {
  patient: Patient;
}

export interface GeminiResponse {
  corrected_text: string;
  summary: string;
  medicines: Medicine[];
  important_findings: string[];
  tags: string[];
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
