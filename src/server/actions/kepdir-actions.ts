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
export async function createKepdirAction(formData: FormData): Promise<ActionState> {
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

        // File Data
        const uploadedFilesRaw = formData.get("uploadedFiles") as string;
        const uploadedFiles = uploadedFilesRaw ? JSON.parse(uploadedFilesRaw) : {};

        const uploadedSupportingRaw = formData.get("uploadedSupporting") as string;
        const uploadedSupporting = uploadedSupportingRaw ? JSON.parse(uploadedSupportingRaw) : [];

        if (!title) {
            return { success: false, error: "Judul Agenda wajib diisi." };
        }

        await db.transaction(async (tx) => {
            // 1. Insert Parent
            const [newAgenda] = await tx
                .insert(agendas)
                .values({
                    title,
                    meetingType: "KEPDIR_SIRKULER", // ✅ Tipe Khusus
                    status: status || "Draft",
                    director,
                    initiator,
                    contactPerson: contactPerson || null,
                    position: position || null,
                    phone: phone || null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning({ id: agendas.id });

            if (!newAgenda) throw new Error("Gagal membuat agenda baru.");

            // 2. Insert Child
            await tx.insert(agendasRadir).values({
                agendaId: newAgenda.id,
                // Mapping File Khusus Kepdir
                proposalNote: uploadedFiles.kepdirFile || null, // Dokumen Kepdir
                riskReview: uploadedFiles.grcFile || null,      // Dokumen GRC

                supportingDocuments: uploadedSupporting,
            });
        });

        revalidatePath("/dashboard/agenda/kepdir-sirkuler");
        return { success: true, message: "Agenda Kepdir Sirkuler berhasil disimpan." };

    } catch (error) {
        console.error("❌ Error createKepdirAction:", error);
        return { success: false, error: "Terjadi kesalahan sistem saat menyimpan data." };
    }
}

// --- 2. GET DATA BY ID ---
export async function getKepdirById(id: string) {
    try {
        const result = await db
            .select({
                id: agendas.id,
                title: agendas.title,
                status: agendas.status,
                director: agendas.director,
                initiator: agendas.initiator,
                contactPerson: agendas.contactPerson,
                position: agendas.position,
                phone: agendas.phone,
                createdAt: agendas.createdAt,

                // ✅ Ambil file relevan
                filePaths: sql`json_build_object(
                  'kepdirFile', ${agendasRadir.proposalNote},
                  'grcFile', ${agendasRadir.riskReview}
                )`,
                supportingFiles: agendasRadir.supportingDocuments
            })
            .from(agendas)
            .innerJoin(agendasRadir, eq(agendas.id, agendasRadir.agendaId))
            .where(eq(agendas.id, id))
            .limit(1);

        return result[0] || null;
    } catch (error) {
        console.error("❌ Error getKepdirById:", error);
        return null;
    }
}

// --- 3. UPDATE ACTION ---
export async function updateKepdirAction(id: string, formData: FormData): Promise<ActionState> {
    try {
        const title = formData.get("title") as string;
        const status = formData.get("status") as string;
        const director = formData.get("director") as string;
        const initiator = formData.get("initiator") as string;
        const contactPerson = formData.get("contactPerson") as string;
        const position = formData.get("position") as string;
        const phone = formData.get("phone") as string;

        const finalFilePathsRaw = formData.get("finalFilePaths") as string;
        const finalFilePaths = finalFilePathsRaw ? JSON.parse(finalFilePathsRaw) : {};
        const finalSupportingRaw = formData.get("finalSupportingFiles") as string;
        const finalSupporting = finalSupportingRaw ? JSON.parse(finalSupportingRaw) : [];

        await db.transaction(async (tx) => {
            await tx
                .update(agendas)
                .set({
                    title, status, director, initiator,
                    contactPerson, position, phone,
                    updatedAt: new Date(),
                })
                .where(eq(agendas.id, id));

            await tx
                .update(agendasRadir)
                .set({
                    // ✅ Update file relevan
                    proposalNote: finalFilePaths.kepdirFile || null,
                    riskReview: finalFilePaths.grcFile || null,
                    supportingDocuments: finalSupporting,
                })
                .where(eq(agendasRadir.agendaId, id));
        });

        revalidatePath("/dashboard/agenda/kepdir-sirkuler");
        return { success: true, message: "Agenda berhasil diperbarui." };

    } catch (error) {
        console.error("❌ Error updateKepdirAction:", error);
        return { success: false, error: "Gagal memperbarui data." };
    }
}
