"use server";

import { db } from "@/lib/db";
import { agendas, agendasRadir, agendasRakordir } from "@/db/schema";
import { eq, inArray, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Tipe data gabungan untuk UI
export type UnifiedAgendaItem = {
    id: string;
    title: string;
    meetingType: "RADIR" | "RAKORDIR";
    status: string;
    executionDate: string | null;
    startTime: string | null;
    endTime: string | null;
    meetingMethod: string | null;
    meetingLocation: string | null;
    meetingLink: string | null;
    director: string | null;
    initiator: string | null;
    support: string | null;
};

export async function getUnifiedAgendas(): Promise<UnifiedAgendaItem[]> {
    try {
        // 1. Ambil RADIR
        const radirData = await db
            .select({
                id: agendas.id,
                title: agendas.title,
                meetingType: agendas.meetingType,
                status: agendas.status,
                executionDate: agendasRadir.executionDate,
                startTime: agendasRadir.startTime,
                endTime: agendasRadir.endTime,
                meetingMethod: agendasRadir.meetingMethod,
                meetingLocation: agendasRadir.meetingLocation,
                meetingLink: agendasRadir.meetingLink,
                director: agendas.director,
                initiator: agendas.initiator,
                support: agendasRadir.support,
                createdAt: agendas.createdAt,
            })
            .from(agendas)
            .innerJoin(agendasRadir, eq(agendas.id, agendasRadir.agendaId))
            .where(
                and(
                    eq(agendas.meetingType, "RADIR"),
                    // Filter status: Bukan Draft, Dibatalkan, Ditunda
                    and(
                        ne(agendas.status, "Draft"),
                        ne(agendas.status, "Dibatalkan"),
                        ne(agendas.status, "Ditunda")
                    )
                )
            );

        // 2. Ambil RAKORDIR
        const rakordirData = await db
            .select({
                id: agendas.id,
                title: agendas.title,
                meetingType: agendas.meetingType,
                status: agendas.status,
                executionDate: agendasRakordir.executionDate,
                startTime: agendasRakordir.startTime,
                endTime: agendasRakordir.endTime,
                meetingMethod: agendasRakordir.meetingMethod,
                meetingLocation: agendasRakordir.meetingLocation,
                meetingLink: agendasRakordir.meetingLink,
                director: agendas.director,
                initiator: agendas.initiator,
                support: agendasRakordir.support,
                createdAt: agendas.createdAt,
            })
            .from(agendas)
            .innerJoin(agendasRakordir, eq(agendas.id, agendasRakordir.agendaId))
            .where(
                and(
                    eq(agendas.meetingType, "RAKORDIR"),
                    // Filter status yang sama
                    and(
                        ne(agendas.status, "Draft"),
                        ne(agendas.status, "Dibatalkan"),
                        ne(agendas.status, "Ditunda")
                    )
                )
            );

        // 3. Gabungkan dan Urutkan
        // Kita urutkan berdasarkan executionDate (jika ada) atau createdAt
        const combined = [...radirData, ...rakordirData].sort((a, b) => {
            const dateA = a.executionDate ? new Date(a.executionDate).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const dateB = b.executionDate ? new Date(b.executionDate).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            return dateB - dateA; // Descending
        });

        return combined as unknown as UnifiedAgendaItem[];

    } catch (error) {
        console.error("Error getUnifiedAgendas:", error);
        return [];
    }
}

export async function scheduleUnifiedAgendas(
    items: { id: string; meetingType: "RADIR" | "RAKORDIR" }[],
    data: {
        executionDate: string;
        startTime: string;
        endTime: string;
        meetingMethod: string;
        meetingLocation: string;
        meetingLink: string;
    }
) {
    try {
        if (items.length === 0) return { success: false, error: "Tidak ada agenda dipilih." };

        const radirIds = items.filter(i => i.meetingType === "RADIR").map(i => i.id);
        const rakordirIds = items.filter(i => i.meetingType === "RAKORDIR").map(i => i.id);
        const allIds = items.map(i => i.id);

        await db.transaction(async (tx) => {
            // 1. Update Parent Status
            await tx.update(agendas)
                .set({ status: "Dijadwalkan", updatedAt: new Date() })
                .where(inArray(agendas.id, allIds));

            // 2. Update RADIR Child
            if (radirIds.length > 0) {
                await tx.update(agendasRadir)
                    .set({
                        executionDate: data.executionDate,
                        startTime: data.startTime,
                        endTime: data.endTime,
                        meetingMethod: data.meetingMethod,
                        meetingLocation: data.meetingLocation,
                        meetingLink: data.meetingLink
                    })
                    .where(inArray(agendasRadir.agendaId, radirIds));
            }

            // 3. Update RAKORDIR Child
            if (rakordirIds.length > 0) {
                await tx.update(agendasRakordir)
                    .set({
                        executionDate: data.executionDate,
                        startTime: data.startTime,
                        endTime: data.endTime,
                        meetingMethod: data.meetingMethod,
                        meetingLocation: data.meetingLocation,
                        meetingLink: data.meetingLink
                    })
                    .where(inArray(agendasRakordir.agendaId, rakordirIds));
            }
        });

        revalidatePath("/dashboard/jadwal-rapat");
        return { success: true, message: `${items.length} agenda berhasil dijadwalkan.` };

    } catch (error) {
        console.error("Schedule Unified Error:", error);
        return { success: false, error: "Gagal menjadwalkan agenda." };
    }
}
