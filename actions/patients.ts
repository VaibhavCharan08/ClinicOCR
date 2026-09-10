"use server";

import { db } from "@/db";
import { patients } from "@/db/schema";
import { eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult, Patient } from "@/types";

const PatientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().int().min(0).max(150),
  gender: z.enum(["male", "female", "other"]),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15),
});

export async function createPatient(
  formData: z.infer<typeof PatientSchema>
): Promise<ActionResult<Patient>> {
  try {
    const validated = PatientSchema.parse(formData);
    const [patient] = await db
      .insert(patients)
      .values(validated)
      .returning();
    revalidatePath("/patients");
    revalidatePath("/dashboard");
    return { success: true, data: patient as Patient };
  } catch (error) {
    console.error("createPatient error:", error);
    return { success: false, error: "Failed to create patient" };
  }
}

export async function updatePatient(
  id: string,
  formData: z.infer<typeof PatientSchema>
): Promise<ActionResult<Patient>> {
  try {
    const validated = PatientSchema.parse(formData);
    const [patient] = await db
      .update(patients)
      .set(validated)
      .where(eq(patients.id, id))
      .returning();
    revalidatePath("/patients");
    revalidatePath(`/patients/${id}`);
    return { success: true, data: patient as Patient };
  } catch (error) {
    console.error("updatePatient error:", error);
    return { success: false, error: "Failed to update patient" };
  }
}

export async function deletePatient(id: string): Promise<ActionResult> {
  try {
    await db.delete(patients).where(eq(patients.id, id));
    revalidatePath("/patients");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("deletePatient error:", error);
    return { success: false, error: "Failed to delete patient" };
  }
}

export async function getPatients(): Promise<Patient[]> {
  try {
    const result = await db.select().from(patients).orderBy(patients.createdAt);
    return result as Patient[];
  } catch (error) {
    console.error("getPatients error:", error);
    return [];
  }
}

export async function getPatientById(id: string): Promise<Patient | null> {
  try {
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, id));
    return patient as Patient ?? null;
  } catch (error) {
    console.error("getPatientById error:", error);
    return null;
  }
}

export async function searchPatients(query: string): Promise<Patient[]> {
  try {
    const result = await db
      .select()
      .from(patients)
      .where(
        or(
          ilike(patients.name, `%${query}%`),
          ilike(patients.phone, `%${query}%`)
        )
      )
      .orderBy(patients.name);
    return result as Patient[];
  } catch (error) {
    console.error("searchPatients error:", error);
    return [];
  }
}
