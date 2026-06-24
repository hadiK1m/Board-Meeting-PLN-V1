"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Calendar as CalendarIcon, Filter, Trash2, Download, FileSpreadsheet } from "lucide-react";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface AgendaToolbarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    statusFilter: string[];
    onStatusChange: (value: string[]) => void;
    dateFilter: Date | undefined;
    onDateChange: (date: Date | undefined) => void;
    onReset: () => void;
    selectedCount?: number;
    onDeleteBulk?: () => void;
    onExportCsv?: () => void;
    onExportExcel?: () => void;
}

export function AgendaToolbar({ searchQuery, onSearchChange, statusFilter, onStatusChange, dateFilter, onDateChange, selectedCount = 0, onDeleteBulk, onExportCsv, onExportExcel }: AgendaToolbarProps) {
    const statuses = ["Draft", "Dapat Dilanjutkan", "Dijadwalkan", "Ditunda", "Dibatalkan", "Selesai"];
    const toggleStatus = (status: string) => {
        if (statusFilter.includes(status)) onStatusChange(statusFilter.filter((s) => s !== status));
        else onStatusChange([...statusFilter, status]);
    };

    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-2">
            <div className="flex flex-1 items-center space-x-2">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input placeholder="Cari agenda rapat..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-9 pr-8 h-9 bg-white" />
                    {searchQuery && (<Button variant="ghost" onClick={() => onSearchChange("")} className="absolute right-0 top-0 h-9 w-9 p-0 hover:bg-transparent text-muted-foreground hover:text-slate-900"><X className="h-4 w-4" /><span className="sr-only">Clear search</span></Button>)}
                </div>
                {selectedCount > 0 && onDeleteBulk && (
                    <Button variant="destructive" size="sm" className="h-9 px-3 animate-in fade-in slide-in-from-left-5 font-bold shadow-sm" onClick={onDeleteBulk}>
                        <Trash2 className="h-4 w-4 mr-2" /> Hapus ({selectedCount})
                    </Button>
                )}
                {selectedCount > 0 && onExportCsv && (
                    <Button variant="outline" size="sm" className="h-9 px-3 border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 font-bold shadow-sm" onClick={onExportCsv}>
                        <Download className="h-4 w-4 mr-2" /> CSV ({selectedCount})
                    </Button>
                )}
                {selectedCount > 0 && onExportExcel && (
                    <Button variant="outline" size="sm" className="h-9 px-3 border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 font-bold shadow-sm" onClick={onExportExcel}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel ({selectedCount})
                    </Button>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 border-dashed bg-white px-3 flex items-center gap-2">
                            <Filter className="h-4 w-4" /> Status {statusFilter.length > 0 && (<><span className="ml-1 rounded-sm bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary">{statusFilter.length}</span><div role="button" onClick={(e) => { e.stopPropagation(); onStatusChange([]); }} className="ml-1 hover:bg-slate-200 rounded-full p-0.5 transition-colors group-hover:text-red-500"><X className="h-3 w-3 text-muted-foreground" /></div></>)}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {statuses.map((status) => (<DropdownMenuCheckboxItem key={status} checked={statusFilter.includes(status)} onCheckedChange={() => toggleStatus(status)} onSelect={(e) => e.preventDefault()} className="cursor-pointer">{status}</DropdownMenuCheckboxItem>))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} size="sm" className={cn("h-9 justify-start text-left font-normal border-dashed bg-white px-3 flex items-center gap-2", !dateFilter && "text-muted-foreground")}>
                            <CalendarIcon className="h-4 w-4" /> {dateFilter ? (<>{format(dateFilter, "PPP", { locale: id })}<div role="button" onClick={(e) => { e.stopPropagation(); onDateChange(undefined); }} className="ml-auto hover:bg-slate-200 rounded-full p-0.5 transition-colors group-hover:text-red-500"><X className="h-3 w-3 text-muted-foreground" /></div></>) : ("Tanggal")}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={dateFilter} onSelect={onDateChange} initialFocus captionLayout="dropdown" fromYear={2020} toYear={2030} classNames={{ caption_dropdowns: "flex justify-center gap-1", dropdown: "p-1 rounded-md bg-transparent text-sm font-medium cursor-pointer hover:bg-slate-100", caption_label: "hidden", }} />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
