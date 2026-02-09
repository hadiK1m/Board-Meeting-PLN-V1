"use server";

import { db } from "@/lib/db";
import { agendas, agendasRadir, agendasRakordir } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type ActionState = {
    success: boolean;
    message?: string;
    error?: string;
};

export async function updateAgendaStatusAction(
    id: string,
    status: "Ditunda" | "Dibatalkan",
    reason: string
): Promise<ActionState> {
    try {
        if (!id || !status || !reason) {
            return { success: false, error: "Data tidak lengkap." };
        }


        await db
            .update(agendas)
            .set({
                status: status,
                updatedAt: new Date(),
                notes: reason
            })
            .where(eq(agendas.id, id));

        console.log(`Agenda ${id} status updated to ${status}. Reason: ${reason}`);

        revalidatePath("/dashboard/agenda-siap/radir");
        revalidatePath("/dashboard/agenda/radir"); // Revalidate halaman asal juga jika perlu

        return { success: true, message: `Agenda berhasil diubah statusnya menjadi .` };
    } catch (error) {
        console.error("Update Status Error:", error);
        return { success: false, error: "Gagal memperbarui status agenda." };
    }
}

export async function scheduleBulkAgendas(
    ids: string[],
    data: {
        executionDate: string;
        startTime: string;
        endTime: string;
        meetingMethod: string;
        meetingLocation: string;
        meetingLink: string;
    }
): Promise<ActionState> {
    try {
        if (ids.length === 0) return { success: false, error: "Tidak ada agenda dipilih." };

        await db.transaction(async (tx) => {
            // 1. Update Status Parent menjadi "Dijadwalkan"
            await tx.update(agendas)
                .set({ status: "Dijadwalkan", updatedAt: new Date() })
                .where(inArray(agendas.id, ids));

            // 2. Update Detail Jadwal di Child Table
            await tx.update(agendasRadir)
                .set({
                    executionDate: data.executionDate,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    meetingMethod: data.meetingMethod,
                    meetingLocation: data.meetingLocation,
                    meetingLink: data.meetingLink
                })
                .where(inArray(agendasRadir.agendaId, ids));
        });

        revalidatePath("/dashboard/agenda-siap/radir");
        return { success: true, message: `${ids.length} agenda berhasil dijadwalkan.` };
    } catch (error) {
        console.error("Schedule Error:", error);
        return { success: false, error: "Gagal menjadwalkan agenda." };
    }
}

export async function scheduleBulkRakordirAgendas(
    ids: string[],
    data: {
        executionDate: string;
        startTime: string;
        endTime: string;
        meetingMethod: string;
        meetingLocation: string;
        meetingLink: string;
    }
): Promise<ActionState> {
    try {
        if (ids.length === 0) return { success: false, error: "Tidak ada agenda dipilih." };

        await db.transaction(async (tx) => {
            // 1. Update Status Parent menjadi "Dijadwalkan"
            await tx.update(agendas)
                .set({ status: "Dijadwalkan", updatedAt: new Date() })
                .where(inArray(agendas.id, ids));

            // 2. Update Detail Jadwal di Child Table (RAKORDIR)
            await tx.update(agendasRakordir)
                .set({
                    executionDate: data.executionDate,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    meetingMethod: data.meetingMethod,
                    meetingLocation: data.meetingLocation,
                    meetingLink: data.meetingLink
                })
                .where(inArray(agendasRakordir.agendaId, ids));
        });

        revalidatePath("/dashboard/agenda-siap/rakordir");
        return { success: true, message: `${ids.length} agenda RAKORDIR berhasil dijadwalkan.` };
    } catch (error) {
        console.error("Schedule Rakordir Error:", error);
        return { success: false, error: "Gagal menjadwalkan agenda." };
    }
}
