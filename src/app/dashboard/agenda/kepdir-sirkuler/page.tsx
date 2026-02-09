import { Suspense } from "react";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { agendas, agendasRadir } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { Separator } from "@/components/ui/separator";
import { AgendaMain } from "@/components/features/agenda/kepdir-sirkuler/agenda-main";
import { AgendaRadirItem } from "@/types/agenda";
import { AddKepdirModal } from "@/components/features/agenda/kepdir-sirkuler/add-kepdir-modal";
import { getUnitsByCategory } from "@/server/master-data-actions";

export const metadata: Metadata = {
    title: "Agenda Kepdir Sirkuler - Board Meeting PLN",
    description: "Manajemen Usulan Agenda Keputusan Direksi Sirkuler",
};

async function getAllKepdir(): Promise<AgendaRadirItem[]> {
    const rawData = await db
        .select({
            id: agendas.id,
            title: agendas.title,
            meetingType: agendas.meetingType,
            status: agendas.status,
            createdAt: agendas.createdAt,
            director: agendas.director,
            initiator: agendas.initiator,
            contactPerson: agendas.contactPerson,
            position: agendas.position,
            phone: agendas.phone,

            // ✅ Mapping File
            filePaths: sql<Record<string, string>>`json_build_object(
                'kepdirFile', ${agendasRadir.proposalNote},
                'grcFile', ${agendasRadir.riskReview}
            )`,

            supportingFiles: agendasRadir.supportingDocuments
        })
        .from(agendas)
        .innerJoin(agendasRadir, eq(agendas.id, agendasRadir.agendaId))
        .where(eq(agendas.meetingType, "KEPDIR_SIRKULER")) // ✅ Filter KEPDIR
        .orderBy(desc(agendas.createdAt));

    return rawData as unknown as AgendaRadirItem[];
}

export default async function AgendaKepdirPage() {
    const [data, dirOptions, pemOptions] = await Promise.all([
        getAllKepdir(),
        getUnitsByCategory("DIREKTUR_PEMRAKARSA"),
        getUnitsByCategory("PEMRAKARSA")
    ]);

    return (
        <div className="flex flex-col h-full space-y-6 p-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-1.5 self-stretch bg-[#006070] rounded-full" />
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
                            Keputusan Direksi Sirkuler
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Kelola usulan agenda keputusan direksi sirkuler dan status persetujuan.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <AddKepdirModal dirOptions={dirOptions} pemOptions={pemOptions} />
                </div>
            </div>
            <Separator />
            <Suspense fallback={<div className="p-10 text-center text-muted-foreground">Memuat data...</div>}>
                <AgendaMain initialData={data} />
            </Suspense>
        </div>
    );
}
