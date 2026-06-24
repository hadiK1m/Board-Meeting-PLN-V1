/* eslint-disable react-hooks/incompatible-library */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ColumnFiltersState, SortingState, VisibilityState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { AgendaRadirItem } from "@/types/agenda";
import { AgendaToolbar } from "./toolbar";
import { AgendaGrid } from "../radir/agenda-grid";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { columns } from "./columns";
import { DeleteRakordirDialog } from "./delete-rakordir-dialog";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import * as XLSX from "xlsx";

interface AgendaMainProps {
    initialData: AgendaRadirItem[];
}
export function AgendaMain({ initialData }: AgendaMainProps) {
    const router = useRouter();
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [viewMode, setViewMode] = React.useState<"list" | "grid">("list");
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
    const [deleteIds, setDeleteIds] = React.useState<string[]>([]);

    const table = useReactTable({
        data: initialData, columns, onSortingChange: setSorting, onColumnFiltersChange: setColumnFilters, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(), onColumnVisibilityChange: setColumnVisibility, onRowSelectionChange: setRowSelection,
        state: { sorting, columnFilters, columnVisibility, rowSelection },
    });

    const handleBulkDelete = () => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        const ids = selectedRows.map((row) => row.original.id);
        if (ids.length > 0) { setDeleteIds(ids); setShowDeleteDialog(true); }
    };

    const handleExportCsv = () => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        if (selectedRows.length === 0) return;

        const headers = ["No", "Judul Agenda", "Prioritas", "Deadline", "Direktur Pemrakarsa", "Status"];

        const rows = selectedRows.map((row, index) => {
            const original = row.original;
            const deadline = original.deadlineDate ? format(new Date(original.deadlineDate), "dd MMM yyyy", { locale: id }) : "-";

            let priority = "-";
            if (original.deadlineDate) {
                const today = new Date();
                const deadlineDate = new Date(original.deadlineDate);
                const daysLeft = Math.floor((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                if (daysLeft < 0) priority = "-";
                else if (daysLeft <= 7) priority = "High";
                else if (daysLeft <= 14) priority = "Medium";
                else priority = "Low";
            }

            return [
                index + 1,
                `"${(original.title || "").replace(/"/g, '""')}"`,
                priority,
                deadline,
                original.director || "-",
                original.status || "-"
            ].join(",");
        });

        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `rakordir_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportExcel = () => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        if (selectedRows.length === 0) return;

        const headers = ["No", "Judul Agenda", "Prioritas", "Deadline", "Direktur Pemrakarsa", "Status"];

        const data = selectedRows.map((row, index) => {
            const original = row.original;
            const deadline = original.deadlineDate ? format(new Date(original.deadlineDate), "dd MMM yyyy", { locale: id }) : "-";

            let priority = "-";
            if (original.deadlineDate) {
                const today = new Date();
                const deadlineDate = new Date(original.deadlineDate);
                const daysLeft = Math.floor((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                if (daysLeft < 0) priority = "-";
                else if (daysLeft <= 7) priority = "High";
                else if (daysLeft <= 14) priority = "Medium";
                else priority = "Low";
            }

            return [
                index + 1,
                original.title || "",
                priority,
                deadline,
                original.director || "-",
                original.status || "-"
            ];
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

        const colWidths = [
            { wch: 5 },
            { wch: 50 },
            { wch: 12 },
            { wch: 15 },
            { wch: 25 },
            { wch: 20 }
        ];
        ws['!cols'] = colWidths;

        const headerStyle = {
            fill: { fgColor: { rgb: "006070" } },
            font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
            }
        };

        for (let col = 0; col < headers.length; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: headers[col] };
            ws[cellAddress].s = headerStyle;
        }

        for (let row = 1; row < data.length + 1; row++) {
            for (let col = 0; col < headers.length; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                if (ws[cellAddress]) {
                    ws[cellAddress].s = {
                        border: {
                            top: { style: "thin", color: { rgb: "DDDDDD" } },
                            bottom: { style: "thin", color: { rgb: "DDDDDD" } },
                            left: { style: "thin", color: { rgb: "DDDDDD" } },
                            right: { style: "thin", color: { rgb: "DDDDDD" } }
                        },
                        alignment: { horizontal: col === 1 ? "left" : "center", vertical: "center" },
                        font: { sz: 11 }
                    };
                    if (row % 2 === 0) {
                        ws[cellAddress].s.fill = { fgColor: { rgb: "F5F5F5" } };
                    }
                }
            }
        }

        XLSX.utils.book_append_sheet(wb, ws, "Rakordir");
        const fileName = `rakordir_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                    <AgendaToolbar
                        searchQuery={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                        onSearchChange={(value) => table.getColumn("title")?.setFilterValue(value)}
                        statusFilter={(table.getColumn("status")?.getFilterValue() as string[]) ?? []}
                        onStatusChange={(value) => table.getColumn("status")?.setFilterValue(value)}
                        dateFilter={undefined}
                        onDateChange={(date) => { if (date) table.getColumn("deadlineDate")?.setFilterValue(date.toISOString().split('T')[0]); else table.getColumn("deadlineDate")?.setFilterValue(undefined); }}
                        onReset={() => table.resetColumnFilters()}
                        selectedCount={table.getFilteredSelectedRowModel().rows.length}
                        onDeleteBulk={handleBulkDelete}
                        onExportCsv={handleExportCsv}
                        onExportExcel={handleExportExcel}
                    />
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 border border-slate-200 h-fit">
                    <Button variant="ghost" size="sm" onClick={() => setViewMode("list")} className={cn("h-8 w-8 px-0", viewMode === "list" && "bg-white text-[#006070] shadow-sm")}><List className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setViewMode("grid")} className={cn("h-8 w-8 px-0", viewMode === "grid" && "bg-white text-[#006070] shadow-sm")}><LayoutGrid className="h-4 w-4" /></Button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden rounded-xl border bg-white shadow-sm relative min-h-[50vh]">
                {viewMode === "list" ? (
                    <div className="h-full overflow-auto">
                        <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 z-10">{table.getHeaderGroups().map((headerGroup) => (<TableRow key={headerGroup.id}>{headerGroup.headers.map((header) => (<TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>))}</TableRow>))}</TableHeader>
                            <TableBody>{table.getRowModel().rows?.length ? (table.getRowModel().rows.map((row) => (<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>{row.getVisibleCells().map((cell) => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>))) : (<TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Tidak ada data agenda.</TableCell></TableRow>)}</TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="bg-slate-50/50 h-full overflow-y-auto"><AgendaGrid data={table.getRowModel().rows.map(r => r.original)} /></div>
                )}
            </div>
            <div className="flex items-center justify-between px-2 pt-2 pb-6">
                <div className="text-xs text-muted-foreground">{table.getFilteredSelectedRowModel().rows.length} dari {table.getFilteredRowModel().rows.length} baris dipilih.</div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </div>
            <DeleteRakordirDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} ids={deleteIds} onSuccess={() => { setRowSelection({}); router.refresh(); }} />
        </div>
    );
}
