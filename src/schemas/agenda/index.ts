// ZOD: Schema Validations

import { z } from "zod";

// --- ENUMS / CONSTANTS ---
export const meetingTypes = ["RADIR", "RAKORDIR", "KEPDIR_SIRKULER"] as const;
export const agendaStatuses = ["Draft", "Dapat Dilanjutkan", "Dijadwalkan", "Ditunda", "Dibatalkan", "Selesai"] as const;
export const priorities = ["High", "Medium", "Low"] as const;
export const urgencies = ["Normal", "High", "Critical"] as const;

// --- 1. BASE SCHEMA (Data Umum Agenda) ---
// Field yang ada di tabel 'agendas'
const baseAgendaSchema = z.object({
    title: z.string().min(5, { message: "Judul agenda minimal 5 karakter." }),
    meetingType: z.enum(meetingTypes).default("RADIR"),

    // Informasi Inisiator (Optional di awal, tapi kita validasi formatnya)
    director: z.string().optional(),
    initiator: z.string().min(2, { message: "Nama inisiator wajib diisi." }).optional().or(z.literal("")),
    contactPerson: z.string().optional(),
    position: z.string().optional(),
    phone: z.string().regex(/^([0-9]*)?$/, "Nomor telepon harus berupa angka.").optional(),
});

// --- 2. RADIR SCHEMA (Gabungan Base + Data Spesifik RADIR) ---
// Field gabungan untuk Form Create/Edit Agenda RADIR
export const agendaRadirSchema = baseAgendaSchema.extend({
    // --- Data Spesifik RADIR (tabel 'agendas_radir') ---

    // Klasifikasi
    urgency: z.enum(urgencies).default("Normal"),
    support: z.string().optional(), // Dukungan yang diperlukan

    // Logistik Rapat
    // Menggunakan z.date() karena component Calendar Shadcn mengembalikan Date object
    executionDate: z.date().optional().nullable(),

    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format waktu harus HH:MM").optional().or(z.literal("")),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format waktu harus HH:MM").optional().or(z.literal("")),

    meetingLocation: z.string().max(100, "Lokasi maksimal 100 karakter.").optional(),
    meetingLink: z.string().url("Link meeting tidak valid (harus https://...)").optional().or(z.literal("")), // Boleh kosong, tapi kalau isi harus URL

    // Review & Catatan (Optional Text Area)
    legalReview: z.string().optional(),
    riskReview: z.string().optional(),
    complianceReview: z.string().optional(),
    regulationReview: z.string().optional(),
    recommendationNote: z.string().optional(),
    proposalNote: z.string().optional(),

    // Dokumen Pendukung (Biasanya array of objects/strings, disederhanakan dulu)
    // Nanti bisa dikembangkan jika ada upload file
    supportingDocuments: z.array(z.string()).default([]),
});

// --- TYPE INFERENCE ---
// Tipe data TypeScript otomatis yang dihasilkan dari Schema Zod
export type AgendaRadirFormValues = z.infer<typeof agendaRadirSchema>;

// --- DEFAULT VALUES ---
// Nilai default untuk form agar React Hook Form tidak error uncontrolled input
export const defaultRadirValues: Partial<AgendaRadirFormValues> = {
    title: "",
    meetingType: "RADIR",
    urgency: "Normal",
    director: "",
    initiator: "",
    meetingLocation: "Ruang Rapat Direksi Lt. 3",
    meetingLink: "",
};