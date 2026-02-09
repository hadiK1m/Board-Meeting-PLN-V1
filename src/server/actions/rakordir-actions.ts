"use server";

import { db } from "@/lib/db";
import { agendas, agendasRakordir } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";

type ActionState = {
    success: boolean;
    message?: string;
    error?: string;
};

// --- 1. CREATE ACTION ---
export async function createRakordirAction(formData: FormData): Promise<ActionState> {
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

        // Child Data
        const deadline = formData.get("deadline") as string;
        const support = formData.get("support") as string;

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
                    meetingType: "RAKORDIR", // ✅ Tipe Rapat RAKORDIR
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

            // 2. Insert Child (Gunakan tabel agendasRakordir)
            await tx.insert(agendasRakordir).values({
                agendaId: newAgenda.id,
                urgency: urgencyInput,
                deadlineDate: deadline, // Simpan sebagai Deadline
                executionDate: null,    // Tanggal Pelaksanaan masih kosong
                support: support || null,

                // ✅ Hanya simpan file yang relevan untuk RAKORDIR
                proposalNote: uploadedFiles.proposalNote || null,
                presentationMaterial: uploadedFiles.presentationMaterial || null,

                supportingDocuments: uploadedSupporting,
            });
        });

        revalidatePath("/dashboard/agenda/rakordir");
        return { success: true, message: "Agenda RAKORDIR berhasil disimpan." };

    } catch (error) {
        console.error("❌ Error createRakordirAction:", error);
        return { success: false, error: "Terjadi kesalahan sistem saat menyimpan data." };
    }
}

// --- 2. GET DATA BY ID ---
export async function getRakordirById(id: string) {
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
                notes: agendas.notes,
                urgency: agendasRakordir.urgency,
                executionDate: agendasRakordir.executionDate,
                deadlineDate: agendasRakordir.deadlineDate,
                support: agendasRakordir.support,

                // ✅ Hanya ambil file relevan
                filePaths: sql`json_build_object(
                  'proposalNote', ${agendasRakordir.proposalNote},
                  'presentationMaterial', ${agendasRakordir.presentationMaterial}
                )`,
                supportingFiles: agendasRakordir.supportingDocuments
            })
            .from(agendas)
            .innerJoin(agendasRakordir, eq(agendas.id, agendasRakordir.agendaId))
            .where(eq(agendas.id, id))
            .limit(1);

        return result[0] || null;
    } catch (error) {
        console.error("❌ Error getRakordirById:", error);
        return null;
    }
}

// --- 3. UPDATE ACTION ---
export async function updateRakordirAction(id: string, formData: FormData): Promise<ActionState> {
    try {
        const title = formData.get("title") as string;
        const status = formData.get("status") as string;
        const director = formData.get("director") as string;
        const initiator = formData.get("initiator") as string;
        const contactPerson = formData.get("contactPerson") as string;
        const position = formData.get("position") as string;
        const phone = formData.get("phone") as string;
        const deadline = formData.get("deadline") as string;
        const support = formData.get("support") as string;
        const urgencyInput = formData.get("urgencyDesc") as string || formData.get("urgency") as string;

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
                .update(agendasRakordir)
                .set({
                    urgency: urgencyInput,
                    support,
                    deadlineDate: deadline, // Update Deadline saja
                    // ✅ Update hanya file relevan
                    proposalNote: finalFilePaths.proposalNote || null,
                    presentationMaterial: finalFilePaths.presentationMaterial || null,
                    supportingDocuments: finalSupporting,
                })
                .where(eq(agendasRakordir.agendaId, id));
        });

        revalidatePath("/dashboard/agenda/rakordir");
        return { success: true, message: "Agenda RAKORDIR berhasil diperbarui." };

    } catch (error) {
        console.error("❌ Error updateRakordirAction:", error);
        return { success: false, error: "Gagal memperbarui data." };
    }
}
