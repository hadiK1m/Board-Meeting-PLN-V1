// src/components/features/pelaksanaan-rapat/rakordir/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { NotulensiMeetingSummary } from "@/server/actions/pelaksanaan-rakordir-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { EditNotulensiNumberDialog } from "./edit-notulensi-number-dialog";

export const columns: ColumnDef<NotulensiMeetingSummary>[] = [
    {
        accessorKey: "notulensiNumber",
        header: "Nomor Notulensi",
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <span className="font-bold text-[#006070]">{row.original.notulensiNumber}</span>
                <EditNotulensiNumberDialog currentNotulensiNumber={row.original.notulensiNumber} />
            </div>
        ),
    },
    {
        accessorKey: "executionDate",
        header: "Tanggal & Waktu",
        cell: ({ row }) => {
            const date = row.original.executionDate;
            return (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {date ? format(new Date(date), "dd MMM yyyy", { locale: id }) : "-"}
                </div>
            );
        },
    },
    {
        accessorKey: "location",
        header: "Lokasi",
        cell: ({ row }) => (
            <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="truncate max-w-50" title={row.original.location || ""}>
                    {row.original.location || "-"}
                </span>
            </div>
        ),
    },
    {
        accessorKey: "agendaCount",
        header: "Jumlah Agenda",
        cell: ({ row }) => (
            <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                {row.original.agendaCount} Agenda
            </Badge>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
            <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                {row.original.status}
            </Badge>
        ),
    },
    {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => {
            const url = `/dashboard/pelaksanaan-rapat/rakordir/input/${encodeURIComponent(row.original.notulensiNumber)}`;
            return (
                <Link href={url}>
                    <Button variant="ghost" size="sm" className="text-[#006070] hover:bg-[#e6f2f5]">
                        Input Notulensi <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            );
        },
    },
];
