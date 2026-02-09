import { Suspense } from "react";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { agendas, agendasRakordir } from "@/db/schema";
import { eq, desc, sql, and, ne } from "drizzle-orm";
import { Separator } from "@/components/ui/separator";
import { AgendaMain } from "@/components/features/agenda-siap/rakordir/agenda-main";
import { AgendaRadirItem } from "@/types/agenda";

export const metadata: Metadata = {
    title: "Agenda Siap RAKORDIR - Board Meeting PLN",
    description: "Daftar Agenda Rapat Koordinasi Direksi yang Siap Dijadwalkan",
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
            urgency: agendasRakordir.urgency,
            executionDate: agendasRakordir.executionDate,
            deadlineDate: agendasRakordir.deadlineDate, // Tambahkan ini
            // meetingNumber: agendasRakordir.meetingNumber, // RAKORDIR tidak punya meetingNumber di schema
            contactPerson: agendas.contactPerson,
            position: agendas.position,
            phone: agendas.phone,
            notes: agendas.notes,
            filePaths: sql<Record<string, string>>`json_build_object(
                'proposalNote', ${agendasRakordir.proposalNote},
                'presentationMaterial', ${agendasRakordir.presentationMaterial}
            )`,
            supportingFiles: agendasRakordir.supportingDocuments
        })
        .from(agendas)
        .innerJoin(agendasRakordir, eq(agendas.id, agendasRakordir.agendaId))
        .where(
            and(
                eq(agendas.meetingType, "RAKORDIR"),
                ne(agendas.status, "Draft")
            )
        )
        .orderBy(desc(agendas.createdAt));

    return rawData as unknown as AgendaRadirItem[];
}

export default async function AgendaSiapRakordirPage() {
    const data = await getReadyAgendas();

    return (
        <div className="flex flex-col h-full space-y-6 p-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-1.5 self-stretch bg-emerald-600 rounded-full" />
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
                            Agenda Siap (RAKORDIR)
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
