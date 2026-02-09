/* eslint-disable react-hooks/incompatible-library */
// src/components/features/dashboard/agenda-table.tsx
"use client";

import * as React from "react";
import {
    ColumnDef,
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
    SlidersHorizontal,
    X,
    FileText,
    Filter,
    Phone,
} from "lucide-react";
import type { AllAgendaItem } from "@/server/actions/dashboard-actions";

interface AgendaTableProps {
    data: AllAgendaItem[];
    initialFilter?: {
        statusKey?: string;
        category?: "RADIR" | "RAKORDIR" | "all";
    } | null;
    onClearFilter?: () => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: "Draft", color: "text-slate-600", bg: "bg-slate-100" },
    canProceed: { label: "Dapat Dilanjutkan", color: "text-[#14a2ba]", bg: "bg-[#e7f6f9]" },
    scheduled: { label: "Dijadwalkan", color: "text-[#125d72]", bg: "bg-[#e7f6f9]" },
    postponed: { label: "Ditunda", color: "text-[#b5a800]", bg: "bg-[#efe62f]/20" },
    completed: { label: "Selesai", color: "text-emerald-600", bg: "bg-emerald-50" },
    cancelled: { label: "Dibatalkan", color: "text-red-500", bg: "bg-red-50" },
};

const monevStatusConfig: Record<string, { color: string; bg: string }> = {
    "Selesai": { color: "text-emerald-600", bg: "bg-emerald-50" },
    "Sebagian Selesai": { color: "text-amber-600", bg: "bg-amber-50" },
    "Dalam Proses": { color: "text-blue-600", bg: "bg-blue-50" },
    "Belum Ada": { color: "text-slate-400", bg: "bg-slate-50" },
    "-": { color: "text-slate-400", bg: "bg-slate-50" },
};

export function AgendaTable({ data, initialFilter, onClearFilter }: AgendaTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [globalFilter, setGlobalFilter] = React.useState("");

    // Apply initial filter when it changes
    React.useEffect(() => {
        if (initialFilter) {
            const newFilters: ColumnFiltersState = [];

            if (initialFilter.statusKey) {
                newFilters.push({ id: "statusKey", value: initialFilter.statusKey });
            }

            if (initialFilter.category && initialFilter.category !== "all") {
                newFilters.push({ id: "meetingType", value: initialFilter.category });
            }

            setColumnFilters(newFilters);
        } else {
            setColumnFilters([]);
        }
    }, [initialFilter]);

    const columns: ColumnDef<AllAgendaItem>[] = [
        {
            id: "no",
            header: "No",
            cell: ({ row }) => (
                <span className="font-medium text-slate-500">{row.index + 1}</span>
            ),
            enableSorting: false,
        },
        {
            accessorKey: "title",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-transparent p-0 font-bold"
                >
                    Judul Agenda
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="max-w-md">
                    <span className="line-clamp-2 font-medium">{row.getValue("title")}</span>
                </div>
            ),
        },
        {
            accessorKey: "meetingType",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-transparent p-0 font-bold"
                >
                    Jenis Rapat
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const type = row.getValue("meetingType") as string;
                return (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${type === "RADIR"
                        ? "text-[#125d72] bg-[#e7f6f9]"
                        : "text-purple-600 bg-purple-50"
                        }`}>
                        {type}
                    </span>
                );
            },
            filterFn: (row, id, value) => {
                return value === "all" || row.getValue(id) === value;
            },
        },
        {
            accessorKey: "status",
            accessorFn: (row) => row.status,
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-transparent p-0 font-bold"
                >
                    Status Agenda
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const statusKey = row.original.statusKey as keyof typeof statusConfig;
                const defaultStatusConfig = { label: "Draft", color: "text-slate-600", bg: "bg-slate-100" };
                const config = statusConfig[statusKey] ? statusConfig[statusKey] : defaultStatusConfig;
                return (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.color} ${config.bg}`}>
                        {row.original.status}
                    </span>
                );
            },
        },
        {
            accessorKey: "statusKey",
            header: "Status Key",
            filterFn: (row, id, value) => {
                return row.getValue(id) === value;
            },
            enableHiding: true,
        },
        {
            accessorKey: "monevStatus",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-transparent p-0 font-bold"
                >
                    Status Monev
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const monevStatus = row.getValue("monevStatus") as string;
                const defaultConfig = { color: "text-slate-400", bg: "bg-slate-50" };
                const config = monevStatusConfig[monevStatus] ?? defaultConfig;
                return (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.color} ${config.bg}`}>
                        {monevStatus}
                    </span>
                );
            },
        },
        {
            accessorKey: "contactPerson",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-transparent p-0 font-bold"
                >
                    Narahubung
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const contactPerson = row.getValue("contactPerson") as string | null;
                const phone = row.original.phone;

                // Format phone number for WhatsApp (remove non-digits, ensure starts with country code)
                const formatWhatsAppNumber = (phoneNumber: string): string => {
                    // Remove all non-digit characters
                    let cleaned = phoneNumber.replace(/\D/g, '');
                    // If starts with 0, replace with 62 (Indonesia)
                    if (cleaned.startsWith('0')) {
                        cleaned = '62' + cleaned.substring(1);
                    }
                    // If doesn't start with country code, add 62
                    if (!cleaned.startsWith('62')) {
                        cleaned = '62' + cleaned;
                    }
                    return cleaned;
                };

                if (!contactPerson && !phone) {
                    return <span className="text-slate-400">-</span>;
                }

                return (
                    <div className="flex flex-col gap-1">
                        {contactPerson && (
                            <span className="text-slate-600 font-medium">{contactPerson}</span>
                        )}
                        {phone && (
                            <a
                                href={`https://wa.me/${formatWhatsAppNumber(phone)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 hover:underline"
                            >
                                <Phone size={12} />
                                <span>{phone}</span>
                            </a>
                        )}
                    </div>
                );
            },
        },
    ];

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: "includesString",
        state: {
            sorting,
            columnFilters,
            columnVisibility: {
                ...columnVisibility,
                statusKey: false, // Hide statusKey column
            },
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    const activeFilterCount = columnFilters.length + (globalFilter ? 1 : 0);

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="relative bg-linear-to-br from-[#125d72] via-[#0f4d5c] to-[#0a3440] p-4 text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#14a2ba]/10 rounded-full blur-xl" />

                <div className="relative flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20">
                        <FileText size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black leading-tight tracking-tight uppercase">Daftar Seluruh Agenda</h2>
                        <p className="text-xs text-white/60 font-medium">Semua agenda rapat RADIR & RAKORDIR</p>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Cari agenda..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="pl-9 max-w-sm"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2">
                        <Select
                            value={(table.getColumn("meetingType")?.getFilterValue() as string) || "all"}
                            onValueChange={(value) =>
                                table.getColumn("meetingType")?.setFilterValue(value === "all" ? undefined : value)
                            }
                        >
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Jenis Rapat" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Jenis</SelectItem>
                                <SelectItem value="RADIR">RADIR</SelectItem>
                                <SelectItem value="RAKORDIR">RAKORDIR</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={(table.getColumn("statusKey")?.getFilterValue() as string) || "all"}
                            onValueChange={(value) =>
                                table.getColumn("statusKey")?.setFilterValue(value === "all" ? undefined : value)
                            }
                        >
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="Status Agenda" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                {Object.entries(statusConfig).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>
                                        {config.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Column Visibility */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <SlidersHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {table
                                    .getAllColumns()
                                    .filter((column) => column.getCanHide() && column.id !== "statusKey")
                                    .map((column) => {
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(!!value)
                                                }
                                            >
                                                {column.id === "meetingType" ? "Jenis Rapat" :
                                                    column.id === "status" ? "Status Agenda" :
                                                        column.id === "monevStatus" ? "Status Monev" :
                                                            column.id === "contactPerson" ? "Narahubung" :
                                                                column.id === "title" ? "Judul Agenda" :
                                                                    column.id}
                                            </DropdownMenuCheckboxItem>
                                        );
                                    })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Active Filters */}
                {(activeFilterCount > 0 || initialFilter) && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Filter size={12} />
                            Filter aktif:
                        </span>

                        {initialFilter?.category && initialFilter.category !== "all" && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-600">
                                {initialFilter.category}
                            </span>
                        )}

                        {initialFilter?.statusKey && (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[initialFilter.statusKey]?.bg} ${statusConfig[initialFilter.statusKey]?.color}`}>
                                {statusConfig[initialFilter.statusKey]?.label}
                            </span>
                        )}

                        {(activeFilterCount > 0 || initialFilter) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setColumnFilters([]);
                                    setGlobalFilter("");
                                    onClearFilter?.();
                                }}
                                className="h-6 px-2 text-xs text-slate-500 hover:text-slate-700"
                            >
                                <X size={12} className="mr-1" />
                                Hapus Filter
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="bg-slate-50">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="font-bold text-slate-600">
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
                                        <TableCell key={cell.id}>
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
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <FileText size={32} className="mb-2" />
                                        <p className="font-medium">Tidak ada data</p>
                                        <p className="text-sm">Belum ada agenda yang tersedia</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>Menampilkan</span>
                    <Select
                        value={String(table.getState().pagination.pageSize)}
                        onValueChange={(value) => table.setPageSize(Number(value))}
                    >
                        <SelectTrigger className="h-8 w-16">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[5, 10, 20, 50].map((size) => (
                                <SelectItem key={size} value={String(size)}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span>
                        dari {table.getFilteredRowModel().rows.length} data
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">
                        Halaman {table.getState().pagination.pageIndex + 1} dari{" "}
                        {table.getPageCount()}
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
