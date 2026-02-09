/* eslint-disable react-hooks/incompatible-library */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ColumnFiltersState, SortingState, VisibilityState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { AgendaRadirItem } from "@/types/agenda";
import { AgendaToolbar } from "./toolbar";
import { AgendaGrid } from "../radir/agenda-grid"; // ✅ Reuse Grid dari RADIR
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { columns } from "./columns";
import { DeleteRakordirDialog } from "./delete-rakordir-dialog";

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
