"use server";

import { db } from "@/lib/db";
import { agendas, agendasRadir } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";

type ActionState = {
    success: boolean;
    message?: string;
    error?: string;
};

// --- 1. CREATE ACTION ---
export async function createRadirAction(formData: FormData): Promise<ActionState> {
    try {
        // Parent Data
        const title = formData.get("title") as string;
        const status = formData.get("status") as string;
        const director = formData.get("director") as string;
        const initiator = formData.get("initiator") as string;

        // Narahubung
        const contactPerson = formData.get("contactPerson") as string;
        const position = formData.get("position") as string;
        const phone = formData.get("phone") as string;
        const notes = formData.get("notes") as string;

        // Child Data
        const deadline = formData.get("deadline") as string;
        const support = formData.get("support") as string;

        // ✅ SOLUSI FINAL: MENANGKAP URGENSI DARI DUA KEMUNGKINAN
        // 1. Coba ambil "urgencyDesc" (Logic manual append di frontend)
        // 2. Jika kosong, ambil "urgency" (Bawaan tag <textarea name="urgency">)
        const urgencyInput = formData.get("urgencyDesc") as string || formData.get("urgency") as string;

        // File Data
        const uploadedFilesRaw = formData.get("uploadedFiles") as string;
        const uploadedFiles = uploadedFilesRaw ? JSON.parse(uploadedFilesRaw) : {};

        const uploadedSupportingRaw = formData.get("uploadedSupporting") as string;
        const uploadedSupporting = uploadedSupportingRaw ? JSON.parse(uploadedSupportingRaw) : [];

        if (!title || !deadline) {
            return { success: false, error: "Judul dan Deadline wajib diisi." };
        }

        await db.transaction(async (tx) => {
            // 1. Insert Parent
            const [newAgenda] = await tx
                .insert(agendas)
                .values({
                    title,
                    meetingType: "RADIR",
                    status: status || "Draft",
                    director,
                    initiator,
                    contactPerson: contactPerson || null,
                    position: position || null,
                    phone: phone || null,
                    notes: notes || null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning({ id: agendas.id });

            if (!newAgenda) throw new Error("Gagal membuat agenda baru.");

            // 2. Insert Child
            await tx.insert(agendasRadir).values({
                agendaId: newAgenda.id,

                // ✅ SIMPAN HASIL TANGKAPAN DI ATAS KE SINI
                urgency: urgencyInput,

                deadlineDate: deadline, // Simpan sebagai Deadline
                executionDate: null,    // Tanggal Pelaksanaan masih kosong
                support: support || null,

                // Files...
                legalReview: uploadedFiles.legalReview || null,
                riskReview: uploadedFiles.riskReview || null,
                complianceReview: uploadedFiles.complianceReview || null,
                regulationReview: uploadedFiles.regulationReview || null,
                recommendationNote: uploadedFiles.recommendationNote || null,
                proposalNote: uploadedFiles.proposalNote || null,
                presentationMaterial: uploadedFiles.presentationMaterial || null,
                supportingDocuments: uploadedSupporting,
            });
        });

        revalidatePath("/dashboard/agenda/radir");
        return { success: true, message: "Agenda berhasil disimpan." };

    } catch (error) {
        console.error("❌ Error createRadirAction:", error);
        return { success: false, error: "Terjadi kesalahan sistem saat menyimpan data." };
    }
}

// --- 2. GET DATA BY ID ---
export async function getAgendaById(id: string) {
    try {
        const result = await db
            .select({
                // Parent
                id: agendas.id,
                title: agendas.title,
                status: agendas.status,
                director: agendas.director,
                initiator: agendas.initiator,
                contactPerson: agendas.contactPerson,
                position: agendas.position,
                phone: agendas.phone,
                notes: agendas.notes, // ✅ Tambahkan ini agar data catatan terambil

                // Child
                urgency: agendasRadir.urgency, // Ini akan berisi Teks Panjang
                executionDate: agendasRadir.executionDate,
                deadlineDate: agendasRadir.deadlineDate,
                meetingNumber: agendasRadir.meetingNumber,
                support: agendasRadir.support,

                filePaths: sql`json_build_object(
          'legalReview', ${agendasRadir.legalReview},
          'riskReview', ${agendasRadir.riskReview},
          'complianceReview', ${agendasRadir.complianceReview},
          'regulationReview', ${agendasRadir.regulationReview},
          'recommendationNote', ${agendasRadir.recommendationNote},
          'proposalNote', ${agendasRadir.proposalNote},
          'presentationMaterial', ${agendasRadir.presentationMaterial}
        )`,
                supportingFiles: agendasRadir.supportingDocuments
            })
            .from(agendas)
            .innerJoin(agendasRadir, eq(agendas.id, agendasRadir.agendaId))
            .where(eq(agendas.id, id))
            .limit(1);

        return result[0] || null;
    } catch (error) {
        console.error("❌ Error getAgendaById:", error);
        return null;
    }
}

// --- 3. UPDATE ACTION ---
export async function updateRadirAction(id: string, formData: FormData): Promise<ActionState> {
    try {
        // Parent
        const title = formData.get("title") as string;
        const status = formData.get("status") as string;
        const director = formData.get("director") as string;
        const initiator = formData.get("initiator") as string;
        const contactPerson = formData.get("contactPerson") as string;
        const position = formData.get("position") as string;
        const phone = formData.get("phone") as string;
        const notes = formData.get("notes") as string;

        // Child
        const deadline = formData.get("deadline") as string;
        const support = formData.get("support") as string;

        // ✅ UPDATE JUGA MENGGUNAKAN LOGIC YANG SAMA
        const urgencyInput = formData.get("urgencyDesc") as string || formData.get("urgency") as string;

        // Files
        const finalFilePathsRaw = formData.get("finalFilePaths") as string;
        const finalFilePaths = finalFilePathsRaw ? JSON.parse(finalFilePathsRaw) : {};
        const finalSupportingRaw = formData.get("finalSupportingFiles") as string;
        const finalSupporting = finalSupportingRaw ? JSON.parse(finalSupportingRaw) : [];

        await db.transaction(async (tx) => {
            await tx
                .update(agendas)
                .set({
                    title, status, director, initiator,
                    contactPerson, position, phone, notes,
                    updatedAt: new Date(),
                })
                .where(eq(agendas.id, id));

            await tx
                .update(agendasRadir)
                .set({
                    urgency: urgencyInput, // Simpan di sini
                    support,
                    deadlineDate: deadline, // Update Deadline saja
                    legalReview: finalFilePaths.legalReview || null,
                    riskReview: finalFilePaths.riskReview || null,
                    complianceReview: finalFilePaths.complianceReview || null,
                    regulationReview: finalFilePaths.regulationReview || null,
                    recommendationNote: finalFilePaths.recommendationNote || null,
                    proposalNote: finalFilePaths.proposalNote || null,
                    presentationMaterial: finalFilePaths.presentationMaterial || null,
                    supportingDocuments: finalSupporting,
                })
                .where(eq(agendasRadir.agendaId, id));
        });

        revalidatePath("/dashboard/agenda/radir");
        return { success: true, message: "Agenda berhasil diperbarui." };

    } catch (error) {
        console.error("❌ Error updateRadirAction:", error);
        return { success: false, error: "Gagal memperbarui data." };
    }
}