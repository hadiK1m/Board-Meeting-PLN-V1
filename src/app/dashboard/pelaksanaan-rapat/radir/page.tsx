// src/app/dashboard/pelaksanaan-rapat/radir/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { getRadirMeetings } from "@/server/actions/pelaksanaan-rapat-actions";
import { MeetingsTable } from "@/components/features/pelaksanaan-rapat/radir/meetings-table";
import { CreateRisalahDialog } from "@/components/features/pelaksanaan-rapat/radir/create-risalah-dialog";

export const metadata: Metadata = {
    title: "Pelaksanaan Rapat - Board Meeting PLN",
};

export default async function PelaksanaanRapatPage() {
    const meetings = await getRadirMeetings();

    return (
        <div className="flex flex-col h-full space-y-6 p-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-1.5 self-stretch bg-[#006070] rounded-full" />
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
                            Pelaksanaan Rapat (RADIR)
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Kelola pelaksanaan rapat dan pembuatan risalah.
                        </p>
                    </div>
                </div>
                <CreateRisalahDialog />
            </div>

            <Separator />

            <Suspense fallback={<div className="p-10 text-center">Memuat data...</div>}>
                <MeetingsTable data={meetings} />
            </Suspense>
        </div>
    );
}
