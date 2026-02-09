// src/app/monev/radir/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { getMonevRadirData } from "@/server/actions/monev-radir-actions";
import { MonevTable } from "@/components/features/monev/radir/monev-table";
import { ClipboardCheck } from "lucide-react";

export const metadata: Metadata = {
    title: "Monitoring & Evaluasi RADIR - Board Meeting PLN",
};

export default async function MonevRadirPage() {
    const data = await getMonevRadirData();

    return (
        <div className="flex flex-col h-full space-y-6 p-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-1.5 self-stretch bg-[#125d72] rounded-full" />
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-none flex items-center gap-2">
                            <ClipboardCheck className="h-6 w-6 text-[#125d72]" />
                            Monitoring & Evaluasi (RADIR)
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Pantau dan evaluasi tindak lanjut keputusan rapat direksi.
                        </p>
                    </div>
                </div>
            </div>

            <Separator />

            <Suspense fallback={<div className="p-10 text-center">Memuat data...</div>}>
                <MonevTable data={data} />
            </Suspense>
        </div>
    );
}
