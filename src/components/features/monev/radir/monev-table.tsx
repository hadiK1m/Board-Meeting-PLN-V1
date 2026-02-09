/* eslint-disable react-hooks/incompatible-library */
// src/components/features/monev/radir/monev-table.tsx
"use client";

import { useState } from "react";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getPaginationRowModel,
    ColumnFiltersState,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import { Search, ClipboardList, CheckCircle2, Clock } from "lucide-react";
import { MonevAgendaItem } from "@/server/actions/monev-radir-actions";
import { columns } from "./columns";

interface MonevTableProps {
    data: MonevAgendaItem[];
}

export function MonevTable({ data }: MonevTableProps) {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState("");

    // Use all data (no status filter)
    const filteredData = data;

    const table = useReactTable({
        data: filteredData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onColumnFiltersChange: setColumnFilters,
        state: {
            columnFilters,
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    // Pagination helpers
    const pageCount = table.getPageCount();
    const currentPage = table.getState().pagination.pageIndex;

    const getVisiblePages = () => {
        const pages: (number | "ellipsis")[] = [];
        const maxVisible = 5;

        if (pageCount <= maxVisible) {
            for (let i = 0; i < pageCount; i++) pages.push(i);
        } else {
            if (currentPage <= 2) {
                for (let i = 0; i < 4; i++) pages.push(i);
                pages.push("ellipsis");
                pages.push(pageCount - 1);
            } else if (currentPage >= pageCount - 3) {
                pages.push(0);
                pages.push("ellipsis");
                for (let i = pageCount - 4; i < pageCount; i++) pages.push(i);
            } else {
                pages.push(0);
                pages.push("ellipsis");
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push("ellipsis");
                pages.push(pageCount - 1);
            }
        }
        return pages;
    };

    // Stats - count total decisions across all agendas
    const totalAgendas = data.length;
    const totalDecisions = data.reduce((sum, d) => sum + d.totalDecisions, 0);
    const completedDecisions = data.reduce((sum, d) => sum + d.completedDecisions, 0);
    const inProgressCount = totalDecisions - completedDecisions;

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                            <ClipboardList className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{totalAgendas}</p>
                            <p className="text-xs text-muted-foreground">Total Agenda</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100">
                            <ClipboardList className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{totalDecisions}</p>
                            <p className="text-xs text-muted-foreground">Total Keputusan</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-100">
                            <Clock className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-orange-600">{inProgressCount}</p>
                            <p className="text-xs text-muted-foreground">Dalam Proses</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{completedDecisions}</p>
                            <p className="text-xs text-muted-foreground">Selesai</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white rounded-lg border p-4 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari agenda, keputusan, atau narahubung..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-10 bg-slate-50 border-slate-200"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/80">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-gray-50/80">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="py-4">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="hover:bg-slate-50/50"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="align-top">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-32 text-center"
                                >
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <ClipboardList className="h-8 w-8 text-slate-300" />
                                        <p>Belum ada data monitoring keputusan rapat.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Footer info */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground px-1">
                <div className="flex items-center gap-4">
                    <span>
                        Menampilkan {table.getRowModel().rows.length} dari {filteredData.length} agenda
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs">Baris per halaman:</span>
                        <Select
                            value={String(table.getState().pagination.pageSize)}
                            onValueChange={(value) => table.setPageSize(Number(value))}
                        >
                            <SelectTrigger className="h-8 w-17.5">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Pagination Controls */}
                {pageCount > 1 && (
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        table.previousPage();
                                    }}
                                    className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>

                            {getVisiblePages().map((page, idx) =>
                                page === "ellipsis" ? (
                                    <PaginationItem key={`ellipsis-${idx}`}>
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                ) : (
                                    <PaginationItem key={page}>
                                        <PaginationLink
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                table.setPageIndex(page);
                                            }}
                                            isActive={currentPage === page}
                                        >
                                            {page + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                )
                            )}

                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        table.nextPage();
                                    }}
                                    className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}

                <span className="text-xs">
                    Halaman {currentPage + 1} dari {pageCount || 1}
                </span>
            </div>
        </div>
    );
}
