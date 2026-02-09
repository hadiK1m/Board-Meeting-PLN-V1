import { Suspense } from "react";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { agendas, agendasRadir } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm"; // ✅ Tambahkan sql

import { Separator } from "@/components/ui/separator";

// Import Komponen Fitur (UI)
import { AgendaMain } from "@/components/features/agenda/radir/agenda-main";
import { AgendaRadirItem } from "@/types/agenda";

// --- IMPORT PENTING: MODAL & SERVER ACTIONS ---
import { AddRadirModal } from "@/components/features/agenda/radir/add-radir-modal";
import { getUnitsByCategory } from "@/server/master-data-actions"; // ✅ Import Action

export const metadata: Metadata = {
    title: "Agenda RADIR - Board Meeting PLN",
    description: "Manajemen Usulan Agenda Rapat Direksi",
};

// --- DATA FETCHING ---
async function getAllAgendas(): Promise<AgendaRadirItem[]> {
    const rawData = await db
        .select({
            id: agendas.id,
            title: agendas.title,
            meetingType: agendas.meetingType,
            status: agendas.status,
            createdAt: agendas.createdAt,
            director: agendas.director,
            initiator: agendas.initiator,


            // Data Child
            urgency: agendasRadir.urgency,
            executionDate: agendasRadir.executionDate,
            deadlineDate: agendasRadir.deadlineDate,
            meetingNumber: agendasRadir.meetingNumber,

            // Narahubung (Agar tidak error di Table/Edit Modal)
            contactPerson: agendas.contactPerson,
            position: agendas.position,
            phone: agendas.phone,

            // ✅ FIX: Mapping JSON Object untuk filePaths
            filePaths: sql<Record<string, string>>`json_build_object(
                'legalReview', ${agendasRadir.legalReview},
                'riskReview', ${agendasRadir.riskReview},
                'complianceReview', ${agendasRadir.complianceReview},
                'regulationReview', ${agendasRadir.regulationReview},
                'recommendationNote', ${agendasRadir.recommendationNote},
                'proposalNote', ${agendasRadir.proposalNote},
                'presentationMaterial', ${agendasRadir.presentationMaterial}
            )`,

            supportingFiles: agendasRadir.supportingDocuments
        })
        .from(agendas)
        .innerJoin(agendasRadir, eq(agendas.id, agendasRadir.agendaId))
        .where(eq(agendas.meetingType, "RADIR"))
        .orderBy(desc(agendas.createdAt));

    // Casting ke Tipe AgendaRadirItem
    return rawData as unknown as AgendaRadirItem[];
}

export default async function AgendaRadirPage() {
    // ✅ FETCHING PARALEL (Data Tabel + Data Master Dropdown)
    // Ini mencegah "Waterfall" dan mengisi Dropdown di Modal
    const [data, dirOptions, pemOptions, supOptions] = await Promise.all([
        getAllAgendas(),
        getUnitsByCategory("DIREKTUR_PEMRAKARSA"),
        getUnitsByCategory("PEMRAKARSA"),
        getUnitsByCategory("SUPPORT")
    ]);

    return (
        <div className="flex flex-col h-full space-y-6 p-8 animate-in fade-in duration-500">
            {/* --- HEADER --- */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-1.5 self-stretch bg-[#006070] rounded-full" />
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
                            Rapat Direksi (RADIR)
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Kelola usulan agenda rapat direksi, jadwal, dan status persetujuan.
                        </p>
                    </div>
                </div>

                {/* --- BAGIAN TOMBOL --- */}
                <div className="flex items-center gap-2">
                    {/* ✅ Masukkan Data Options yang sudah di-fetch ke Props Modal */}
                    <AddRadirModal
                        dirOptions={dirOptions}
                        pemOptions={pemOptions}
                        supOptions={supOptions}
                    />
                </div>
            </div>

            <Separator />

            <Suspense fallback={<div className="p-10 text-center text-muted-foreground">Memuat data...</div>}>
                <AgendaMain initialData={data} />
            </Suspense>
        </div>
    );
}