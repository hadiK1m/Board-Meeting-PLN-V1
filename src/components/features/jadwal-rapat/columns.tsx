"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { UnifiedAgendaItem } from "@/server/actions/jadwal-rapat-actions";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Calendar, Clock, MapPin, Link as LinkIcon, Eye } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { showNotify } from "@/components/shared/toast-provider";
import { ViewRadirModal } from "@/components/features/agenda/radir/view-radir-modal";
import { ViewRakordirModal } from "@/components/features/agenda/rakordir/view-rakordir-modal";

const getStatusColor = (status: string) => {
    switch (status) {
        case "Selesai": return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "Dijadwalkan": return "bg-blue-50 text-blue-700 border-blue-200";
        case "Dapat Dilanjutkan": return "bg-indigo-50 text-indigo-700 border-indigo-200";
        default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
};

// --- Cell Action Component ---
const CellAction = ({ data }: { data: UnifiedAgendaItem }) => {
    const [showRadirView, setShowRadirView] = useState(false);
    const [showRakordirView, setShowRakordirView] = useState(false);

    const handleView = () => {
        if (data.meetingType === "RADIR") setShowRadirView(true);
        else if (data.meetingType === "RAKORDIR") setShowRakordirView(true);
    };

    return (
        <>
            <ViewRadirModal open={showRadirView} onOpenChange={setShowRadirView} agendaId={data.id} />
            <ViewRakordirModal open={showRakordirView} onOpenChange={setShowRakordirView} agendaId={data.id} />

            <Button
                variant="ghost"
                size="sm"
                onClick={handleView}
                className="h-8 px-2 text-xs font-medium text-[#006070] hover:text-[#004d5a] hover:bg-[#e6f2f5]"
            >
                <Eye className="mr-2 h-3.5 w-3.5" />
                Lihat Detail
            </Button>
        </>
    )
}

export const columns: ColumnDef<UnifiedAgendaItem>[] = [
    // 1. CHECKBOX DENGAN VALIDASI TANGGAL
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                onCheckedChange={(value) => {
                    if (value) {
                        // Logic Select All: Cek konsistensi tanggal semua baris di halaman ini
                        const pageRows = table.getRowModel().rows;
                        if (pageRows.length === 0) return;

                        // Ambil tanggal referensi (bisa dari baris pertama halaman ini, atau baris yang sudah terpilih sebelumnya)
                        const selectedRows = table.getSelectedRowModel().rows;
                        const refDate = selectedRows.length > 0
                            ? selectedRows[0]?.original?.executionDate
                            : pageRows[0]?.original?.executionDate;

                        // Cek apakah semua baris di halaman ini sesuai dengan referensi
                        const isConsistent = pageRows.every(r => r.original.executionDate === refDate);

                        if (!isConsistent) {
                            showNotify("Gagal memilih semua: Terdapat perbedaan tanggal jadwal pada daftar ini.", "error");
                            return;
                        }

                        // Jika ada baris yang sudah terpilih sebelumnya, pastikan halaman ini juga sesuai
                        if (selectedRows.length > 0 && pageRows[0]?.original?.executionDate !== refDate) {
                            showNotify("Gagal memilih: Tanggal jadwal berbeda dengan agenda yang sudah dipilih.", "error");
                            return;
                        }
                    }
                    table.toggleAllPageRowsSelected(!!value);
                }}
                aria-label="Select all"
                className="translate-y-0.5"
            />
        ),
        cell: ({ row, table }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => {
                    if (value) {
                        // Logic Single Select: Cek konsistensi dengan yang sudah dipilih
                        const selectedRows = table.getSelectedRowModel().rows;
                        if (selectedRows.length > 0) {
                            const firstDate = selectedRows[0]?.original?.executionDate;
                            const currentDate = row.original.executionDate;

                            if (firstDate !== currentDate) {
                                showNotify("Gagal memilih: Tanggal jadwal berbeda dengan agenda yang sudah dipilih.", "error");
                                return;
                            }
                        }
                    }
                    row.toggleSelected(!!value);
                }}
                aria-label="Select row"
                className="translate-y-0.5"
            />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
    },

    // 2. KOLOM NO
    {
        id: "rowNumber",
        header: "NO",
        cell: ({ row }) => (
            <div className="text-xs font-medium text-slate-500 text-center w-8">
                {row.index + 1}
            </div>
        ),
        size: 50,
    },

    // 3. JUDUL AGENDA & WAKTU
    {
        accessorKey: "title",
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Judul Agenda & Waktu <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
        ),
        cell: ({ row }) => {
            const title = row.getValue("title") as string;
            const type = row.original.meetingType;
            const dateStr = row.original.executionDate;
            const start = row.original.startTime;
            const end = row.original.endTime;

            const formatTime = (t: string | null) => {
                if (!t) return "";
                if (!t.includes(':')) return t;
                return t.split(':').slice(0, 2).join(':');
            };

            return (
                <div className="flex flex-col gap-1.5 w-100">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${type === 'RADIR' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-pink-50 text-pink-700 border-pink-200'}`}>
                            {type}
                        </Badge>
                        <span className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2" title={title}>{title}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{dateStr ? format(new Date(dateStr), "dd MMM yyyy", { locale: id }) : "-"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{start ? `${formatTime(start)} - ${formatTime(end) || 'Selesai'}` : "-"}</span>
                        </div>
                    </div>
                </div>
            );
        },
    },

    // 4. METODE
    {
        accessorKey: "meetingMethod",
        header: "METODE",
        cell: ({ row }) => {
            const method = row.original.meetingMethod;
            const location = row.original.meetingLocation;
            const link = row.original.meetingLink;

            if (!method) return <span className="text-slate-400 text-xs">-</span>;

            return (
                <div className="flex flex-col gap-1 text-xs">
                    <span className="font-medium text-slate-700">{method}</span>
                    {location && <div className="flex items-center gap-1 text-slate-500 truncate max-w-37.5" title={location}><MapPin className="h-3 w-3" /> {location}</div>}
                    {link && <div className="flex items-center gap-1 text-blue-600 truncate max-w-37.5" title={link}><LinkIcon className="h-3 w-3" /> Link Meeting</div>}
                </div>
            );
        },
    },

    // 5. STATUS
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
        size: 100,
    },

    // 6. HIDDEN COLUMN FOR DATE FILTERING
    {
        accessorKey: "executionDate",
        header: "Tanggal",
        enableHiding: true,
    },

    // 7. AKSI
    {
        id: "actions",
        header: "AKSI",
        cell: ({ row }) => <CellAction data={row.original} />,
        size: 100,
    },
];
