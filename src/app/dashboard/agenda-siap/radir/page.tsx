import { Suspense } from "react";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { agendas, agendasRadir } from "@/db/schema";
import { eq, desc, sql, and, ne } from "drizzle-orm";
import { Separator } from "@/components/ui/separator";
import { AgendaMain } from "@/components/features/agenda-siap/radir/agenda-main";
import { AgendaRadirItem } from "@/types/agenda";

export const metadata: Metadata = {
    title: "Agenda Siap RADIR - Board Meeting PLN",
    description: "Daftar Agenda Rapat Direksi yang Siap Dijadwalkan",
};

async function getReadyAgendas(): Promise<AgendaRadirItem[]> {
    const rawData = await db
        .select({
            id: agendas.id,
            title: agendas.title,
            meetingType: agendas.meetingType,
            status: agendas.status,
            createdAt: agendas.createdAt,
            director: agendas.director,
            initiator: agendas.initiator,
            urgency: agendasRadir.urgency,
            executionDate: agendasRadir.executionDate,
            meetingNumber: agendasRadir.meetingNumber,
            contactPerson: agendas.contactPerson,
            position: agendas.position,
            phone: agendas.phone,
            notes: agendas.notes, // ✅ Tambahkan field notes
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
        .where(
            and(
                eq(agendas.meetingType, "RADIR"),
                // Filter hanya yang statusnya "Dapat Dilanjutkan" atau "Dijadwalkan"
                // Atau tampilkan semua kecuali Draft jika itu definisinya
                ne(agendas.status, "Draft")
            )
        )
        .orderBy(desc(agendas.createdAt));

    return rawData as unknown as AgendaRadirItem[];
}

export default async function AgendaSiapRadirPage() {
    const data = await getReadyAgendas();

    return (
        <div className="flex flex-col h-full space-y-6 p-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-1.5 self-stretch bg-emerald-600 rounded-full" />
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
                            Agenda Siap (RADIR)
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Daftar agenda yang telah diverifikasi dan siap untuk dijadwalkan atau ditindaklanjuti.
                        </p>
                    </div>
                </div>
            </div>

            <Separator />

            <Suspense fallback={<div className="p-10 text-center text-muted-foreground">Memuat data...</div>}>
                <AgendaMain initialData={data} />
            </Suspense>
        </div>
    );
}
