"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { AgendaRadirItem } from "@/types/agenda";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, ArrowUpDown, Calendar, AlertCircle, User, Copy, Pencil, Trash, Eye, Clock } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { EditRakordirModal } from "./edit-rakordir-modal";
import { ViewRakordirModal } from "./view-rakordir-modal";
import { DeleteRakordirDialog } from "./delete-rakordir-dialog";

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

const CellAction = ({ data }: { data: AgendaRadirItem }) => {
    const router = useRouter();
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    return (
        <>
            <EditRakordirModal open={showEditModal} onOpenChange={setShowEditModal} agendaId={data.id} />
            <ViewRakordirModal open={showViewModal} onOpenChange={setShowViewModal} agendaId={data.id} />
            <DeleteRakordirDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} ids={[data.id]} onSuccess={() => router.refresh()} />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4 text-slate-500" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 shadow-lg border-slate-200">
                    <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">Aksi Agenda</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(data.id)} className="cursor-pointer"><Copy className="mr-2 h-3.5 w-3.5 text-slate-400" /> Salin ID</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowViewModal(true)} className="cursor-pointer font-medium text-[#006070] focus:text-[#006070] focus:bg-[#e6f2f5]"><Eye className="mr-2 h-3.5 w-3.5" /> Lihat Detail</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowEditModal(true)} className="cursor-pointer"><Pencil className="mr-2 h-3.5 w-3.5 text-slate-500" /> Edit Agenda</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"><Trash className="mr-2 h-3.5 w-3.5" /> Hapus</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
};

export const columns: ColumnDef<AgendaRadirItem>[] = [
    {
        id: "select",
        header: ({ table }) => (<Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" className="translate-y-0.5" />),
        cell: ({ row }) => (<Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" className="translate-y-0.5" />),
        enableSorting: false, enableHiding: false, size: 40,
    },
    {
        id: "rowNumber", header: "NO", cell: ({ row }) => (<div className="text-xs font-medium text-slate-500 text-center w-8">{row.index + 1}</div>), size: 50,
    },
    {
        accessorKey: "title",
        header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 text-xs font-bold uppercase tracking-wider text-slate-500">Judul Agenda <ArrowUpDown className="ml-2 h-3 w-3" /></Button>),
        cell: ({ row }) => {
            const title = row.getValue("title") as string;
            return (<div className="flex flex-col gap-1 w-[320px]"><span className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 wrap-break-word" title={title}>{title}</span>{row.original.meetingNumber && (<span className="text-[10px] text-muted-foreground font-mono bg-slate-50 w-fit px-1.5 py-0.5 rounded border border-slate-100">#{row.original.meetingNumber}</span>)}</div>);
        },
    },
    {
        id: "priority",
        header: "PRIORITAS",
        cell: ({ row }) => {
            const deadline = (row.getValue("deadlineDate") as string) || null;
            const { label, color } = getAutomaticPriority(deadline);
            if (label === "Unknown" || label === "-") return <span className="text-slate-400 text-xs">-</span>;
            return (
                <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border ${color} shadow-sm`}>
                    {label === 'High' ? <AlertCircle className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                    {label.toUpperCase()}
                </Badge>
            );
        }, size: 100,
    },
    {
        accessorKey: "deadlineDate",
        header: "DEADLINE",
        cell: ({ row }) => {
            const dateStr = row.getValue("deadlineDate") as string;

            if (!dateStr) {
                return <span className="text-slate-400 text-xs italic">Belum ditentukan</span>;
            }

            try {
                return (
                    <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs font-medium whitespace-nowrap">
                            {format(new Date(dateStr), "dd MMM yyyy", { locale: id })}
                        </span>
                    </div>
                );
            } catch {
                return <span className="text-red-400 text-xs italic">Format tanggal salah</span>;
            }
        },
    },
    {
        accessorKey: "director", header: "DIREKTUR PEMRAKARSA",
        cell: ({ row }) => {
            const director = row.original.director || "-";
            return (<div className="flex items-center gap-2 w-45"><div className="w-6 h-6 min-w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200"><User size={12} /></div><span className="text-xs font-medium text-slate-700 truncate" title={director}>{director}</span></div>);
        },
    },
    {
        accessorKey: "status", header: "STATUS",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (<Badge variant="outline" className={`font-medium text-[10px] px-2.5 py-0.5 border ${getStatusColor(status)}`}>{status}</Badge>);
        }, size: 120,
    },
    {
        id: "actions", header: "AKSI", cell: ({ row }) => <CellAction data={row.original} />, size: 60,
    },
];
