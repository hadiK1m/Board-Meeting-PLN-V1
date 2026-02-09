/* eslint-disable react-hooks/incompatible-library */
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
import { AgendaRadirItem } from "@/types/agenda";
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
import { ScheduleDialog } from "./schedule-dialog"; // ✅ Import dari folder rakordir

interface AgendaMainProps {
    initialData: AgendaRadirItem[];
}

export function AgendaMain({ initialData }: AgendaMainProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    const [showScheduleDialog, setShowScheduleDialog] = React.useState(false);

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
    const selectedAgendas = selectedRows.map(row => ({
        id: row.original.id,
        title: row.original.title
    }));

    return (
        <div className="flex flex-col h-full space-y-4">
            <AgendaToolbar
                searchQuery={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                onSearchChange={(value) => table.getColumn("title")?.setFilterValue(value)}
                statusFilter={(table.getColumn("status")?.getFilterValue() as string[]) ?? []}
                onStatusChange={(value) => table.getColumn("status")?.setFilterValue(value)}
                dateFilter={undefined}
                onDateChange={(date) => {
                    if (date) table.getColumn("executionDate")?.setFilterValue(date.toISOString().split('T')[0]);
                    else table.getColumn("executionDate")?.setFilterValue(undefined);
                }}
                onReset={() => table.resetColumnFilters()}
                selectedCount={selectedRows.length}
                onScheduleBulk={() => setShowScheduleDialog(true)}
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
                                        Tidak ada data agenda siap.
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
