// src/server/actions/pelaksanaan-rakordir-actions.ts
"use server";

import { db } from "@/lib/db";
import { agendas, agendasRakordir } from "@/db/schema";
import { eq, and, isNotNull, inArray, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Type for Notulensi Meeting Summary
export type NotulensiMeetingSummary = {
    notulensiNumber: string;
    meetingYear: string | null;
    executionDate: string | null;
    location: string | null;
    agendaCount: number;
    status: string;
};

// Get RAKORDIR meetings that have notulensi number
export async function getRakordirMeetings(): Promise<NotulensiMeetingSummary[]> {
    try {
        const rows = await db
            .select({
                notulensiNumber: agendasRakordir.notulensiNumber,
                meetingYear: agendasRakordir.meetingYear,
                executionDate: agendasRakordir.executionDate,
                location: agendasRakordir.meetingLocation,
                status: agendas.status,
            })
            .from(agendasRakordir)
            .innerJoin(agendas, eq(agendasRakordir.agendaId, agendas.id))
            .where(and(
                isNotNull(agendasRakordir.notulensiNumber),
                sql`${agendasRakordir.notulensiNumber} <> ''`
            ))
            .orderBy(desc(agendasRakordir.executionDate));

        // Group by notulensiNumber
        const grouped = rows.reduce((acc, row) => {
            const key = row.notulensiNumber!;
            if (!acc[key]) {
                acc[key] = {
                    notulensiNumber: key,
                    meetingYear: row.meetingYear,
                    executionDate: row.executionDate,
                    location: row.location,
                    agendaCount: 0,
                    status: row.status,
                };
            }
            acc[key].agendaCount += 1;
            return acc;
        }, {} as Record<string, NotulensiMeetingSummary>);

        return Object.values(grouped);
    } catch (error) {
        console.error("Error getRakordirMeetings:", error);
        return [];
    }
}

// Get RAKORDIR agendas with status "Dijadwalkan"
export async function getDijadwalkanRakordirAgendas() {
    try {
        const rows = await db
            .select({
                id: agendas.id,
                title: agendas.title,
                executionDate: agendasRakordir.executionDate,
            })
            .from(agendas)
            .innerJoin(agendasRakordir, eq(agendas.id, agendasRakordir.agendaId))
            .where(eq(agendas.status, "Dijadwalkan"));

        return rows.map(r => ({
            label: r.title,
            value: r.id
        }));
    } catch (error) {
        console.error("Error getDijadwalkanRakordirAgendas:", error);
        return [];
    }
}

// Generate random notulensi number
function generateNotulensiNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `NTL-${timestamp}-${random}`;
}

// Create Notulensi (assign notulensi number to agendas)
export async function createNotulensiAction(data: {
    agendaIds: string[];
    year?: number;
}) {
    try {
        if (data.agendaIds.length === 0) {
            return { success: false, error: "Pilih minimal satu agenda." };
        }

        const notulensiNumber = generateNotulensiNumber();
        const meetingYear = data.year?.toString() || new Date().getFullYear().toString();

        // Update agendasRakordir with Notulensi Number & Year
        await db
            .update(agendasRakordir)
            .set({
                notulensiNumber: notulensiNumber,
                meetingYear: meetingYear,
            })
            .where(inArray(agendasRakordir.agendaId, data.agendaIds));

        revalidatePath("/dashboard/pelaksanaan-rapat/rakordir");
        return { success: true, message: "Notulensi berhasil dibuat.", notulensiNumber };
    } catch (error) {
        console.error("Error createNotulensiAction:", error);
        return { success: false, error: "Gagal membuat notulensi." };
    }
}

// Get Notulensi Detail by Notulensi Number
export async function getNotulensiDetail(notulensiNumber: string) {
    try {
        const rows = await db
            .select({
                // Agenda base info
                id: agendas.id,
                title: agendas.title,
                status: agendas.status,
                director: agendas.director,
                initiator: agendas.initiator,

                // RAKORDIR specific
                notulensiNumber: agendasRakordir.notulensiNumber,
                meetingYear: agendasRakordir.meetingYear,
                executionDate: agendasRakordir.executionDate,
                startTime: agendasRakordir.startTime,
                endTime: agendasRakordir.endTime,
                meetingMethod: agendasRakordir.meetingMethod,
                meetingLocation: agendasRakordir.meetingLocation,
                meetingLink: agendasRakordir.meetingLink,

                // Shared fields
                pimpinanRapat: agendasRakordir.pimpinanRapat,
                attendanceData: agendasRakordir.attendanceData,
                guestParticipants: agendasRakordir.guestParticipants,

                // Per-agenda fields
                executiveSummary: agendasRakordir.executiveSummary,
                arahanDireksi: agendasRakordir.arahanDireksi,
                notulensiTtd: agendasRakordir.notulensiTtd,

                // Document fields
                presentationMaterial: agendasRakordir.presentationMaterial,
                proposalNote: agendasRakordir.proposalNote,
                supportingDocuments: agendasRakordir.supportingDocuments,
            })
            .from(agendasRakordir)
            .innerJoin(agendas, eq(agendasRakordir.agendaId, agendas.id))
            .where(eq(agendasRakordir.notulensiNumber, notulensiNumber));

        if (rows.length === 0) {
            return null;
        }

        const first = rows[0]!;

        // Build per-agenda content data
        const perAgendaContent: Record<string, {
            executiveSummary: string;
            arahanDireksi: { arahan: string; targetOutput: string; progresTerkini: string; evidence: string; statusPenyelesaian: string }[];
        }> = {};

        rows.forEach(r => {
            perAgendaContent[r.id] = {
                executiveSummary: r.executiveSummary || "",
                arahanDireksi: (r.arahanDireksi as { arahan: string; targetOutput: string; progresTerkini: string; evidence: string; statusPenyelesaian: string }[]) || [],
            };
        });

        return {
            notulensiNumber: first.notulensiNumber,
            meetingYear: first.meetingYear,
            executionDate: first.executionDate,
            startTime: first.startTime,
            endTime: first.endTime,
            meetingMethod: first.meetingMethod,
            meetingLocation: first.meetingLocation,
            meetingLink: first.meetingLink,
            // Shared data
            pimpinanRapat: (first.pimpinanRapat as string[]) ?? [],
            attendanceData: (first.attendanceData as Record<string, { status: string; kuasaTo?: string }>) ?? {},
            guestParticipants: (first.guestParticipants as { name: string; jabatan: string }[]) ?? [],
            // Notulensi TTD
            notulensiTtd: first.notulensiTtd ?? null,
            // Per-agenda content
            perAgendaContent,
            // Agendas list
            agendas: rows.map(r => ({
                id: r.id,
                title: r.title,
                status: r.status,
                director: r.director,
                initiator: r.initiator,
                presentationMaterial: r.presentationMaterial,
                proposalNote: r.proposalNote,
                supportingDocuments: (r.supportingDocuments as string[]) ?? [],
            })),
        };
    } catch (error) {
        console.error("Error getNotulensiDetail:", error);
        return null;
    }
}

// Update Notulensi
export async function updateNotulensiAction(
    notulensiNumber: string,
    data: {
        pimpinanRapat?: string[];
        attendanceData?: Record<string, { status: string; kuasaTo?: string }>;
        guestParticipants?: { name: string; jabatan: string }[];
        notulensiTtd?: string | null;
        perAgendaContent?: Record<string, {
            executiveSummary?: string;
            arahanDireksi?: { arahan: string; targetOutput: string; progresTerkini: string; evidence: string; statusPenyelesaian: string }[];
        }>;
    }
) {
    try {
        // Update shared data for all agendas
        await db
            .update(agendasRakordir)
            .set({
                pimpinanRapat: data.pimpinanRapat ?? [],
                attendanceData: data.attendanceData ?? {},
                guestParticipants: data.guestParticipants ?? [],
                notulensiTtd: data.notulensiTtd ?? null,
            })
            .where(eq(agendasRakordir.notulensiNumber, notulensiNumber));

        // Update per-agenda content
        if (data.perAgendaContent) {
            for (const [agendaId, content] of Object.entries(data.perAgendaContent)) {
                await db
                    .update(agendasRakordir)
                    .set({
                        executiveSummary: content.executiveSummary ?? "",
                        arahanDireksi: content.arahanDireksi ?? [],
                    })
                    .where(eq(agendasRakordir.agendaId, agendaId));
            }
        }

        revalidatePath(`/dashboard/pelaksanaan-rapat/rakordir/input/${encodeURIComponent(notulensiNumber)}`);
        revalidatePath("/dashboard/pelaksanaan-rapat/rakordir");

        return { success: true, message: "Notulensi berhasil disimpan." };
    } catch (error) {
        console.error("Error updateNotulensiAction:", error);
        return { success: false, error: "Gagal menyimpan notulensi." };
    }
}

// Finalize Notulensi
export async function finalizeNotulensiAction(notulensiNumber: string) {
    try {
        const rows = await db
            .select({ agendaId: agendasRakordir.agendaId })
            .from(agendasRakordir)
            .where(eq(agendasRakordir.notulensiNumber, notulensiNumber));

        const agendaIds = rows.map(r => r.agendaId);

        if (agendaIds.length > 0) {
            await db
                .update(agendas)
                .set({ status: "Selesai", updatedAt: new Date() })
                .where(inArray(agendas.id, agendaIds));
        }

        revalidatePath("/dashboard/pelaksanaan-rapat/rakordir");
        return { success: true, message: "Notulensi telah diselesaikan." };
    } catch (error) {
        console.error("Error finalizeNotulensiAction:", error);
        return { success: false, error: "Gagal menyelesaikan notulensi." };
    }
}

// Update Notulensi Number
export async function updateNotulensiNumberAction(
    oldNotulensiNumber: string,
    newNotulensiNumber: string
) {
    try {
        if (!newNotulensiNumber || newNotulensiNumber.trim() === "") {
            return { success: false, error: "Nomor notulensi tidak boleh kosong." };
        }

        if (oldNotulensiNumber !== newNotulensiNumber) {
            const existing = await db
                .select({ notulensiNumber: agendasRakordir.notulensiNumber })
                .from(agendasRakordir)
                .where(eq(agendasRakordir.notulensiNumber, newNotulensiNumber))
                .limit(1);

            if (existing.length > 0) {
                return { success: false, error: "Nomor notulensi sudah digunakan." };
            }
        }

        await db
            .update(agendasRakordir)
            .set({ notulensiNumber: newNotulensiNumber })
            .where(eq(agendasRakordir.notulensiNumber, oldNotulensiNumber));

        revalidatePath("/dashboard/pelaksanaan-rapat/rakordir");
        revalidatePath(`/dashboard/pelaksanaan-rapat/rakordir/input/${encodeURIComponent(newNotulensiNumber)}`);

        return { success: true, message: "Nomor notulensi berhasil diubah." };
    } catch (error) {
        console.error("Error updateNotulensiNumberAction:", error);
        return { success: false, error: "Gagal mengubah nomor notulensi." };
    }
}

// Update Notulensi Meeting Info
export async function updateNotulensiInfoAction(
    notulensiNumber: string,
    data: {
        executionDate?: string | null;
        startTime?: string | null;
        endTime?: string | null;
        meetingLocation?: string | null;
        meetingMethod?: string | null;
        meetingLink?: string | null;
    }
) {
    try {
        await db
            .update(agendasRakordir)
            .set({
                executionDate: data.executionDate ?? undefined,
                startTime: data.startTime ?? undefined,
                endTime: data.endTime ?? undefined,
                meetingLocation: data.meetingLocation ?? undefined,
                meetingMethod: data.meetingMethod ?? undefined,
                meetingLink: data.meetingLink ?? undefined,
            })
            .where(eq(agendasRakordir.notulensiNumber, notulensiNumber));

        revalidatePath("/dashboard/pelaksanaan-rapat/rakordir");
        revalidatePath(`/dashboard/pelaksanaan-rapat/rakordir/input/${encodeURIComponent(notulensiNumber)}`);

        return { success: true, message: "Informasi rapat berhasil diperbarui." };
    } catch (error) {
        console.error("Error updateNotulensiInfoAction:", error);
        return { success: false, error: "Gagal memperbarui informasi rapat." };
    }
}

// Remove agenda from notulensi
export async function removeAgendaFromNotulensiAction(agendaId: string, notulensiNumber: string) {
    try {
        await db
            .update(agendasRakordir)
            .set({
                notulensiNumber: null,
                meetingYear: null,
                pimpinanRapat: [],
                attendanceData: {},
                guestParticipants: [],
                executiveSummary: null,
                arahanDireksi: null,
            })
            .where(eq(agendasRakordir.agendaId, agendaId));

        await db
            .update(agendas)
            .set({ status: "Dijadwalkan", updatedAt: new Date() })
            .where(eq(agendas.id, agendaId));

        revalidatePath(`/dashboard/pelaksanaan-rapat/rakordir/input/${encodeURIComponent(notulensiNumber)}`);
        revalidatePath("/dashboard/pelaksanaan-rapat/rakordir");

        return { success: true, message: "Agenda berhasil dihapus dari notulensi." };
    } catch (error) {
        console.error("Error removeAgendaFromNotulensiAction:", error);
        return { success: false, error: "Gagal menghapus agenda dari notulensi." };
    }
}

// Add agenda to existing notulensi
export async function addAgendaToNotulensiAction(
    notulensiNumber: string,
    agendaIds: string[],
    sharedData?: {
        pimpinanRapat?: string[];
        attendanceData?: Record<string, { status: string; keterangan?: string }>;
        guestParticipants?: { name: string; jabatan: string }[];
        notulensiTtd?: string | null;
    }
) {
    try {
        if (agendaIds.length === 0) {
            return { success: false, error: "Pilih minimal satu agenda." };
        }

        // Get current meeting year from the notulensi
        const existingRows = await db
            .select({ meetingYear: agendasRakordir.meetingYear })
            .from(agendasRakordir)
            .where(eq(agendasRakordir.notulensiNumber, notulensiNumber))
            .limit(1);

        const meetingYear = existingRows[0]?.meetingYear || new Date().getFullYear().toString();

        // Update each agenda with the notulensi number and shared data
        for (const agendaId of agendaIds) {
            await db
                .update(agendasRakordir)
                .set({
                    notulensiNumber: notulensiNumber,
                    meetingYear: meetingYear,
                    pimpinanRapat: sharedData?.pimpinanRapat ?? [],
                    attendanceData: sharedData?.attendanceData ?? {},
                    guestParticipants: sharedData?.guestParticipants ?? [],
                    notulensiTtd: sharedData?.notulensiTtd ?? null,
                })
                .where(eq(agendasRakordir.agendaId, agendaId));
        }

        revalidatePath(`/dashboard/pelaksanaan-rapat/rakordir/input/${encodeURIComponent(notulensiNumber)}`);
        revalidatePath("/dashboard/pelaksanaan-rapat/rakordir");

        return { success: true, message: "Agenda berhasil ditambahkan ke notulensi." };
    } catch (error) {
        console.error("Error addAgendaToNotulensiAction:", error);
        return { success: false, error: "Gagal menambahkan agenda ke notulensi." };
    }
}
