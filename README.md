# 🩺 ClinicOCR — Medical Document Intelligence Platform

> **Convert handwritten prescriptions into structured, searchable digital medical records using Native Tesseract OCR and Google Gemini AI.**

[![Next.js](https://img.shields.io/badge/Next.js-15.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=flat&logo=drizzle)](https://orm.drizzle.team/)
[![Neon PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=flat&logo=postgresql)](https://neon.tech/)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini_Flash-8E75B2?style=flat&logo=google)](https://ai.google.dev/)
[![Tesseract OCR](https://img.shields.io/badge/OCR-Tesseract_5-brightgreen)](https://github.com/tesseract-ocr/tesseract)

---

## 📖 Overview

Small clinics and independent practitioners still rely heavily on paper-based handwritten prescriptions. Common challenges include:
- **Illegible handwriting** leading to dosage confusion
- **Misplaced paper records** and lost medical history
- **Time-consuming manual data entry** into complex EMR systems
- **Lack of fast searchability** during follow-up consultations

**ClinicOCR** serves as a lightweight, doctor-centric AI assistant. It captures prescription photos, extracts text using local Tesseract OCR, leverages Google Gemini Flash to structure medications, dosages, and clinical findings, and gives doctors **100% editing authority** before storing records securely in PostgreSQL.

---

## ⚡ Key Features

- 📸 **Smart Prescription Capture**: Drag-and-drop or upload JPG/PNG/WebP prescriptions with automatic client-side compression.
- ⚡ **Ultra-Fast Native OCR**: Integrates native Tesseract C++ engine with local binary execution (< 300ms processing).
- 🧠 **Gemini Multimodal Intelligence**: Corrects OCR typos, parses drug names, dosages, frequencies (e.g. `1-0-1`, `OD`, `BD`), and diagnoses without hallucinating.
- 👨‍⚕️ **Doctor-in-the-Loop Review**: Doctors can edit, add, or remove medications and notes before anything is saved.
- 📂 **Searchable Patient Archive**: Patient-wise digital history, tag filtering, and one-click important record bookmarking.
- 🛡️ **Zero Data Leakage**: Sensitive credentials, local model binaries, and environment variables are strictly safeguarded.

---

## 🏗️ System Architecture & Pipeline

```
  Doctor / Receptionist
           │
           ▼
  [ Upload Prescription Image ]
           │
           ├──────────────────────────────┐
           ▼                              ▼
  [ Image Preprocessing ]        [ Client-side Compression ]
           │
           ▼
  [ Tesseract 5 Native OCR ]
           │
           ▼ (Raw Text Stream)
  [ Google Gemini 3.6 Flash ] ◄──── [ Prescription Image ]
           │
           ▼
  [ Structured Clinical JSON ]
     • Corrected Text
     • Medicines (Name, Dosage, Frequency)
     • Important Findings & Diagnoses
     • Clinical Tags
           │
           ▼
  [ Doctor Review & Verification ]
           │
           ▼
  [ Neon Serverless PostgreSQL (Drizzle ORM) ]
           │
           ▼
  [ Patient Prescription Timeline ]
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | [Next.js 15 (App Router)](https://nextjs.org), React 19, TypeScript, [Tailwind CSS v4](https://tailwindcss.com) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com), Lucide React Icons, [Sonner Toasts](https://sonner.emilkowal.ski) |
| **Forms & Validation** | React Hook Form, [Zod](https://zod.dev) |
| **Database** | [Neon Serverless PostgreSQL](https://neon.tech), [Drizzle ORM](https://orm.drizzle.team) |
| **OCR Engine** | Native [Tesseract OCR 5](https://github.com/tesseract-ocr/tesseract) + Fallback wrapper |
| **AI Intelligence** | Google Gemini 3.6 Flash (`@google/genai`) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher
- **Package Manager**: `npm` (or `pnpm` / `bun`)
- **Tesseract OCR** (optional, recommended for native speed):
  - macOS: `brew install tesseract`
  - Linux: `sudo apt install tesseract-ocr`
  - Windows: `winget install UB-Mannheim.TesseractOCR`

### 1. Clone the Repository
```bash
git clone https://github.com/VaibhavCharan08/ClinicOCR.git
cd ClinicOCR
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:
```env
# Neon PostgreSQL Connection String
DATABASE_URL=postgresql://user:password@ep-xyz.aws.neon.tech/neondb?sslmode=require

# Google AI Studio API Key
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Push Database Schema
Initialize tables in your Neon PostgreSQL database:
```bash
npm run db:push
```

### 5. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
ClinicOCR/
├── actions/                   # Server Actions (Mutations & Queries)
│   ├── patients.ts            # Patient CRUD operations
│   └── prescriptions.ts       # Prescription save, toggle important, stats
├── app/                       # Next.js App Router
│   ├── api/
│   │   ├── ai/route.ts        # Gemini AI structuring endpoint
│   │   └── ocr/route.ts       # Native Tesseract OCR endpoint
│   ├── dashboard/page.tsx     # Clinic stats, recent records
│   ├── patients/              # Patient list, search, patient details
│   ├── prescriptions/         # Detailed view, medicine breakdown
│   ├── upload/                # Multi-step upload & review wizard
│   ├── layout.tsx             # Root layout with navigation
│   └── page.tsx               # Redirect to dashboard
├── components/                # Modular UI Components
│   ├── forms/                 # PatientForm (React Hook Form + Zod)
│   ├── prescription/          # ReviewForm, MedicineList
│   ├── ui/                    # shadcn/ui primitives
│   └── upload/                # UploadZone, ProcessingSteps
├── db/                        # Database Layer
│   ├── schema.ts              # Drizzle ORM schema (patients, prescriptions)
│   └── index.ts               # Neon serverless connection pool
├── lib/
│   └── ocr/
│       ├── gemini.ts          # Gemini Flash medical prompt & parser
│       └── tesseract.ts       # Native Tesseract binary execution
├── types/                     # TypeScript definitions & schemas
└── utils/                     # Utility functions (date, cn)
```

---

## 🔒 Security & Privacy

- **No Medical Data Training**: Gemini API configuration uses isolated inferences.
- **Protected Credentials**: `.env*` files, authentication keys, and local binaries are strictly ignored via `.gitignore`.
- **Doctor Authority**: AI never auto-commits prescriptions; doctor review and sign-off are required.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Developed with ❤️ for Modern Healthcare Clinics.**
