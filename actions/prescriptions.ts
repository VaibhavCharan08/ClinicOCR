"use server";

import { db } from "@/db";
import { prescriptions, patients } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ActionResult, Medicine, Prescription, PrescriptionWithPatient } from "@/types";

export interface CreatePrescriptionInput {
  patientId: string;
  imageUrl: string;
  rawOcr: string;
  correctedText: string;
  aiSummary?: string;
  medicinesJson?: Medicine[];
  doctorNotes?: string;
  tags?: string[];
  important?: boolean;
}

export async function createPrescription(
  input: CreatePrescriptionInput
): Promise<ActionResult<Prescription>> {
  try {
    const [prescription] = await db
      .insert(prescriptions)
      .values({
        patientId: input.patientId,
        imageUrl: input.imageUrl,
        rawOcr: input.rawOcr,
        correctedText: input.correctedText,
        aiSummary: input.aiSummary,
        medicinesJson: input.medicinesJson,
        doctorNotes: input.doctorNotes,
        tags: input.tags,
        important: input.important ?? false,
      })
      .returning();
    revalidatePath(`/patients/${input.patientId}`);
    revalidatePath("/dashboard");
    return { success: true, data: prescription as Prescription };
  } catch (error) {
    console.error("createPrescription error:", error);
    return { success: false, error: "Failed to save prescription" };
  }
}

export async function getPrescriptionsByPatient(patientId: string): Promise<Prescription[]> {
  try {
    const result = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.patientId, patientId))
      .orderBy(desc(prescriptions.important), desc(prescriptions.createdAt));
    return result as Prescription[];
  } catch (error) {
    console.error("getPrescriptionsByPatient error:", error);
    return [];
  }
}

export async function getPrescriptionById(id: string): Promise<PrescriptionWithPatient | null> {
  try {
    const result = await db
      .select()
      .from(prescriptions)
      .leftJoin(patients, eq(prescriptions.patientId, patients.id))
      .where(eq(prescriptions.id, id));

    if (!result[0]) return null;

    const row = result[0];
    return {
      ...(row.prescriptions as Prescription),
      patient: row.patients as any,
    };
  } catch (error) {
    console.error("getPrescriptionById error:", error);
    return null;
  }
}

export async function deletePrescription(id: string, patientId: string): Promise<ActionResult> {
  try {
    await db.delete(prescriptions).where(eq(prescriptions.id, id));
    revalidatePath(`/patients/${patientId}`);
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("deletePrescription error:", error);
    return { success: false, error: "Failed to delete prescription" };
  }
}

export async function toggleImportant(id: string, current: boolean): Promise<ActionResult> {
  try {
    await db
      .update(prescriptions)
      .set({ important: !current })
      .where(eq(prescriptions.id, id));
    revalidatePath("/prescriptions/" + id);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("toggleImportant error:", error);
    return { success: false, error: "Failed to update prescription" };
  }
}

export async function getDashboardStats() {
  try {
    const [patientCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(patients);
    const [prescriptionCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(prescriptions);
    const recentPrescriptions = await db
      .select()
      .from(prescriptions)
      .leftJoin(patients, eq(prescriptions.patientId, patients.id))
      .orderBy(desc(prescriptions.createdAt))
      .limit(5);

    return {
      totalPatients: Number(patientCount?.count ?? 0),
      totalPrescriptions: Number(prescriptionCount?.count ?? 0),
      recentPrescriptions: recentPrescriptions.map((r) => ({
        ...(r.prescriptions as Prescription),
        patient: r.patients,
      })),
    };
  } catch (error) {
    console.error("getDashboardStats error:", error);
    return { totalPatients: 0, totalPrescriptions: 0, recentPrescriptions: [] };
  }
}

