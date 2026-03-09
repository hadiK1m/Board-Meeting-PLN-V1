// src/components/features/monev/rakordir/columns.tsx
"use client";

import { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MonevRakordirItem } from "@/server/actions/monev-rakordir-actions";
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

// Notulensi TTD Cell Component - handles signed URL fetching
function NotulensiTtdCell({ notulensiTtd }: { notulensiTtd: string | null }) {
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchSignedUrl = async () => {
            if (!notulensiTtd) return;

            setIsLoading(true);
            try {
                const supabase = createClient();
                const { data } = await supabase.storage
                    .from("Dokumen")
                    .createSignedUrl(notulensiTtd, 3600); // 1 hour expiry

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
    }, [notulensiTtd]);

    // Jika file notulensi belum di-upload
    if (!notulensiTtd) {
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

    // Jika file notulensi sudah ada
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
                className="h-8 text-xs border-[#14a2ba] bg-[#e7f6f9] text-[#125d72] hover:bg-[#14a2ba]/20 hover:text-[#125d72]"
                onClick={() => window.open(signedUrl, "_blank")}
            >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Lihat File
            </Button>
        </div>
    );
}

export const columns: ColumnDef<MonevRakordirItem>[] = [
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
                        <Badge variant="secondary" className="bg-[#125d72] text-white text-xs font-mono">
                            {row.original.notulensiNumber}
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
                            <Badge className="bg-[#e7f6f9] text-[#125d72] hover:bg-[#e7f6f9] text-xs font-medium">
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
                            const message = encodeURIComponent(`Halo ${row.original.contactPerson || "Bapak/Ibu"}, saya ingin menanyakan progress tindak lanjut arahan direksi.`);
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
        id: "notulensiTtd",
        header: () => (
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Notulensi
            </span>
        ),
        size: 160,
        cell: ({ row }) => <NotulensiTtdCell notulensiTtd={row.original.notulensiTtd} />,
    },
    {
        id: "detailArahan",
        header: () => (
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Detail Arahan Direksi
            </span>
        ),
        size: 280,
        cell: ({ row }) => {
            const arahanList = row.original.arahanDireksi;

            if (!arahanList || arahanList.length === 0) {
                return (
                    <div className="py-3 text-sm text-muted-foreground italic">
                        Belum ada arahan direksi
                    </div>
                );
            }

            // Show first arahan with summary
            const firstArahan = arahanList[0];
            const hasMore = arahanList.length > 1;

            return (
                <div className="py-3 space-y-2 max-w-xs">
                    {/* Target Output */}
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Target Output
                        </p>
                        {firstArahan?.targetOutput ? (
                            <p className="text-sm text-slate-700 line-clamp-2">
                                {firstArahan.targetOutput}
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
                        {firstArahan?.progresTerkini ? (
                            <p className="text-sm text-slate-700 line-clamp-2">
                                {firstArahan.progresTerkini}
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">
                                Belum ada update
                            </p>
                        )}
                    </div>

                    {hasMore && (
                        <p className="text-xs text-blue-600 font-medium">
                            +{arahanList.length - 1} arahan lainnya
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
                    completed={row.original.completedArahan}
                    total={row.original.totalArahan}
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

// Safe filename: prevent path traversal and invalid chars; fallback to notulensi number
function getSafeDownloadFilename(storagePath: string, notulensiNumber: string | null): string {
    // Only use basename from path (no parent path) to prevent path injection
    const basename = storagePath.replace(/^.*\//, "").trim() || "";
    const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, "_");
    if (sanitized) return sanitized;
    const safeNum = (notulensiNumber || "notulensi").replace(/[^a-zA-Z0-9-]/g, "_");
    const ext = (storagePath.match(/\.([a-zA-Z0-9]+)$/)?.[1] || "pdf").toLowerCase();
    return `Notulensi_${safeNum}.${ext}`;
}

// Validate storage path: no path traversal, only allowed chars
function isAllowedStoragePath(path: string | null): boolean {
    if (!path || typeof path !== "string") return false;
    if (path.includes("..") || path.includes("\\")) return false;
    if (!/^[\w./-]+$/.test(path)) return false;
    return path.startsWith("rakordir/");
}

// Separate component to handle dialog state
function ActionCell({ row }: { row: MonevRakordirItem }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);
    const notulensiNumber = row.notulensiNumber;
    const notulensiUrl = `/dashboard/pelaksanaan-rapat/rakordir/input/${encodeURIComponent(notulensiNumber || "")}`;
    const canDownload = Boolean(row.notulensiTtd && isAllowedStoragePath(row.notulensiTtd));

    const handleDownloadNotulensi = async () => {
        if (!canDownload || !row.notulensiTtd) return;

        setDownloadLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase.storage
                .from("Dokumen")
                .createSignedUrl(row.notulensiTtd, 3600); // 1 hour expiry, no permanent exposure

            if (error || !data?.signedUrl) {
                console.error("Error creating signed URL:", error?.message ?? "No URL");
                return;
            }

            const res = await fetch(data.signedUrl, { method: "GET" });
            if (!res.ok) throw new Error("Gagal mengambil file");

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = getSafeDownloadFilename(row.notulensiTtd, row.notulensiNumber);
            a.rel = "noopener noreferrer";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download notulensi error:", err);
        } finally {
            setDownloadLoading(false);
        }
    };

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
                    <DropdownMenuItem onClick={() => window.open(notulensiUrl, "_blank")}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Lihat Notulensi
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={handleDownloadNotulensi}
                        disabled={!canDownload || downloadLoading}
                    >
                        {downloadLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4 mr-2" />
                        )}
                        Unduh Notulensi
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
                notulensiNumber={row.notulensiNumber || ""}
                arahanDireksi={row.arahanDireksi}
                onSuccess={() => {
                    // Refresh the page to get updated data
                    window.location.reload();
                }}
            />
        </div>
    );
}
