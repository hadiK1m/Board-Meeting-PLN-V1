// src/server/actions/dashboard-actions.ts
"use server";

import { db } from "@/lib/db";
import { agendas, agendasRadir, agendasRakordir } from "@/db/schema";
import { eq, and, isNotNull, sql } from "drizzle-orm";

// Tipe data untuk Decision Item (RADIR)
type DecisionItem = {
    decision: string;
    output: string;
    progressTerkini: string;
    status?: string;
    evidence: string;
    statusMonev?: string;
};

// Tipe data untuk Arahan Item (RAKORDIR)
type ArahanItem = {
    arahan: string;
    targetOutput: string;
    progresTerkini: string;
    statusPenyelesaian?: string;
    evidence: string;
};

export type StatusSummary = {
    draft: number;
    canProceed: number;
    scheduled: number;
    postponed: number;
    completed: number;
    cancelled: number;
    total: number;
};

export type MonevProgress = {
    inProgress: number;
    completed: number;
    total: number;
    inProgressPercentage: number;
    completedPercentage: number;
};

export type DashboardCategoryData = {
    category: "RADIR" | "RAKORDIR";
    categoryLabel: string;
    statusSummary: StatusSummary;
    monevProgress: MonevProgress;
};

// Map status database ke kategori
function mapStatus(status: string): keyof StatusSummary | null {
    const normalized = status.toLowerCase().trim();

    if (normalized === "draft") return "draft";
    if (normalized === "dapat dilanjutkan" || normalized === "can proceed") return "canProceed";
    if (normalized === "dijadwalkan" || normalized === "scheduled") return "scheduled";
    if (normalized === "ditunda" || normalized === "postponed") return "postponed";
    if (normalized === "selesai" || normalized === "completed") return "completed";
    if (normalized === "dibatalkan" || normalized === "cancelled") return "cancelled";

    return null;
}

export async function getDashboardData(): Promise<DashboardCategoryData[]> {
    try {
        // Fetch RADIR data
        const radirAgendas = await db
            .select({
                id: agendas.id,
                status: agendas.status,
                meetingNumber: agendasRadir.meetingNumber,
                meetingDecisions: agendasRadir.meetingDecisions,
            })
            .from(agendas)
            .leftJoin(agendasRadir, eq(agendasRadir.agendaId, agendas.id))
            .where(eq(agendas.meetingType, "RADIR"));

        // Fetch RAKORDIR data
        const rakordirAgendas = await db
            .select({
                id: agendas.id,
                status: agendas.status,
                notulensiNumber: agendasRakordir.notulensiNumber,
                arahanDireksi: agendasRakordir.arahanDireksi,
            })
            .from(agendas)
            .leftJoin(agendasRakordir, eq(agendasRakordir.agendaId, agendas.id))
            .where(eq(agendas.meetingType, "RAKORDIR"));

        // Calculate RADIR status summary
        const radirStatusSummary: StatusSummary = {
            draft: 0,
            canProceed: 0,
            scheduled: 0,
            postponed: 0,
            completed: 0,
            cancelled: 0,
            total: radirAgendas.length,
        };

        let radirMonevInProgress = 0;
        let radirMonevCompleted = 0;
        let radirMonevTotal = 0;

        for (const agenda of radirAgendas) {
            const statusKey = mapStatus(agenda.status);
            if (statusKey && statusKey !== "total") {
                radirStatusSummary[statusKey]++;
            }

            // Count monev progress (only for agendas with meeting number)
            if (agenda.meetingNumber) {
                const decisions = (agenda.meetingDecisions as DecisionItem[]) || [];
                for (const decision of decisions) {
                    radirMonevTotal++;
                    const isCompleted = decision.status === "selesai" ||
                        decision.statusMonev === "selesai" ||
                        decision.statusMonev === "Selesai";
                    if (isCompleted) {
                        radirMonevCompleted++;
                    } else {
                        radirMonevInProgress++;
                    }
                }
            }
        }

        // Calculate RAKORDIR status summary
        const rakordirStatusSummary: StatusSummary = {
            draft: 0,
            canProceed: 0,
            scheduled: 0,
            postponed: 0,
            completed: 0,
            cancelled: 0,
            total: rakordirAgendas.length,
        };

        let rakordirMonevInProgress = 0;
        let rakordirMonevCompleted = 0;
        let rakordirMonevTotal = 0;

        for (const agenda of rakordirAgendas) {
            const statusKey = mapStatus(agenda.status);
            if (statusKey && statusKey !== "total") {
                rakordirStatusSummary[statusKey]++;
            }

            // Count monev progress (only for agendas with notulensi number)
            if (agenda.notulensiNumber) {
                const arahanList = (agenda.arahanDireksi as ArahanItem[]) || [];
                for (const arahan of arahanList) {
                    rakordirMonevTotal++;
                    const isCompleted = arahan.statusPenyelesaian === "selesai" ||
                        arahan.statusPenyelesaian === "Selesai";
                    if (isCompleted) {
                        rakordirMonevCompleted++;
                    } else {
                        rakordirMonevInProgress++;
                    }
                }
            }
        }

        return [
            {
                category: "RAKORDIR",
                categoryLabel: "Rapat Koordinasi Direksi",
                statusSummary: rakordirStatusSummary,
                monevProgress: {
                    inProgress: rakordirMonevInProgress,
                    completed: rakordirMonevCompleted,
                    total: rakordirMonevTotal,
                    inProgressPercentage: rakordirMonevTotal > 0
                        ? Math.round((rakordirMonevInProgress / rakordirMonevTotal) * 100)
                        : 0,
                    completedPercentage: rakordirMonevTotal > 0
                        ? Math.round((rakordirMonevCompleted / rakordirMonevTotal) * 100)
                        : 0,
                },
            },
            {
                category: "RADIR",
                categoryLabel: "Rapat Direksi",
                statusSummary: radirStatusSummary,
                monevProgress: {
                    inProgress: radirMonevInProgress,
                    completed: radirMonevCompleted,
                    total: radirMonevTotal,
                    inProgressPercentage: radirMonevTotal > 0
                        ? Math.round((radirMonevInProgress / radirMonevTotal) * 100)
                        : 0,
                    completedPercentage: radirMonevTotal > 0
                        ? Math.round((radirMonevCompleted / radirMonevTotal) * 100)
                        : 0,
                },
            },
        ];
    } catch (error) {
        console.error("Error getDashboardData:", error);
        return [];
    }
}

// Type for agenda list item
export type AgendaListItem = {
    id: string;
    title: string;
    director: string | null;
    initiator: string | null;
    status: string;
    createdAt: Date;
    executionDate: string | null;
    meetingNumber: string | null;
};

// Map status key ke status database
function mapStatusKeyToDbStatus(statusKey: string): string[] {
    switch (statusKey) {
        case "draft":
            return ["Draft"];
        case "canProceed":
            return ["Dapat Dilanjutkan", "Can Proceed"];
        case "scheduled":
            return ["Dijadwalkan", "Scheduled"];
        case "postponed":
            return ["Ditunda", "Postponed"];
        case "completed":
            return ["Selesai", "Completed"];
        case "cancelled":
            return ["Dibatalkan", "Cancelled"];
        default:
            return [];
    }
}

export async function getAgendasByStatusAndCategory(
    statusKey: string,
    category: "RADIR" | "RAKORDIR"
): Promise<AgendaListItem[]> {
    try {
        const dbStatuses = mapStatusKeyToDbStatus(statusKey);

        if (dbStatuses.length === 0) {
            return [];
        }

        if (category === "RADIR") {
            const results = await db
                .select({
                    id: agendas.id,
                    title: agendas.title,
                    director: agendas.director,
                    initiator: agendas.initiator,
                    status: agendas.status,
                    createdAt: agendas.createdAt,
                    executionDate: agendasRadir.executionDate,
                    meetingNumber: agendasRadir.meetingNumber,
                })
                .from(agendas)
                .leftJoin(agendasRadir, eq(agendasRadir.agendaId, agendas.id))
                .where(
                    and(
                        eq(agendas.meetingType, "RADIR"),
                        sql`${agendas.status} IN (${sql.join(dbStatuses.map(s => sql`${s}`), sql`, `)})`
                    )
                );

            return results.map(r => ({
                id: r.id,
                title: r.title,
                director: r.director,
                initiator: r.initiator,
                status: r.status,
                createdAt: r.createdAt,
                executionDate: r.executionDate,
                meetingNumber: r.meetingNumber,
            }));
        } else {
            const results = await db
                .select({
                    id: agendas.id,
                    title: agendas.title,
                    director: agendas.director,
                    initiator: agendas.initiator,
                    status: agendas.status,
                    createdAt: agendas.createdAt,
                    executionDate: agendasRakordir.executionDate,
                    meetingNumber: agendasRakordir.notulensiNumber,
                })
                .from(agendas)
                .leftJoin(agendasRakordir, eq(agendasRakordir.agendaId, agendas.id))
                .where(
                    and(
                        eq(agendas.meetingType, "RAKORDIR"),
                        sql`${agendas.status} IN (${sql.join(dbStatuses.map(s => sql`${s}`), sql`, `)})`
                    )
                );

            return results.map(r => ({
                id: r.id,
                title: r.title,
                director: r.director,
                initiator: r.initiator,
                status: r.status,
                createdAt: r.createdAt,
                executionDate: r.executionDate,
                meetingNumber: r.meetingNumber,
            }));
        }
    } catch (error) {
        console.error("Error getAgendasByStatusAndCategory:", error);
        return [];
    }
}

// Type for attendance data
type AttendanceRecord = Record<string, { status: string; kuasaTo?: string }>;

export type DirectorAttendanceData = {
    name: string;
    hadir: number;
    tidakHadir: number;
    kuasa: number;
    totalMeetings: number;
};

export type AttendancePeriod = "3m" | "6m" | "1y";

// Urutan resmi 11 Direksi PLN (Dirut harus urutan pertama)
const DIRECTOR_ORDER = [
    "DIREKTUR UTAMA (DIRUT)",
    "DIREKTUR LEGAL DAN MANAJEMEN HUMAN CAPITAL (DIR LHC)",
    "DIREKTUR KEUANGAN (DIR KEU)",
    "DIREKTUR DISTRIBUSI (DIR DIST)",
    "DIREKTUR RETAIL DAN NIAGA (DIR RETAIL)",
    "DIREKTUR MANAJEMEN PROYEK DAN ENERGI BARU TERBARUKAN (DIR EBT)",
    "DIREKTUR PERENCANAAN KORPORAT DAN PENGEMBANGAN BISNIS (DIR RENBANG)",
    "DIREKTUR TRANSMISI DAN PERENCANAAN SISTEM (DIR TRANS)",
    "DIREKTUR MANAJEMEN PEMBANGKITAN (DIR MKIT)",
    "DIREKTUR MANAJEMEN RISIKO (DIR MRO)",
    "DIREKTUR TEKNOLOGI, ENGINEERING, DAN KEBERLANJUTAN (DIR TNK)"
];

// Nama singkat untuk tampilan chart
const DIRECTOR_SHORT_NAMES: Record<string, string> = {
    "DIREKTUR UTAMA (DIRUT)": "DIRUT",
    "DIREKTUR LEGAL DAN MANAJEMEN HUMAN CAPITAL (DIR LHC)": "DIR LHC",
    "DIREKTUR KEUANGAN (DIR KEU)": "DIR KEU",
    "DIREKTUR DISTRIBUSI (DIR DIST)": "DIR DIST",
    "DIREKTUR RETAIL DAN NIAGA (DIR RETAIL)": "DIR RETAIL",
    "DIREKTUR MANAJEMEN PROYEK DAN ENERGI BARU TERBARUKAN (DIR EBT)": "DIR EBT",
    "DIREKTUR PERENCANAAN KORPORAT DAN PENGEMBANGAN BISNIS (DIR RENBANG)": "DIR RENBANG",
    "DIREKTUR TRANSMISI DAN PERENCANAAN SISTEM (DIR TRANS)": "DIR TRANS",
    "DIREKTUR MANAJEMEN PEMBANGKITAN (DIR MKIT)": "DIR MKIT",
    "DIREKTUR MANAJEMEN RISIKO (DIR MRO)": "DIR MRO",
    "DIREKTUR TEKNOLOGI, ENGINEERING, DAN KEBERLANJUTAN (DIR TNK)": "DIR TNK"
};

export async function getDirectorAttendanceData(period: AttendancePeriod = "6m"): Promise<DirectorAttendanceData[]> {
    try {
        // Calculate date filter based on period
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case "3m":
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                break;
            case "6m":
                startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                break;
            case "1y":
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        }

        const startDateStr = startDate.toISOString().split("T")[0];

        // Fetch all RADIR agendas with attendance data within period (only completed/selesai)
        const radirMeetings = await db
            .select({
                meetingNumber: agendasRadir.meetingNumber,
                executionDate: agendasRadir.executionDate,
                attendanceData: agendasRadir.attendanceData,
            })
            .from(agendasRadir)
            .innerJoin(agendas, eq(agendasRadir.agendaId, agendas.id))
            .where(
                and(
                    eq(agendas.meetingType, "RADIR"),
                    eq(agendas.status, "Selesai"),
                    isNotNull(agendasRadir.meetingNumber),
                    sql`${agendasRadir.meetingNumber} <> ''`,
                    sql`${agendasRadir.executionDate} >= ${startDateStr}`
                )
            );

        // Get unique meetings (by meetingNumber) to avoid counting same meeting multiple times
        const uniqueMeetings = new Map<string, AttendanceRecord>();
        for (const meeting of radirMeetings) {
            if (meeting.meetingNumber && meeting.attendanceData) {
                // Only store first occurrence of each meeting number
                if (!uniqueMeetings.has(meeting.meetingNumber)) {
                    uniqueMeetings.set(meeting.meetingNumber, meeting.attendanceData as AttendanceRecord);
                }
            }
        }

        // Aggregate attendance per director
        const directorStats = new Map<string, { hadir: number; tidakHadir: number; kuasa: number }>();

        // Initialize all 11 directors with zero counts (to ensure all are included)
        for (const director of DIRECTOR_ORDER) {
            directorStats.set(director, { hadir: 0, tidakHadir: 0, kuasa: 0 });
        }

        for (const [, attendanceData] of uniqueMeetings) {
            for (const [directorName, attendance] of Object.entries(attendanceData)) {
                // Match director name to official list (case-insensitive)
                const matchedDirector = DIRECTOR_ORDER.find(
                    d => d.toLowerCase() === directorName.toLowerCase()
                );

                const key = matchedDirector || directorName;

                if (!directorStats.has(key)) {
                    directorStats.set(key, { hadir: 0, tidakHadir: 0, kuasa: 0 });
                }

                const stats = directorStats.get(key)!;
                const status = attendance.status?.toLowerCase() || "";

                if (status === "hadir") {
                    stats.hadir++;
                } else if (status === "tidak hadir") {
                    stats.tidakHadir++;
                } else if (status === "kuasa") {
                    stats.kuasa++;
                }
            }
        }

        const totalMeetings = uniqueMeetings.size;

        // Convert to array and sort by official DIRECTOR_ORDER (Dirut first)
        const result: DirectorAttendanceData[] = DIRECTOR_ORDER
            .filter(director => directorStats.has(director))
            .map(director => {
                const stats = directorStats.get(director)!;
                const shortName = DIRECTOR_SHORT_NAMES[director] || director;
                return {
                    name: shortName,
                    hadir: stats.hadir,
                    tidakHadir: stats.tidakHadir,
                    kuasa: stats.kuasa,
                    totalMeetings,
                };
            });

        return result;
    } catch (error) {
        console.error("Error getDirectorAttendanceData:", error);
        return [];
    }
}

// Type for all agendas list (untuk tabel daftar seluruh agenda)
export type AllAgendaItem = {
    id: string;
    title: string;
    meetingType: "RADIR" | "RAKORDIR";
    status: string;
    statusKey: string;
    monevStatus: string;
    contactPerson: string | null;
    phone: string | null;
    createdAt: Date;
};

// Hitung status monev dari decisions/arahan
function calculateMonevStatus(
    decisions: DecisionItem[] | null,
    arahan: ArahanItem[] | null
): string {
    const items = decisions || arahan || [];
    if (items.length === 0) return "Belum Ada";

    let completedCount = 0;
    for (const item of items) {
        // Check for RADIR decisions
        if ('statusMonev' in item) {
            const status = (item.statusMonev || item.status || "").toLowerCase();
            if (status === "selesai") completedCount++;
        }
        // Check for RAKORDIR arahan
        if ('statusPenyelesaian' in item) {
            const status = (item.statusPenyelesaian || "").toLowerCase();
            if (status === "selesai") completedCount++;
        }
    }

    if (completedCount === items.length) return "Selesai";
    if (completedCount > 0) return "Sebagian Selesai";
    return "Dalam Proses";
}

// Map status database ke status key
function mapStatusToKey(status: string): string {
    const normalized = status.toLowerCase().trim();
    if (normalized === "draft") return "draft";
    if (normalized === "dapat dilanjutkan" || normalized === "can proceed") return "canProceed";
    if (normalized === "dijadwalkan" || normalized === "scheduled") return "scheduled";
    if (normalized === "ditunda" || normalized === "postponed") return "postponed";
    if (normalized === "selesai" || normalized === "completed") return "completed";
    if (normalized === "dibatalkan" || normalized === "cancelled") return "cancelled";
    return "draft";
}

export async function getAllAgendas(): Promise<AllAgendaItem[]> {
    try {
        // Fetch RADIR agendas
        const radirResults = await db
            .select({
                id: agendas.id,
                title: agendas.title,
                meetingType: agendas.meetingType,
                status: agendas.status,
                contactPerson: agendas.contactPerson,
                phone: agendas.phone,
                createdAt: agendas.createdAt,
                meetingNumber: agendasRadir.meetingNumber,
                meetingDecisions: agendasRadir.meetingDecisions,
            })
            .from(agendas)
            .leftJoin(agendasRadir, eq(agendasRadir.agendaId, agendas.id))
            .where(eq(agendas.meetingType, "RADIR"));

        // Fetch RAKORDIR agendas
        const rakordirResults = await db
            .select({
                id: agendas.id,
                title: agendas.title,
                meetingType: agendas.meetingType,
                status: agendas.status,
                contactPerson: agendas.contactPerson,
                phone: agendas.phone,
                createdAt: agendas.createdAt,
                notulensiNumber: agendasRakordir.notulensiNumber,
                arahanDireksi: agendasRakordir.arahanDireksi,
            })
            .from(agendas)
            .leftJoin(agendasRakordir, eq(agendasRakordir.agendaId, agendas.id))
            .where(eq(agendas.meetingType, "RAKORDIR"));

        // Transform RADIR results
        const radirAgendas: AllAgendaItem[] = radirResults.map(r => {
            const hasNumber = r.meetingNumber && r.meetingNumber.trim() !== "";
            const decisions = hasNumber ? (r.meetingDecisions as DecisionItem[] | null) : null;

            return {
                id: r.id,
                title: r.title,
                meetingType: "RADIR" as const,
                status: r.status,
                statusKey: mapStatusToKey(r.status),
                monevStatus: hasNumber ? calculateMonevStatus(decisions, null) : "-",
                contactPerson: r.contactPerson,
                phone: r.phone,
                createdAt: r.createdAt,
            };
        });

        // Transform RAKORDIR results
        const rakordirAgendas: AllAgendaItem[] = rakordirResults.map(r => {
            const hasNumber = r.notulensiNumber && r.notulensiNumber.trim() !== "";
            const arahan = hasNumber ? (r.arahanDireksi as ArahanItem[] | null) : null;

            return {
                id: r.id,
                title: r.title,
                meetingType: "RAKORDIR" as const,
                status: r.status,
                statusKey: mapStatusToKey(r.status),
                monevStatus: hasNumber ? calculateMonevStatus(null, arahan) : "-",
                contactPerson: r.contactPerson,
                phone: r.phone,
                createdAt: r.createdAt,
            };
        });

        // Combine and sort by createdAt descending
        const allAgendas = [...radirAgendas, ...rakordirAgendas].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return allAgendas;
    } catch (error) {
        console.error("Error getAllAgendas:", error);
        return [];
    }
}
