// src/server/actions/monev-radir-actions.ts
"use server";

import { db } from "@/lib/db";
import { agendas, agendasRadir } from "@/db/schema";
import { eq, and, isNotNull, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Tipe data untuk Decision Item
export type DecisionItem = {
    decision: string;
    output: string;
    progressTerkini: string;
    status?: string; // "dalam_proses" | "selesai"
    evidence: string;
    statusMonev?: string; // Legacy field: "Dalam Proses" | "Selesai"
};

// Tipe data untuk Monev Agenda (one row per agenda)
export type MonevAgendaItem = {
    agendaId: string;
    title: string;
    initiator: string | null;
    contactPerson: string | null;
    phone: string | null;
    position: string | null;
    director: string | null;
    meetingNumber: string | null;
    executionDate: string | null;
    risalahTtd: string | null; // Path file petikan risalah yang sudah TTD
    decisions: DecisionItem[];
    totalDecisions: number;
    completedDecisions: number;
};

export async function getMonevRadirData(): Promise<MonevAgendaItem[]> {
    try {
        // Ambil semua agenda RADIR yang sudah punya meeting number
        const rows = await db
            .select({
                agendaId: agendas.id,
                title: agendas.title,
                initiator: agendas.initiator,
                contactPerson: agendas.contactPerson,
                phone: agendas.phone,
                position: agendas.position,
                director: agendas.director,
                meetingNumber: agendasRadir.meetingNumber,
                executionDate: agendasRadir.executionDate,
                risalahTtd: agendasRadir.risalahTtd,
                meetingDecisions: agendasRadir.meetingDecisions,
            })
            .from(agendasRadir)
            .innerJoin(agendas, eq(agendasRadir.agendaId, agendas.id))
            .where(
                and(
                    isNotNull(agendasRadir.meetingNumber),
                    sql`${agendasRadir.meetingNumber} <> ''`
                )
            )
            .orderBy(desc(agendasRadir.executionDate));

        // One row per agenda
        const result: MonevAgendaItem[] = rows.map(row => {
            const decisions = (row.meetingDecisions as DecisionItem[]) || [];
            const totalDecisions = decisions.length;
            const completedDecisions = decisions.filter(d => d.status === "selesai" || d.statusMonev === "selesai" || d.statusMonev === "Selesai").length;

            return {
                agendaId: row.agendaId,
                title: row.title,
                initiator: row.initiator,
                contactPerson: row.contactPerson,
                phone: row.phone,
                position: row.position,
                director: row.director,
                meetingNumber: row.meetingNumber,
                executionDate: row.executionDate,
                risalahTtd: row.risalahTtd ?? null,
                decisions,
                totalDecisions,
                completedDecisions,
            };
        });

        return result;
    } catch (error) {
        console.error("Error getMonevRadirData:", error);
        return [];
    }
}

// Update status monev for a specific decision
export async function updateMonevStatusAction(
    agendaId: string,
    decisionIndex: number,
    statusMonev: string
) {
    try {
        // First get the current decisions
        const rows = await db
            .select({
                meetingDecisions: agendasRadir.meetingDecisions,
            })
            .from(agendasRadir)
            .where(eq(agendasRadir.agendaId, agendaId));

        if (rows.length === 0) {
            return { success: false, error: "Agenda tidak ditemukan." };
        }

        const row = rows[0];
        const decisions = (row?.meetingDecisions as DecisionItem[]) || [];

        if (decisionIndex >= decisions.length || !decisions[decisionIndex]) {
            return { success: false, error: "Decision tidak ditemukan." };
        }

        // Update the status
        decisions[decisionIndex]!.statusMonev = statusMonev;

        // Save back to database
        await db
            .update(agendasRadir)
            .set({ meetingDecisions: decisions })
            .where(eq(agendasRadir.agendaId, agendaId));

        revalidatePath("/monev/radir");
        return { success: true };
    } catch (error) {
        console.error("Error updateMonevStatusAction:", error);
        return { success: false, error: "Gagal update status." };
    }
}
