// SKELETON: Loading UI

import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function AgendaRadirLoading() {
    return (
        <div className="flex flex-col h-full space-y-6 p-8">
            {/* --- HEADER SKELETON --- */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-62.5" /> {/* Title */}
                    <Skeleton className="h-4 w-100" /> {/* Description */}
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-35" /> {/* Add Button */}
                </div>
            </div>

            <Separator />

            {/* --- TOOLBAR SKELETON --- */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-2">
                <div className="flex flex-1 items-center space-x-2">
                    <Skeleton className="h-9 w-full max-w-sm" /> {/* Search Input */}
                    <Skeleton className="h-9 w-24" /> {/* Filter Status */}
                    <Skeleton className="h-9 w-32" /> {/* Filter Date */}
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-16" /> {/* View Toggle */}
                </div>
            </div>

            {/* --- CONTENT SKELETON (Simulasi Tabel) --- */}
            <div className="flex-1 overflow-hidden rounded-md border bg-white shadow-sm">
                {/* Table Header Mockup */}
                <div className="flex items-center gap-4 border-b bg-slate-50 p-4">
                    <Skeleton className="h-4 w-[40%]" />
                    <Skeleton className="h-4 w-[15%]" />
                    <Skeleton className="h-4 w-[15%]" />
                    <Skeleton className="h-4 w-[10%]" />
                    <Skeleton className="h-4 w-[5%] ml-auto" />
                </div>

                {/* Table Rows Mockup */}
                <div className="p-2 space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-transparent hover:border-slate-100">
                            <div className="flex flex-col gap-2 w-[40%]">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                            <Skeleton className="h-6 w-[15%] rounded-full" /> {/* Status Badge */}
                            <Skeleton className="h-4 w-[15%]" /> {/* Date */}
                            <Skeleton className="h-4 w-[10%]" /> {/* Urgency */}
                            <Skeleton className="h-8 w-8 ml-auto rounded-md" /> {/* Action Button */}
                        </div>
                    ))}
                </div>
            </div>

            {/* --- FOOTER SKELETON --- */}
            <div className="flex items-center justify-between px-2">
                <Skeleton className="h-4 w-40" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                </div>
            </div>
        </div>
    );
}