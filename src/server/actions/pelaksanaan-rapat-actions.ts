// src/server/actions/pelaksanaan-rapat-actions.ts
"use server";

import { db } from "@/lib/db";
import { agendas, agendasRadir } from "@/db/schema";
import { eq, and, isNotNull, ne, inArray, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Tipe data untuk Meeting (Grouping Agenda)
export type MeetingSummary = {
    meetingNumber: string;
    meetingYear: string | null;
    executionDate: string | null;
    location: string | null;
    agendaCount: number;
    status: string; // Status meeting (bisa diambil dari status agenda mayoritas)
};

export async function getRadirMeetings(): Promise<MeetingSummary[]> {
    try {
        // Ambil semua agenda RADIR yang sudah punya Nomor Meeting
        const rows = await db
            .select({
                meetingNumber: agendasRadir.meetingNumber,
                meetingYear: agendasRadir.meetingYear,
                executionDate: agendasRadir.executionDate,
                location: agendasRadir.meetingLocation,
                status: agendas.status,
            })
            .from(agendasRadir)
            .innerJoin(agendas, eq(agendasRadir.agendaId, agendas.id))
            .where(and(isNotNull(agendasRadir.meetingNumber), ne(agendasRadir.meetingNumber, "")))
            .orderBy(desc(agendasRadir.executionDate));

        // Grouping by meetingNumber secara manual (karena keterbatasan groupBy ORM untuk complex object)
        const grouped = rows.reduce((acc, row) => {
            const key = row.meetingNumber!;
            if (!acc[key]) {
                acc[key] = {
                    meetingNumber: key,
                    meetingYear: row.meetingYear,
                    executionDate: row.executionDate,
                    location: row.location,
                    agendaCount: 0,
                    status: row.status, // Ambil status dari salah satu agenda
                };
            }
            acc[key].agendaCount += 1;
            return acc;
        }, {} as Record<string, MeetingSummary>);

        return Object.values(grouped);
    } catch (error) {
        console.error("Error getRadirMeetings:", error);
        return [];
    }
}

export async function getDijadwalkanRadirAgendas() {
    try {
        // Ambil agenda RADIR yang statusnya 'Dijadwalkan' dan BELUM punya nomor meeting (atau mau di-override)
        // Asumsi: Agenda yang bisa dipilih adalah yang statusnya 'Dijadwalkan'
        const rows = await db
            .select({
                id: agendas.id,
                title: agendas.title,
                executionDate: agendasRadir.executionDate,
            })
            .from(agendas)
            .innerJoin(agendasRadir, eq(agendas.id, agendasRadir.agendaId))
            .where(eq(agendas.status, "Dijadwalkan"));

        return rows.map(r => ({
            label: r.title,
            value: r.id
        }));
    } catch (error) {
        console.error("Error getDijadwalkanRadirAgendas:", error);
        return [];
    }
}

export async function createRisalahAction(data: {
    meetingNumber: string;
    meetingYear: string;
    agendaIds: string[];
}) {
    try {
        if (!data.meetingNumber || data.agendaIds.length === 0) {
            return { success: false, error: "Data tidak lengkap." };
        }

        // Update agendasRadir dengan Nomor Meeting & Tahun
        await db
            .update(agendasRadir)
            .set({
                meetingNumber: data.meetingNumber,
                meetingYear: data.meetingYear,
            })
            .where(inArray(agendasRadir.agendaId, data.agendaIds));

        // Opsional: Update status agenda menjadi 'Sedang Rapat' atau 'Dalam Risalah' jika diperlukan
        // await db.update(agendas).set({ status: 'Dalam Pelaksanaan' }).where(...)

        revalidatePath("/dashboard/pelaksanaan-rapat/radir");
        return { success: true, message: "Risalah berhasil dibuat." };
    } catch (error) {
        console.error("Error createRisalahAction:", error);
        return { success: false, error: "Gagal membuat risalah." };
    }
}

// Get Risalah Detail by Meeting Number
export async function getRisalahDetail(meetingNumber: string) {
    try {
        console.log("=== getRisalahDetail called ===");
        console.log("Meeting Number:", meetingNumber);

        // Get all agendas for this meeting
        const rows = await db
            .select({
                // Agenda base info
                id: agendas.id,
                title: agendas.title,
                status: agendas.status,
                director: agendas.director,
                initiator: agendas.initiator,

                // RADIR specific
                meetingNumber: agendasRadir.meetingNumber,
                meetingYear: agendasRadir.meetingYear,
                executionDate: agendasRadir.executionDate,
                startTime: agendasRadir.startTime,
                endTime: agendasRadir.endTime,
                meetingMethod: agendasRadir.meetingMethod,
                meetingLocation: agendasRadir.meetingLocation,
                meetingLink: agendasRadir.meetingLink,

                // Shared fields (kehadiran) - same for all agendas
                pimpinanRapat: agendasRadir.pimpinanRapat,
                attendanceData: agendasRadir.attendanceData,
                guestParticipants: agendasRadir.guestParticipants,

                // Per-agenda fields
                executiveSummary: agendasRadir.executiveSummary,
                considerations: agendasRadir.considerations,
                risalahBody: agendasRadir.risalahBody,
                meetingDecisions: agendasRadir.meetingDecisions,
                dissentingOpinion: agendasRadir.dissentingOpinion,
                risalahTtd: agendasRadir.risalahTtd,

                // Document fields
                legalReview: agendasRadir.legalReview,
                riskReview: agendasRadir.riskReview,
                complianceReview: agendasRadir.complianceReview,
                regulationReview: agendasRadir.regulationReview,
                recommendationNote: agendasRadir.recommendationNote,
                proposalNote: agendasRadir.proposalNote,
                presentationMaterial: agendasRadir.presentationMaterial,
                supportingDocuments: agendasRadir.supportingDocuments,
            })
            .from(agendasRadir)
            .innerJoin(agendas, eq(agendasRadir.agendaId, agendas.id))
            .where(eq(agendasRadir.meetingNumber, meetingNumber));

        console.log("Rows found:", rows.length);
        if (rows.length > 0) {
            console.log("First row pimpinanRapat:", JSON.stringify(rows[0]?.pimpinanRapat));
            console.log("First row attendanceData:", JSON.stringify(rows[0]?.attendanceData));
            console.log("Agenda IDs:", rows.map(r => r.id));
        }

        if (rows.length === 0) {
            return null;
        }

        // Take meeting info and shared kehadiran from first row
        const first = rows[0]!;

        // Build per-agenda content data
        const perAgendaContent: Record<string, {
            executiveSummary: string;
            considerations: string;
            meetingDecisions: { decision: string; output: string; progressTerkini: string; status: string; evidence: string }[];
            dissentingOpinion: string;
        }> = {};

        rows.forEach(r => {
            perAgendaContent[r.id] = {
                executiveSummary: r.executiveSummary || "",
                considerations: r.considerations || "",
                meetingDecisions: (r.meetingDecisions as { decision: string; output: string; progressTerkini: string; status: string; evidence: string }[]) || [],
                dissentingOpinion: r.dissentingOpinion || "",
            };
        });

        return {
            meetingNumber: first.meetingNumber,
            meetingYear: first.meetingYear,
            executionDate: first.executionDate,
            startTime: first.startTime,
            endTime: first.endTime,
            meetingMethod: first.meetingMethod,
            meetingLocation: first.meetingLocation,
            meetingLink: first.meetingLink,
            // Shared kehadiran data
            pimpinanRapat: (first.pimpinanRapat as string[]) ?? [],
            attendanceData: (first.attendanceData as Record<string, { status: string; kuasaTo?: string }>) ?? {},
            guestParticipants: (first.guestParticipants as { name: string; jabatan: string }[]) ?? [],
            // Risalah TTD
            risalahTtd: first.risalahTtd ?? null,
            // Per-agenda content
            perAgendaContent,
            // Agendas list with document fields
            agendas: rows.map(r => ({
                id: r.id,
                title: r.title,
                status: r.status,
                director: r.director,
                initiator: r.initiator,
                // Document fields
                legalReview: r.legalReview,
                riskReview: r.riskReview,
                complianceReview: r.complianceReview,
                regulationReview: r.regulationReview,
                recommendationNote: r.recommendationNote,
                proposalNote: r.proposalNote,
                presentationMaterial: r.presentationMaterial,
                supportingDocuments: (r.supportingDocuments as string[]) ?? [],
            })),
        };
    } catch (error) {
        console.error("Error getRisalahDetail:", error);
        return null;
    }
}

// Update Risalah - handles both shared and per-agenda data
export async function updateRisalahAction(
    meetingNumber: string,
    data: {
        // Shared kehadiran data (applies to all agendas)
        pimpinanRapat?: string[];
        attendanceData?: Record<string, { status: string; kuasaTo?: string }>;
        guestParticipants?: { name: string; jabatan: string }[];
        // Risalah TTD (signed document)
        risalahTtd?: string | null;
        // Per-agenda content data
        perAgendaContent?: Record<string, {
            executiveSummary?: string;
            considerations?: string;
            meetingDecisions?: { decision: string; output: string; progressTerkini: string; evidence: string }[];
            dissentingOpinion?: string;
        }>;
    }
) {
    try {
        console.log("=== updateRisalahAction called ===");
        console.log("Meeting Number:", meetingNumber);
        console.log("Pimpinan Rapat:", JSON.stringify(data.pimpinanRapat));
        console.log("Attendance Data:", JSON.stringify(data.attendanceData));
        console.log("Guest Participants:", JSON.stringify(data.guestParticipants));
        console.log("Risalah TTD:", data.risalahTtd);
        console.log("Per-Agenda Content Keys:", data.perAgendaContent ? Object.keys(data.perAgendaContent) : "none");

        // First, update shared kehadiran data for all agendas
        const sharedUpdateResult = await db
            .update(agendasRadir)
            .set({
                pimpinanRapat: data.pimpinanRapat ?? [],
                attendanceData: data.attendanceData ?? {},
                guestParticipants: data.guestParticipants ?? [],
                risalahTtd: data.risalahTtd ?? null,
            })
            .where(eq(agendasRadir.meetingNumber, meetingNumber))
            .returning({ agendaId: agendasRadir.agendaId });

        console.log("Shared update affected agendas:", JSON.stringify(sharedUpdateResult));

        // Then, update per-agenda content data individually
        if (data.perAgendaContent) {
            for (const [agendaId, content] of Object.entries(data.perAgendaContent)) {
                console.log(`Updating per-agenda content for agendaId: ${agendaId}`);
                const perAgendaResult = await db
                    .update(agendasRadir)
                    .set({
                        executiveSummary: content.executiveSummary ?? "",
                        considerations: content.considerations ?? "",
                        meetingDecisions: content.meetingDecisions ?? [],
                        dissentingOpinion: content.dissentingOpinion ?? "",
                    })
                    .where(eq(agendasRadir.agendaId, agendaId))
                    .returning({ agendaId: agendasRadir.agendaId });
                console.log(`Per-agenda update result for ${agendaId}:`, JSON.stringify(perAgendaResult));
            }
        }

        revalidatePath(`/dashboard/pelaksanaan-rapat/radir/input/${encodeURIComponent(meetingNumber)}`);
        revalidatePath("/dashboard/pelaksanaan-rapat/radir");

        return { success: true, message: "Risalah berhasil disimpan." };
    } catch (error) {
        console.error("Error updateRisalahAction:", error);
        return { success: false, error: "Gagal menyimpan risalah." };
    }
}

// Finalize Risalah (change status to completed)
export async function finalizeRisalahAction(meetingNumber: string) {
    try {
        // Get all agenda IDs for this meeting
        const rows = await db
            .select({ agendaId: agendasRadir.agendaId })
            .from(agendasRadir)
            .where(eq(agendasRadir.meetingNumber, meetingNumber));

        const agendaIds = rows.map(r => r.agendaId);

        if (agendaIds.length > 0) {
            // Update agenda status to "Selesai"
            await db
                .update(agendas)
                .set({ status: "Selesai", updatedAt: new Date() })
                .where(inArray(agendas.id, agendaIds));
        }

        revalidatePath("/dashboard/pelaksanaan-rapat/radir");
        return { success: true, message: "Risalah telah diselesaikan." };
    } catch (error) {
        console.error("Error finalizeRisalahAction:", error);
        return { success: false, error: "Gagal menyelesaikan risalah." };
    }
}

// Update Meeting Number
export async function updateMeetingNumberAction(
    oldMeetingNumber: string,
    newMeetingNumber: string
) {
    try {
        if (!newMeetingNumber || newMeetingNumber.trim() === "") {
            return { success: false, error: "Nomor meeting tidak boleh kosong." };
        }

        // Check if new meeting number already exists (if different from old)
        if (oldMeetingNumber !== newMeetingNumber) {
            const existing = await db
                .select({ meetingNumber: agendasRadir.meetingNumber })
                .from(agendasRadir)
                .where(eq(agendasRadir.meetingNumber, newMeetingNumber))
                .limit(1);

            if (existing.length > 0) {
                return { success: false, error: "Nomor meeting sudah digunakan." };
            }
        }

        // Update all agendas with this meeting number
        await db
            .update(agendasRadir)
            .set({ meetingNumber: newMeetingNumber })
            .where(eq(agendasRadir.meetingNumber, oldMeetingNumber));

        revalidatePath("/dashboard/pelaksanaan-rapat/radir");
        revalidatePath(`/dashboard/pelaksanaan-rapat/radir/input/${encodeURIComponent(newMeetingNumber)}`);

        return { success: true, message: "Nomor meeting berhasil diubah." };
    } catch (error) {
        console.error("Error updateMeetingNumberAction:", error);
        return { success: false, error: "Gagal mengubah nomor meeting." };
    }
}

// Update Meeting Info (date, time, location, method, link)
export async function updateMeetingInfoAction(
    meetingNumber: string,
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
        // Update all agendas with this meeting number
        await db
            .update(agendasRadir)
            .set({
                executionDate: data.executionDate ?? undefined,
                startTime: data.startTime ?? undefined,
                endTime: data.endTime ?? undefined,
                meetingLocation: data.meetingLocation ?? undefined,
                meetingMethod: data.meetingMethod ?? undefined,
                meetingLink: data.meetingLink ?? undefined,
            })
            .where(eq(agendasRadir.meetingNumber, meetingNumber));

        revalidatePath("/dashboard/pelaksanaan-rapat/radir");
        revalidatePath(`/dashboard/pelaksanaan-rapat/radir/input/${encodeURIComponent(meetingNumber)}`);

        return { success: true, message: "Informasi rapat berhasil diperbarui." };
    } catch (error) {
        console.error("Error updateMeetingInfoAction:", error);
        return { success: false, error: "Gagal memperbarui informasi rapat." };
    }
}

// Remove agenda from meeting (clear meeting number and year)
export async function removeAgendaFromMeetingAction(agendaId: string, meetingNumber: string) {
    try {
        // Clear meeting number and year from this agenda
        await db
            .update(agendasRadir)
            .set({
                meetingNumber: null,
                meetingYear: null,
                // Also clear risalah data for this agenda
                pimpinanRapat: [],
                attendanceData: {},
                guestParticipants: [],
                executiveSummary: null,
                considerations: null,
                meetingDecisions: [],
                dissentingOpinion: null,
            })
            .where(eq(agendasRadir.agendaId, agendaId));

        // Update agenda status back to "Dijadwalkan"
        await db
            .update(agendas)
            .set({ status: "Dijadwalkan", updatedAt: new Date() })
            .where(eq(agendas.id, agendaId));

        revalidatePath(`/dashboard/pelaksanaan-rapat/radir/input/${encodeURIComponent(meetingNumber)}`);
        revalidatePath("/dashboard/pelaksanaan-rapat/radir");

        return { success: true, message: "Agenda berhasil dihapus dari risalah." };
    } catch (error) {
        console.error("Error removeAgendaFromMeetingAction:", error);
        return { success: false, error: "Gagal menghapus agenda dari risalah." };
    }
}
