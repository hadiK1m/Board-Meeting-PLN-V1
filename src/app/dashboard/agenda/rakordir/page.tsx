import { Suspense } from "react";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { agendas, agendasRakordir } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { Separator } from "@/components/ui/separator";
import { AgendaMain } from "@/components/features/agenda/rakordir/agenda-main";
import { AgendaRadirItem } from "@/types/agenda";
import { AddRakordirModal } from "@/components/features/agenda/rakordir/add-rakordir-modal";
import { getUnitsByCategory } from "@/server/master-data-actions";

export const metadata: Metadata = {
    title: "Agenda RAKORDIR - Board Meeting PLN",
    description: "Manajemen Usulan Agenda Rapat Koordinasi Direksi",
};

async function getAllRakordir(): Promise<AgendaRadirItem[]> {
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
            deadlineDate: agendasRakordir.deadlineDate,
            // meetingNumber: agendasRakordir.meetingNumber, // RAKORDIR tidak punya meetingNumber di schema
            contactPerson: agendas.contactPerson,
            position: agendas.position,
            phone: agendas.phone,

            // ✅ Hanya ambil file relevan
            filePaths: sql<Record<string, string>>`json_build_object(
                'proposalNote', ${agendasRakordir.proposalNote},
                'presentationMaterial', ${agendasRakordir.presentationMaterial}
            )`,

            supportingFiles: agendasRakordir.supportingDocuments
        })
        .from(agendas)
        .innerJoin(agendasRakordir, eq(agendas.id, agendasRakordir.agendaId))
        .where(eq(agendas.meetingType, "RAKORDIR")) // ✅ Filter RAKORDIR
        .orderBy(desc(agendas.createdAt));

    return rawData as unknown as AgendaRadirItem[];
}

export default async function AgendaRakordirPage() {
    const [data, dirOptions, pemOptions, supOptions] = await Promise.all([
        getAllRakordir(),
        getUnitsByCategory("DIREKTUR_PEMRAKARSA"),
        getUnitsByCategory("PEMRAKARSA"),
        getUnitsByCategory("SUPPORT")
    ]);

    return (
        <div className="flex flex-col h-full space-y-6 p-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-1.5 self-stretch bg-[#006070] rounded-full" />
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
                            Rapat Koordinasi Direksi (RAKORDIR)
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Kelola usulan agenda rapat koordinasi direksi, jadwal, dan status persetujuan.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <AddRakordirModal dirOptions={dirOptions} pemOptions={pemOptions} supOptions={supOptions} />
                </div>
            </div>
            <Separator />
            <Suspense fallback={<div className="p-10 text-center text-muted-foreground">Memuat data...</div>}>
                <AgendaMain initialData={data} />
            </Suspense>
        </div>
    );
}
