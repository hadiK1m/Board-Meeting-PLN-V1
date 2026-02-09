// src/app/dashboard/pelaksanaan-rapat/radir/input/[id]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRisalahDetail } from "@/server/actions/pelaksanaan-rapat-actions";
import { getUnitsByCategory } from "@/server/master-data-actions";
import { RisalahInputForm } from "@/components/features/pelaksanaan-rapat/radir/risalah-input-form";

export const metadata: Metadata = {
    title: "Input Risalah - Board Meeting PLN",
    description: "Input dan kelola risalah rapat direksi",
};

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function RisalahInputPage({ params }: PageProps) {
    const { id } = await params;
    const meetingNumber = decodeURIComponent(id);

    // Fetch data in parallel
    const [risalahData, directorOptions] = await Promise.all([
        getRisalahDetail(meetingNumber),
        getUnitsByCategory("DIREKTUR_PEMRAKARSA"),
    ]);

    if (!risalahData) {
        notFound();
    }

    return (
        <div className="flex flex-col h-full space-y-6 p-8 animate-in fade-in duration-500">
            <RisalahInputForm
                initialData={risalahData}
                directorOptions={directorOptions}
            />
        </div>
    );
}
