"use server"

import { db } from "@/lib/db";
import { agendas, agendasRakordir } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function deleteFilesFromStorage(agendaIds: string[]) {
    try {
        const radirData = await db
            .select()
            .from(agendasRakordir)
            .where(inArray(agendasRakordir.agendaId, agendaIds));

        if (radirData.length === 0) return;

        const filesToDelete: string[] = [];

        radirData.forEach((item) => {
            // ✅ Hanya cek file RAKORDIR
            const fields = [item.proposalNote, item.presentationMaterial];
            fields.forEach((path) => { if (path) filesToDelete.push(path); });

            if (Array.isArray(item.supportingDocuments)) {
                item.supportingDocuments.forEach((doc: string) => {
                    if (typeof doc === "string") filesToDelete.push(doc);
                });
            }
        });

        if (filesToDelete.length > 0) {
            const { error } = await supabase.storage.from("Dokumen").remove(filesToDelete);
            if (error) console.error("Gagal menghapus file dari storage:", error.message);
        }
    } catch (error) {
        console.error("Error helper deleteFilesFromStorage:", error);
    }
}

export async function deleteRakordir(id: string) {
    try {
        await deleteFilesFromStorage([id]);
        await db.delete(agendas).where(eq(agendas.id, id));

        revalidatePath("/dashboard/agenda/rakordir");
        return { success: true, message: "Agenda berhasil dihapus." };
    } catch (error) {
        console.error("Delete Error:", error);
        return { success: false, message: "Gagal menghapus agenda." };
    }
}

export async function deleteBulkRakordir(ids: string[]) {
    try {
        if (ids.length === 0) return { success: false, message: "Tidak ada data yang dipilih." };

        await deleteFilesFromStorage(ids);
        await db.delete(agendas).where(inArray(agendas.id, ids));

        revalidatePath("/dashboard/agenda/rakordir");
        return { success: true, message: `${ids.length} agenda berhasil dihapus.` };
    } catch (error) {
        console.error("Bulk Delete Error:", error);
        return { success: false, message: "Gagal menghapus agenda terpilih." };
    }
}
