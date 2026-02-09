// src/components/features/monev/radir/columns.tsx
"use client";

import { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MonevAgendaItem } from "@/server/actions/monev-radir-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    MoreHorizontal,
    Phone,
    Download,
    ExternalLink,
    Calendar,
    Edit,
    CheckCircle2,
    Clock,
    Loader2
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { UpdateProgressDialog } from "./update-progress-dialog";
import { createClient } from "@/lib/supabase/client";

// Progress bar component
function ProgressBar({ completed, total }: { completed: number; total: number }) {
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    const isComplete = completed === total && total > 0;

    return (
        <div className="space-y-1.5 min-w-28">
            <Badge
                variant="outline"
                className={`text-xs font-medium ${isComplete
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-orange-50 text-orange-700 border-orange-200"
                    }`}
            >
                {isComplete ? (
                    <><CheckCircle2 className="h-3 w-3 mr-1" /> SELESAI</>
                ) : (
                    <><Clock className="h-3 w-3 mr-1" /> IN PROGRESS</>
                )}
            </Badge>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${isComplete ? "bg-green-500" : "bg-orange-400"
                        }`}
                    style={{ width: `${Math.max(percentage, 5)}%` }}
                />
            </div>
            <p className="text-xs text-muted-foreground font-medium">
                {completed} / {total} Selesai
            </p>
        </div>
    );
}

// Petikan Risalah Cell Component - handles signed URL fetching
function PetikanRisalahCell({ risalahTtd }: { risalahTtd: string | null }) {
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchSignedUrl = async () => {
            if (!risalahTtd) return;

            setIsLoading(true);
            try {
                const supabase = createClient();
                const { data } = await supabase.storage
                    .from("Dokumen")
                    .createSignedUrl(risalahTtd, 3600); // 1 hour expiry

                if (data?.signedUrl) {
                    setSignedUrl(data.signedUrl);
                }
            } catch (error) {
                console.error("Error fetching signed URL:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSignedUrl();
    }, [risalahTtd]);

    // Jika file petikan risalah belum di-upload
    if (!risalahTtd) {
        return (
            <div className="py-3">
                <div className="flex items-center gap-1.5 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-medium">Belum diinput</span>
                </div>
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="py-3">
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Memuat...</span>
                </div>
            </div>
        );
    }

    // Jika file petikan risalah sudah ada
    if (!signedUrl) {
        return (
            <div className="py-3">
                <div className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-200">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-medium">Gagal memuat</span>
                </div>
            </div>
        );
    }

    return (
        <div className="py-3 flex flex-col gap-2">
            <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                onClick={() => window.open(signedUrl, "_blank")}
            >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Lihat File
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-slate-500 hover:text-slate-700"
                asChild
            >
            </Button>
        </div>
    );
}

export const columns: ColumnDef<MonevAgendaItem>[] = [
    {
        accessorKey: "title",
        header: () => (
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Agenda & Pemrakarsa
            </span>
        ),
        size: 300,
        maxSize: 300,
        cell: ({ row }) => {
            const date = row.original.executionDate;
            const formattedDate = date
                ? format(new Date(date), "dd MMM yyyy", { locale: id })
                : "-";

            return (
                <div className="space-y-2 py-3 pr-4 w-70">
                    {/* Badge row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="bg-slate-800 text-white text-xs font-mono">
                            {row.original.meetingNumber}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formattedDate}
                        </div>
                    </div>

                    {/* Title */}
                    <p className="font-semibold text-slate-900 leading-tight text-sm whitespace-normal wrap-break-word">
                        {row.original.title}
                    </p>

                    {/* Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {row.original.director && (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs font-medium">
                                {row.original.director.match(/\(([^)]+)\)/)?.[1] || row.original.director}
                            </Badge>
                        )}
                        {row.original.initiator && (
                            <Badge variant="outline" className="text-xs border-slate-300 text-slate-600">
                                {row.original.initiator.match(/\(([^)]+)\)/)?.[1] || row.original.initiator}
                            </Badge>
                        )}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: "contactPerson",
        header: () => (
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Narahubung
            </span>
        ),
        size: 180,
        cell: ({ row }) => (
            <div className="space-y-2 py-3 w-45">
                <div className="space-y-1">
                    <p className="font-medium text-slate-900 text-sm whitespace-normal wrap-break-word hyphens-auto">
                        {row.original.contactPerson || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground whitespace-normal wrap-break-word hyphens-auto leading-relaxed">
                        {row.original.position || "-"}
                    </p>
                </div>
                {row.original.phone && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const phone = row.original.phone;
                            if (!phone) return;
                            const cleanPhone = phone.replace(/\D/g, "");
                            const waNumber = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;
                            const message = encodeURIComponent(`Halo ${row.original.contactPerson || "Bapak/Ibu"}, saya ingin menanyakan progress tindak lanjut keputusan rapat.`);
                            window.open(`https://wa.me/${waNumber}?text=${message}`, "_blank");
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600 text-xs h-7 px-2"
                    >
                        <Phone className="h-3 w-3 mr-1" />
                        Chat WA
                    </Button>
                )}
            </div>
        ),
    },
    {
        id: "petikanRisalah",
        header: () => (
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Petikan Risalah
            </span>
        ),
        size: 160,
        cell: ({ row }) => <PetikanRisalahCell risalahTtd={row.original.risalahTtd} />,
    },
    {
        id: "detailKeputusan",
        header: () => (
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Detail Keputusan
            </span>
        ),
        size: 280,
        cell: ({ row }) => {
            const decisions = row.original.decisions;

            if (!decisions || decisions.length === 0) {
                return (
                    <div className="py-3 text-sm text-muted-foreground italic">
                        Belum ada keputusan
                    </div>
                );
            }

            // Show first decision with summary
            const firstDecision = decisions[0];
            const hasMore = decisions.length > 1;

            return (
                <div className="py-3 space-y-2 max-w-xs">
                    {/* Output */}
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Output
                        </p>
                        {firstDecision?.output ? (
                            <p className="text-sm text-slate-700 line-clamp-2">
                                {firstDecision.output}
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">
                                Belum diisi
                            </p>
                        )}
                    </div>

                    {/* Progress Terkini */}
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Progress Terkini
                        </p>
                        {firstDecision?.progressTerkini ? (
                            <p className="text-sm text-slate-700 line-clamp-2">
                                {firstDecision.progressTerkini}
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">
                                Belum ada update
                            </p>
                        )}
                    </div>

                    {hasMore && (
                        <p className="text-xs text-blue-600 font-medium">
                            +{decisions.length - 1} keputusan lainnya
                        </p>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: "statusMonev",
        header: () => (
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status Monev
            </span>
        ),
        size: 150,
        cell: ({ row }) => (
            <div className="py-3">
                <ProgressBar
                    completed={row.original.completedDecisions}
                    total={row.original.totalDecisions}
                />
            </div>
        ),
    },
    {
        id: "actions",
        header: () => (
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Aksi
            </span>
        ),
        size: 80,
        cell: ({ row }) => <ActionCell row={row.original} />,
    },
];

// Separate component to handle dialog state
function ActionCell({ row }: { row: MonevAgendaItem }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const meetingNumber = row.meetingNumber;
    const risalahUrl = `/dashboard/pelaksanaan-rapat/radir/input/${encodeURIComponent(meetingNumber || "")}`;

    return (
        <div className="py-3">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onClick={() => setDialogOpen(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Update Progress
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.open(risalahUrl, "_blank")}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Lihat Risalah
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => console.log("Download PDF")}>
                        <Download className="h-4 w-4 mr-2" />
                        Unduh Petikan
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => {
                            const phone = row.phone;
                            if (phone) {
                                const cleanPhone = phone.replace(/\D/g, "");
                                const waNumber = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;
                                window.open(`https://wa.me/${waNumber}`, "_blank");
                            }
                        }}
                        disabled={!row.phone}
                    >
                        <Phone className="h-4 w-4 mr-2" />
                        Hubungi Narahubung
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <UpdateProgressDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                agendaId={row.agendaId}
                agendaTitle={row.title}
                meetingNumber={row.meetingNumber || ""}
                decisions={row.decisions}
                onSuccess={() => {
                    // Refresh the page to get updated data
                    window.location.reload();
                }}
            />
        </div>
    );
}
