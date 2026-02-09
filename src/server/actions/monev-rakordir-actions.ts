// src/server/actions/monev-rakordir-actions.ts
"use server";

import { db } from "@/lib/db";
import { agendas, agendasRakordir } from "@/db/schema";
import { eq, and, isNotNull, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Tipe data untuk Arahan Direksi Item
export type ArahanDireksiItem = {
    arahan: string;
    targetOutput: string;
    progresTerkini: string;
    evidence: string;
    statusPenyelesaian: string; // "dalam_proses" | "selesai"
};

// Tipe data untuk Monev Rakordir Agenda (one row per agenda)
export type MonevRakordirItem = {
    agendaId: string;
    title: string;
    initiator: string | null;
    contactPerson: string | null;
    phone: string | null;
    position: string | null;
    director: string | null;
    notulensiNumber: string | null;
    executionDate: string | null;
    notulensiTtd: string | null; // Path file notulensi yang sudah TTD
    arahanDireksi: ArahanDireksiItem[];
    totalArahan: number;
    completedArahan: number;
};

export async function getMonevRakordirData(): Promise<MonevRakordirItem[]> {
    try {
        // Ambil semua agenda RAKORDIR yang sudah punya notulensi number
        const rows = await db
            .select({
                agendaId: agendas.id,
                title: agendas.title,
                initiator: agendas.initiator,
                contactPerson: agendas.contactPerson,
                phone: agendas.phone,
                position: agendas.position,
                director: agendas.director,
                notulensiNumber: agendasRakordir.notulensiNumber,
                executionDate: agendasRakordir.executionDate,
                notulensiTtd: agendasRakordir.notulensiTtd,
                arahanDireksi: agendasRakordir.arahanDireksi,
            })
            .from(agendasRakordir)
            .innerJoin(agendas, eq(agendasRakordir.agendaId, agendas.id))
            .where(
                and(
                    isNotNull(agendasRakordir.notulensiNumber),
                    sql`${agendasRakordir.notulensiNumber} <> ''`
                )
            )
            .orderBy(desc(agendasRakordir.executionDate));

        // One row per agenda
        const result: MonevRakordirItem[] = rows.map(row => {
            const arahanDireksi = (row.arahanDireksi as ArahanDireksiItem[]) || [];
            const totalArahan = arahanDireksi.length;
            const completedArahan = arahanDireksi.filter(a =>
                a.statusPenyelesaian === "selesai" ||
                a.statusPenyelesaian === "Selesai"
            ).length;

            return {
                agendaId: row.agendaId,
                title: row.title,
                initiator: row.initiator,
                contactPerson: row.contactPerson,
                phone: row.phone,
                position: row.position,
                director: row.director,
                notulensiNumber: row.notulensiNumber,
                executionDate: row.executionDate,
                notulensiTtd: row.notulensiTtd ?? null,
                arahanDireksi,
                totalArahan,
                completedArahan,
            };
        });

        return result;
    } catch (error) {
        console.error("Error getMonevRakordirData:", error);
        return [];
    }
}

// Update arahan direksi for a specific agenda
export async function updateArahanDireksiAction(
    agendaId: string,
    arahanDireksi: ArahanDireksiItem[]
) {
    try {
        await db
            .update(agendasRakordir)
            .set({ arahanDireksi })
            .where(eq(agendasRakordir.agendaId, agendaId));

        revalidatePath("/monev/rakordir");
        return { success: true };
    } catch (error) {
        console.error("Error updateArahanDireksiAction:", error);
        return { success: false, error: "Gagal update arahan direksi." };
    }
}
