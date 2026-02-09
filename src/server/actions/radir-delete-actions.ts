"use server"

import { db } from "@/lib/db";
import { agendas, agendasRadir } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase Client untuk operasi Storage di Server
// Menggunakan Service Role Key (jika ada) agar bisa bypass RLS policy saat menghapus file
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper: Hapus file fisik dari Storage 'Dokumen'
async function deleteFilesFromStorage(agendaIds: string[]) {
    try {
        // 1. Ambil data file dari tabel agendasRadir berdasarkan ID
        const radirData = await db
            .select()
            .from(agendasRadir)
            .where(inArray(agendasRadir.agendaId, agendaIds));

        if (radirData.length === 0) return;

        const filesToDelete: string[] = [];

        // 2. Kumpulkan path file dari kolom-kolom dokumen
        radirData.forEach((item) => {
            // Kolom file statis
            const fields = [
                item.legalReview, item.riskReview, item.complianceReview,
                item.regulationReview, item.recommendationNote, item.proposalNote,
                item.presentationMaterial
            ];
            fields.forEach((path) => { if (path) filesToDelete.push(path); });

            // Kolom supportingDocuments (JSON Array)
            if (Array.isArray(item.supportingDocuments)) {
                item.supportingDocuments.forEach((doc: string) => {
                    if (typeof doc === "string") filesToDelete.push(doc);
                });
            }
        });

        // 3. Eksekusi hapus dari Supabase Storage
        if (filesToDelete.length > 0) {
            const { error } = await supabase.storage.from("Dokumen").remove(filesToDelete);
            if (error) console.error("Gagal menghapus file dari storage:", error.message);
        }
    } catch (error) {
        console.error("Error helper deleteFilesFromStorage:", error);
    }
}

export async function deleteRadir(id: string) {
    try {
        // Hapus file fisik terlebih dahulu
        await deleteFilesFromStorage([id]);

        // Hapus dari tabel agendas
        await db.delete(agendas).where(eq(agendas.id, id));

        revalidatePath("/dashboard/agenda/radir");
        return { success: true, message: "Agenda dan dokumen terkait berhasil dihapus." };
    } catch (error) {
        console.error("Delete Error:", error);
        return { success: false, message: "Gagal menghapus agenda." };
    }
}

export async function deleteBulkRadir(ids: string[]) {
    try {
        if (ids.length === 0) return { success: false, message: "Tidak ada data yang dipilih." };

        // Hapus file fisik terlebih dahulu
        await deleteFilesFromStorage(ids);

        await db.delete(agendas).where(inArray(agendas.id, ids));

        revalidatePath("/dashboard/agenda/radir");
        return { success: true, message: `${ids.length} agenda dan dokumen terkait berhasil dihapus.` };
    } catch (error) {
        console.error("Bulk Delete Error:", error);
        return { success: false, message: "Gagal menghapus agenda terpilih." };
    }
}