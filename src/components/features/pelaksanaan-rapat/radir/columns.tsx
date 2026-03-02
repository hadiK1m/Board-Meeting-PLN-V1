// src/components/features/pelaksanaan-rapat/radir/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MeetingSummary } from "@/server/actions/pelaksanaan-rapat-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUpDown, Calendar, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { EditMeetingNumberDialog } from "./components/edit-meeting-number-dialog";

export const columns: ColumnDef<MeetingSummary>[] = [
    {
        id: "number",
        header: "No.",
        cell: ({ row }) => (
            <span className="text-sm text-muted-foreground font-medium">
                {row.index + 1}
            </span>
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "meetingNumber",
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Nomor Meeting
                <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <span className="font-bold text-[#006070]">{row.original.meetingNumber}</span>
                <EditMeetingNumberDialog currentMeetingNumber={row.original.meetingNumber} />
            </div>
        ),
    },
    {
        accessorKey: "executionDate",
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Tanggal & Waktu
                <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
            </Button>
        ),
        cell: ({ row }) => {
            const date = row.original.executionDate;
            const startTime = row.original.startTime;
            const endTime = row.original.endTime;
            return (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                        <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                        {date ? format(new Date(date), "EEEE, dd MMMM yyyy", { locale: id }) : "-"}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {startTime || "-"} - {endTime || "Selesai"}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: "location",
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Lokasi
                <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
            </Button>
        ),
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
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Jumlah Agenda
                <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
            </Button>
        ),
        cell: ({ row }) => (
            <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                {row.original.agendaCount} Agenda
            </Badge>
        ),
    },
    {
        accessorKey: "status",
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Status
                <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
            </Button>
        ),
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
            const url = `/dashboard/pelaksanaan-rapat/radir/input/${encodeURIComponent(row.original.meetingNumber)}`;
            return (
                <Button asChild variant="ghost" size="sm" className="text-[#006070] hover:bg-[#e6f2f5]">
                    <Link href={url}>
                        Input Risalah <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            );
        },
        enableSorting: false,
        enableHiding: false,
    },
];
