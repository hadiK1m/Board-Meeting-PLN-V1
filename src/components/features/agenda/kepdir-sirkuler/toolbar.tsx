"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Filter, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface AgendaToolbarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    statusFilter: string[];
    onStatusChange: (value: string[]) => void;
    onReset: () => void;
    selectedCount?: number;
    onDeleteBulk?: () => void;
}

export function AgendaToolbar({ searchQuery, onSearchChange, statusFilter, onStatusChange, selectedCount = 0, onDeleteBulk }: AgendaToolbarProps) {
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
                    <Input placeholder="Cari agenda..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-9 pr-8 h-9 bg-white" />
                    {searchQuery && (<Button variant="ghost" onClick={() => onSearchChange("")} className="absolute right-0 top-0 h-9 w-9 p-0 hover:bg-transparent text-muted-foreground hover:text-slate-900"><X className="h-4 w-4" /><span className="sr-only">Clear search</span></Button>)}
                </div>
                {selectedCount > 0 && onDeleteBulk && (
                    <Button variant="destructive" size="sm" className="h-9 px-3 animate-in fade-in slide-in-from-left-5 font-bold shadow-sm" onClick={onDeleteBulk}>
                        <Trash2 className="h-4 w-4 mr-2" /> Hapus ({selectedCount})
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
            </div>
        </div>
    );
}
