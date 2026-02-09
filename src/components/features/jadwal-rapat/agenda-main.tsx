"use client";

import * as React from "react";
import {
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { UnifiedAgendaItem } from "@/server/actions/jadwal-rapat-actions";
import { AgendaToolbar } from "./toolbar";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { columns } from "./columns";
import { ScheduleDialog } from "./schedule-dialog";
import { showNotify } from "@/components/shared/toast-provider";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface AgendaMainProps {
    initialData: UnifiedAgendaItem[];
}

export function AgendaMain({ initialData }: AgendaMainProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    // Sembunyikan kolom executionDate secara default karena hanya untuk filter
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
        executionDate: false
    });
    const [rowSelection, setRowSelection] = React.useState({});
    const [showScheduleDialog, setShowScheduleDialog] = React.useState(false);

    // State untuk Filter Toolbar
    const [dateFilter, setDateFilter] = React.useState<Date | undefined>(undefined);

    const table = useReactTable({
        data: initialData,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedAgendas = selectedRows.map(row => row.original);

    // --- HELPER: Ekstrak Singkatan ---
    const extractAbbreviations = (text: string | null) => {
        if (!text) return "-";
        return text.split(',').map(part => {
            const trimmed = part.trim();
            // Cari teks dalam kurung di akhir string
            // Ambil teks dalam kurung jika ada (misal: "JABATAN (SINGKATAN)" -> "SINGKATAN")
            const match = trimmed.match(/\(([^)]+)\)$/);
            return match && match[1] ? match[1].trim() : trimmed;
        }).join(', ');
    };

    // --- LOGIC COPY UNDANGAN ---
    const handleCopyInvite = async () => {
        if (selectedAgendas.length === 0) return;

        const refData = selectedAgendas[0];
        if (!refData) return;

        const dateString = refData.executionDate
            ? format(new Date(refData.executionDate), "EEEE, dd MMMM yyyy", { locale: id })
            : "Belum di input";

        const timeString = (refData.startTime && refData.endTime)
            ? `${refData.startTime} - ${refData.endTime} WIB`
            : "Belum di input";

        const locationString = refData.meetingLocation || "Belum di input";

        const radirItems = selectedAgendas.filter(a => a.meetingType === "RADIR");
        const rakordirItems = selectedAgendas.filter(a => a.meetingType === "RAKORDIR");

        let agendaText = "";
        let counter = 1;

        // Dynamic Header based on selection
        let titleHeader = "";
        let bodyHeader = "";

        if (radirItems.length > 0 && rakordirItems.length > 0) {
            titleHeader = "*UNDANGAN RAPAT DIREKSI DAN RAPAT KOORDINASI DIREKSI*";
            bodyHeader = "*Rapat Direksi dan Rapat Koordinasi Direksi*";
        } else if (radirItems.length > 0) {
            titleHeader = "*UNDANGAN RAPAT DIREKSI*";
            bodyHeader = "*Rapat Direksi*";
        } else {
            titleHeader = "*UNDANGAN RAPAT KOORDINASI DIREKSI (RAKORDIR)*";
            bodyHeader = "*Rapat Koordinasi Direksi*";
        }

        if (radirItems.length > 0) {
            agendaText += `\n*RADIR*\n\n`;
            radirItems.forEach(item => {
                agendaText += `${counter}. *${item.title}*\n\n`;
                agendaText += `Direktur Pemrakarsa: ${extractAbbreviations(item.director)}\n\n`;
                agendaText += `Pemrakarsa: ${extractAbbreviations(item.initiator)}\n\n`;
                agendaText += `Support: ${extractAbbreviations(item.support)}\n\n`;
                counter++;
            });
        }

        if (rakordirItems.length > 0) {
            agendaText += `\n*RAKORDIR*\n\n`;
            rakordirItems.forEach(item => {
                agendaText += `${counter}. *${item.title}*\n\n`;
                agendaText += `Direktur Pemrakarsa: ${extractAbbreviations(item.director)}\n\n`;
                agendaText += `Pemrakarsa: ${extractAbbreviations(item.initiator)}\n\n`;
                agendaText += `Support: ${extractAbbreviations(item.support)}\n\n`;
                counter++;
            });
        }

        const fullText = `${titleHeader}

Ykh. Bapak/Ibu 
• BoD Holding
• KSPI
• SEVP HKK
• KSDTI
• Senior Leaders

Dengan ini dimohon untuk berkenan hadir dalam ${bodyHeader} yang akan dilaksanakan secara tatap muka pada :

🗓  Hari, tanggal: ${dateString}
⏰️  Pukul: ${timeString}
📍  Ruang: ${locationString}

AGENDA
${agendaText}
Terimakasih dan salam hormat, 🙏🏼🙏🏼
_SEKPER PLN_`;

        try {
            await navigator.clipboard.writeText(fullText);
            showNotify("Undangan berhasil disalin ke clipboard!", "success");
        } catch {
            showNotify("Gagal menyalin undangan.", "error");
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <AgendaToolbar
                searchQuery={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                onSearchChange={(value) => table.getColumn("title")?.setFilterValue(value)}

                statusFilter={(table.getColumn("status")?.getFilterValue() as string[]) ?? []}
                onStatusChange={(value) => table.getColumn("status")?.setFilterValue(value)}

                dateFilter={dateFilter}
                onDateChange={(date) => {
                    setDateFilter(date);
                    if (date) {
                        // Filter kolom executionDate (yang di-hidden)
                        table.getColumn("executionDate")?.setFilterValue(date.toISOString().split('T')[0]);
                    } else {
                        table.getColumn("executionDate")?.setFilterValue(undefined);
                    }
                }}

                selectedCount={selectedRows.length}
                onScheduleBulk={() => setShowScheduleDialog(true)}
                onCopyInvite={handleCopyInvite}
            />

            <div className="flex-1 overflow-hidden rounded-xl border bg-white shadow-sm relative min-h-[50vh]">
                <div className="h-full overflow-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        Tidak ada data agenda.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="flex items-center justify-between px-2 pt-2 pb-6">
                <div className="text-xs text-muted-foreground">
                    Menampilkan {table.getRowModel().rows.length} data.
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </div>

            <ScheduleDialog
                open={showScheduleDialog}
                onOpenChange={setShowScheduleDialog}
                selectedAgendas={selectedAgendas}
                onSuccess={() => {
                    setRowSelection({})
                }}
            />
        </div>
    );
}
