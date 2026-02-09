// src/app/dashboard/pelaksanaan-rapat/rakordir/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { getRakordirMeetings } from "@/server/actions/pelaksanaan-rakordir-actions";
import { MeetingsTable } from "@/components/features/pelaksanaan-rapat/rakordir/meetings-table";
import { CreateNotulensiDialog } from "@/components/features/pelaksanaan-rapat/rakordir/create-notulensi-dialog";

export const metadata: Metadata = {
    title: "Pelaksanaan Rapat RAKORDIR - Board Meeting PLN",
};

export default async function PelaksanaanRakordirPage() {
    const meetings = await getRakordirMeetings();

    return (
        <div className="flex flex-col h-full space-y-6 p-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-1.5 self-stretch bg-[#006070] rounded-full" />
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
                            Pelaksanaan Rapat (RAKORDIR)
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Kelola pelaksanaan rapat dan pembuatan notulensi.
                        </p>
                    </div>
                </div>
                <CreateNotulensiDialog />
            </div>

            <Separator />

            <Suspense fallback={<div className="p-10 text-center">Memuat data...</div>}>
                <MeetingsTable data={meetings} />
            </Suspense>
        </div>
    );
}
