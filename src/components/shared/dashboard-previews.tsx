"use client";

import React from "react";
import {
    Search,
    Bell,
    CircleHelp,
    UserCircle,
    FileSearch,
    LayoutDashboard,
    CalendarDays,
    FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * DASHBOARD MOCKUP COMPONENT
 * Fitur: Snake Border Animation, Ghost UI, Estetik Empty State.
 * Tanpa logic business, murni untuk visual preview di halaman Login/Landing.
 */
export function DashboardMockup() {
    return (
        <div className="relative group w-full max-w-4xl mx-auto mt-8">
            {/* --- SNAKE BORDER EFFECT --- */}
            <div className="absolute -inset-0.5 rounded-xl bg-conic-gradient from-blue-500 via-cyan-400 to-indigo-600 animate-[spin_4s_linear_infinite] opacity-75 blur-[1px] group-hover:opacity-100 transition-opacity duration-500" />

            {/* --- MAIN CONTAINER --- */}
            <div className="relative flex flex-col w-full bg-background rounded-[10px] overflow-hidden border border-border/50 shadow-2xl">

                {/* --- HEADER 1: TABS --- */}
                <div className="flex items-center px-4 border-b border-border bg-muted/30 h-12">
                    <div className="flex gap-4 h-full">
                        <TabItem icon={<LayoutDashboard size={14} />} label="Dashboard" active />
                        <TabItem icon={<CalendarDays size={14} />} label="Rapat" />
                        <TabItem icon={<FileText size={14} />} label="Dokumen" />
                    </div>
                </div>

                {/* --- HEADER 2: SEARCH & PROFILE --- */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
                    <div className="flex items-center gap-3 bg-muted/50 border border-border rounded-md px-3 py-1.5 w-64">
                        <Search className="text-muted-foreground" size={16} />
                        <div className="h-4 w-full bg-muted-foreground/20 rounded-sm animate-pulse" />
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground">
                        <CircleHelp size={20} className="hover:text-primary transition-colors cursor-pointer" />
                        <Bell size={20} className="hover:text-primary transition-colors cursor-pointer" />
                        <UserCircle size={28} className="text-muted-foreground/50" />
                    </div>
                </div>

                {/* --- CONTENT AREA: EMPTY STATE --- */}
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                        <FileSearch size={80} className="relative text-primary/40 animate-bounce animation-duration-[3s]" />
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight">Menunggu Jadwal</h3>
                    <p className="text-muted-foreground max-w-70 mt-2 text-sm">
                        Belum ada rapat yang dijadwalkan untuk hari ini. Silakan periksa kalender Anda.
                    </p>
                </div>

                {/* --- FOOTER: GHOST UI / SKELETON --- */}
                <div className="p-6 bg-muted/20 border-t border-border mt-auto">
                    <div className="grid grid-cols-3 gap-4">
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                </div>
            </div>
        </div>
    );
}

/** --- SUB-COMPONENTS (Local) --- **/

function TabItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <div className={cn(
            "flex items-center gap-2 px-3 text-xs font-medium cursor-default transition-all border-b-2",
            active ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground"
        )}>
            {icon}
            {label}
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="space-y-3 p-4 border border-border/50 rounded-lg bg-card/50">
            <div className="h-3 w-3/4 bg-muted rounded-full animate-pulse" />
            <div className="h-2 w-full bg-muted/60 rounded-full animate-pulse" />
            <div className="h-2 w-1/2 bg-muted/60 rounded-full animate-pulse" />
        </div>
    );
}