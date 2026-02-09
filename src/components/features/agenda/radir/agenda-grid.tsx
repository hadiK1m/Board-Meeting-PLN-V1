/* eslint-disable @typescript-eslint/no-explicit-any */
// CLIENT COMPONENT: Grid/Card View

"use client";
import { useState, useEffect } from "react";

import { AgendaRadirItem } from "@/types/agenda";
import { format, differenceInDays } from "date-fns"; // Import differenceInDays
import { id } from "date-fns/locale";
import {
    Calendar,
    MoreHorizontal,
    Hash,
    AlertCircle,
    Clock,
    MinusCircle,
} from "lucide-react";

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AgendaGridProps {
    data: AgendaRadirItem[];
}

// Helper untuk warna status
const getStatusColor = (status: string) => {
    switch (status) {
        case "Selesai": return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "Dijadwalkan": return "bg-blue-50 text-blue-700 border-blue-200";
        case "Dapat Dilanjutkan": return "bg-indigo-50 text-indigo-700 border-indigo-200";
        case "Ditunda": return "bg-orange-50 text-orange-700 border-orange-200";
        case "Dibatalkan": return "bg-red-50 text-red-700 border-red-200";
        default: return "bg-slate-50 text-slate-700 border-slate-200"; // Draft
    }
};

// --- Helper Hitung Prioritas Otomatis (Sama dengan columns.tsx) ---
const getAutomaticPriority = (dateStr: string | null) => {
    if (!dateStr) return { label: "Unknown", color: "text-slate-400 bg-slate-50 border-slate-100" };

    const today = new Date();
    const deadline = new Date(dateStr);
    const daysLeft = differenceInDays(deadline, today);

    if (daysLeft < 0) return { label: "-", color: "text-slate-400 bg-slate-100 border-slate-200" };
    if (daysLeft <= 7) return { label: "High", color: "text-red-700 bg-red-50 border-red-200 font-bold" };
    if (daysLeft <= 14) return { label: "Medium", color: "text-orange-700 bg-orange-50 border-orange-200" };

    return { label: "Low", color: "text-green-700 bg-green-50 border-green-200" };
};

function AgendaCard({ agenda }: { agenda: AgendaRadirItem }) {
    const [priority, setPriority] = useState<{ label: string; color: string } | null>(null);

    // Extract complex expression to variable to satisfy ESLint
    const deadlineDate = (agenda as any).deadlineDate || (agenda as any).deadline_date || null;

    useEffect(() => {
        // This effect runs only on the client, after hydration
        setPriority(getAutomaticPriority(deadlineDate));
    }, [deadlineDate]);

    return (
        <Card
            key={agenda.id}
            className="group hover:shadow-md transition-all duration-200 border-slate-200 hover:border-[#006070]/30"
        >
            {/* --- HEADER KARTU --- */}
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1.5 flex-1 mr-2">
                    <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0.5 h-6 ${getStatusColor(agenda.status)}`}
                    >
                        {agenda.status}
                    </Badge>
                    <h3 className="font-bold text-sm leading-tight text-slate-800 line-clamp-2 min-h-10" title={agenda.title}>
                        {agenda.title}
                    </h3>
                </div>

                {/* Action Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi Agenda</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(agenda.id)}>
                            Salin ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Lihat Detail</DropdownMenuItem>
                        <DropdownMenuItem>Ubah Status</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                            Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>

            {/* --- ISI KARTU (Metadata) --- */}
            <CardContent className="p-4 pt-2 space-y-2.5">
                {/* Meeting Number */}
                <div className="flex items-center text-xs text-muted-foreground">
                    <Hash className="mr-2 h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono">
                        {agenda.meetingNumber ? `#${agenda.meetingNumber}` : "-"}
                    </span>
                </div>

                {/* Execution Date */}
                <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="mr-2 h-3.5 w-3.5 text-slate-400" />
                    <span>
                        {deadlineDate
                            ? format(new Date(deadlineDate), "EEEE, dd MMMM yyyy", { locale: id })
                            : "Belum dijadwalkan"}
                    </span>
                </div>

                {/* Prioritas Badge (OTOMATIS) */}
                {priority && priority.label !== "Unknown" && (
                    <div className="flex items-center text-xs">
                        {priority.label === 'High' ? <AlertCircle className={`mr-2 h-3.5 w-3.5 text-red-500`} />
                            : priority.label === '( - )' ? <MinusCircle className={`mr-2 h-3.5 w-3.5 text-slate-400`} />
                                : <Clock className={`mr-2 h-3.5 w-3.5 text-slate-400`} />}

                        <span className={`font-medium ${priority.label === 'High'
                            ? 'text-red-600 font-bold'
                            : priority.label === 'Medium'
                                ? 'text-orange-600'
                                : priority.label === '( - )'
                                    ? 'text-slate-400'
                                    : 'text-green-600'
                            }`}>
                            {priority.label.toUpperCase()} Priority
                        </span>
                    </div>
                )}
            </CardContent>

            {/* --- FOOTER KARTU --- */}
            <CardFooter className="p-4 pt-0">
                <Button variant="outline" size="sm" className="w-full text-xs h-8 border-slate-200 hover:bg-[#006070]/5 hover:text-[#006070] hover:border-[#006070]/30">
                    Lihat Rincian
                </Button>
            </CardFooter>
        </Card>
    );
}

export function AgendaGrid({ data }: AgendaGridProps) {

    // Empty State
    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed rounded-xl bg-slate-50/50">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="font-semibold text-lg text-slate-900">Tidak ada agenda</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Tidak ada data yang cocok dengan pencarian atau filter Anda. Coba sesuaikan filter atau reset pencarian.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {data.map((agenda) => <AgendaCard key={agenda.id} agenda={agenda} />)}
        </div>
    );
}