import { pgTable, uuid, text, integer, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { Medicine } from "@/types";

export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prescriptions = pgTable("prescriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .references(() => patients.id, { onDelete: "cascade" })
    .notNull(),
  imageUrl: text("image_url").notNull(),
  rawOcr: text("raw_ocr").notNull(),
  correctedText: text("corrected_text").notNull(),
  aiSummary: text("ai_summary"),
  medicinesJson: json("medicines_json").$type<Medicine[]>(),
  doctorNotes: text("doctor_notes"),
  tags: json("tags").$type<string[]>(),
  important: boolean("important").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const patientsRelations = relations(patients, ({ many }) => ({
  prescriptions: many(prescriptions),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  patient: one(patients, {
    fields: [prescriptions.patientId],
    references: [patients.id],
  }),
}));
