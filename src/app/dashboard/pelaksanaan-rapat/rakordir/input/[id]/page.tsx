// src/app/dashboard/pelaksanaan-rapat/rakordir/input/[id]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNotulensiDetail } from "@/server/actions/pelaksanaan-rakordir-actions";
import { getUnitsByCategory } from "@/server/master-data-actions";
import { NotulensiInputForm } from "@/components/features/pelaksanaan-rapat/rakordir/notulensi-input-form";

export const metadata: Metadata = {
    title: "Input Notulensi - Board Meeting PLN",
    description: "Input dan kelola notulensi rapat koordinasi direksi",
};

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function NotulensiInputPage({ params }: PageProps) {
    const { id } = await params;
    const notulensiNumber = decodeURIComponent(id);

    // Fetch data in parallel
    const [notulensiData, directorOptions] = await Promise.all([
        getNotulensiDetail(notulensiNumber),
        getUnitsByCategory("DIREKTUR_PEMRAKARSA"),
    ]);

    if (!notulensiData) {
        notFound();
    }

    return (
        <div className="flex flex-col h-full space-y-6 p-8 animate-in fade-in duration-500">
            <NotulensiInputForm
                initialData={notulensiData}
                directorOptions={directorOptions}
            />
        </div>
    );
}
