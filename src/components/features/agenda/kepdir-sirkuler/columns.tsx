"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { AgendaRadirItem } from "@/types/agenda";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, ArrowUpDown, User, Copy, Pencil, Trash, Eye, Briefcase, Phone } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EditKepdirModal } from "./edit-kepdir-modal";
import { ViewKepdirModal } from "./view-kepdir-modal";
import { DeleteKepdirDialog } from "./delete-kepdir-dialog";

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

const CellAction = ({ data }: { data: AgendaRadirItem }) => {
    const router = useRouter();
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    return (
        <>
            <EditKepdirModal open={showEditModal} onOpenChange={setShowEditModal} agendaId={data.id} />
            <ViewKepdirModal open={showViewModal} onOpenChange={setShowViewModal} agendaId={data.id} />
            <DeleteKepdirDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} ids={[data.id]} onSuccess={() => router.refresh()} />
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
            return (<div className="flex flex-col gap-1 w-[320px]"><span className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 wrap-break-word" title={title}>{title}</span></div>);
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
        accessorKey: "contactPerson", header: "NARAHUBUNG",
        cell: ({ row }) => {
            const name = row.original.contactPerson || "-";
            const pos = row.original.position;
            const phone = row.original.phone;
            return (
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-700">{name}</span>
                    <div className="flex flex-col gap-0.5 text-[10px] text-slate-500">
                        {pos && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {pos}</span>}
                        {phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {phone}</span>}
                    </div>
                </div>
            );
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
