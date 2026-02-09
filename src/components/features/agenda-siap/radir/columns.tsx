/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { AgendaRadirItem } from "@/types/agenda";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    MoreHorizontal,

    Eye,

    Ban,
    PauseCircle,
    PlayCircle,
    Briefcase,
    Phone
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ViewRadirModal } from "./view-radir-modal";
import { ActionDialog } from "./action-dialog";
import { showNotify } from "@/components/shared/toast-provider";
import { updateAgendaStatusAction } from "@/server/actions/agenda-siap-actions";
import { useRouter } from "next/navigation";

// --- Helper Warna Status ---
const getStatusColor = (status: string) => {
    switch (status) {
        case "Selesai": return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
        case "Dijadwalkan": return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
        case "Dapat Dilanjutkan": return "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100";
        case "Ditunda": return "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100";
        case "Dibatalkan": return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
        default: return "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200";
    }
};

// --- Helper Hitung Prioritas Otomatis ---
// --- KOMPONEN CellAction ---
const CellAction = ({ data }: { data: AgendaRadirItem }) => {
    const [showViewModal, setShowViewModal] = useState(false);
    const [showActionDialog, setShowActionDialog] = useState(false);
    const [actionType, setActionType] = useState<"tunda" | "batal" | null>(null);
    const router = useRouter();

    const handleAction = (type: "tunda" | "batal") => {
        setActionType(type);
        setShowActionDialog(true);
    };

    const handleRestore = async () => {
        try {
            const result = await updateAgendaStatusAction(
                data.id,
                "Dapat Dilanjutkan" as "Ditunda" | "Dibatalkan",
                "Agenda dilanjutkan kembali"
            );
            if (result.success) {
                showNotify("Agenda berhasil dilanjutkan.", "success");
                router.refresh();
            } else {
                showNotify(result.error || "Gagal melanjutkan agenda.", "error");
            }
        } catch {
            showNotify("Terjadi kesalahan sistem.", "error");
        }
    };

    return (
        <>
            <ViewRadirModal
                open={showViewModal}
                onOpenChange={setShowViewModal}
                agendaId={data.id}
            />

            <ActionDialog
                open={showActionDialog}
                onOpenChange={setShowActionDialog}
                agendaId={data.id}
                actionType={actionType}
            />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4 text-slate-500" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 shadow-lg border-slate-200">
                    <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">Aksi Agenda</DropdownMenuLabel>

                    <DropdownMenuItem onClick={() => setShowViewModal(true)} className="cursor-pointer font-medium text-[#006070] focus:text-[#006070] focus:bg-[#e6f2f5]">
                        <Eye className="mr-2 h-3.5 w-3.5" />
                        Lihat Detail
                    </DropdownMenuItem>

                    {/* Logika Menu Aksi Berdasarkan Status */}
                    {(data.status === "Ditunda" || data.status === "Dibatalkan") ? (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleRestore} className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer">
                                <PlayCircle className="mr-2 h-3.5 w-3.5" />
                                Lanjutkan Agenda
                            </DropdownMenuItem>
                        </>
                    ) : (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleAction("tunda")} className="text-orange-600 focus:text-orange-700 focus:bg-orange-50 cursor-pointer">
                                <PauseCircle className="mr-2 h-3.5 w-3.5" />
                                Tunda Agenda
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => handleAction("batal")} className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer">
                                <Ban className="mr-2 h-3.5 w-3.5" />
                                Batalkan Agenda
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
};

export const columns: ColumnDef<AgendaRadirItem>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
                className="translate-y-0.5"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                className="translate-y-0.5"
            />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
    },
    {
        accessorKey: "title",
        header: "JUDUL AGENDA",
        cell: ({ row }) => {
            const title = row.getValue("title") as string;
            const dateStr = (row.original as any).deadlineDate; // Gunakan deadlineDate
            return (
                <div className="flex flex-col gap-1 w-[320px]">
                    <span className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 wrap-break-word" title={title}>
                        {title}
                    </span>
                    {dateStr && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mt-1">
                            <span className="uppercase tracking-wider">DEADLINE:</span>
                            <span>{format(new Date(dateStr), "dd/MM/yyyy", { locale: id })}</span>
                        </div>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: "contactPerson",
        header: "NARAHUBUNG (PIC)",
        cell: ({ row }) => {
            const name = row.original.contactPerson || "-";
            const pos = row.original.position;
            const phone = row.original.phone;
            return (
                <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-bold text-slate-800">{name}</span>
                    <div className="flex flex-col gap-1 text-xs text-slate-500">
                        {pos && (
                            <div className="flex items-center gap-1.5">
                                <Briefcase className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="uppercase font-medium text-[10px] leading-tight">{pos}</span>
                            </div>
                        )}
                        {phone && (
                            <a href={`https://wa.me/${phone.replace(/^0/, '62').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors w-fit group">
                                <Phone className="h-3 w-3 text-slate-400 group-hover:text-emerald-500 shrink-0" />
                                <span className="font-mono text-slate-600 group-hover:text-emerald-700 group-hover:underline decoration-emerald-300 underline-offset-2">{phone}</span>
                            </a>
                        )}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: "status",
        header: "STATUS",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
                <Badge variant="outline" className={`font-medium text-[10px] px-2.5 py-0.5 border ${getStatusColor(status)}`}>
                    {status.toUpperCase()}
                </Badge>
            );
        },
        size: 120,
    },
    {
        id: "notes",
        header: "CATATAN",
        cell: ({ row }) => {
            // Gunakan type assertion yang lebih spesifik untuk menghindari 'any'
            const notes: string = (row.original as { notes?: string }).notes || "-";
            return (
                <div className="text-xs text-slate-600 max-w-50 line-clamp-3" title={notes}>
                    {notes}
                </div>
            );
        },
    },
    {
        id: "actions",
        header: "AKSI",
        cell: ({ row }) => <CellAction data={row.original} />,
        size: 60,
    },
];
