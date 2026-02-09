// src/components/features/dashboard/dashboard-content.tsx
"use client";

import { useState, useRef } from "react";
import { DashboardCards, type StatusFilter } from "./dashboard-cards";
import { AgendaTable } from "./agenda-table";
import type { DashboardCategoryData, AllAgendaItem } from "@/server/actions/dashboard-actions";

interface DashboardContentProps {
    dashboardData: DashboardCategoryData[];
    allAgendas: AllAgendaItem[];
}

export function DashboardContent({ dashboardData, allAgendas }: DashboardContentProps) {
    const [tableFilter, setTableFilter] = useState<{
        statusKey?: string;
        category?: "RADIR" | "RAKORDIR" | "all";
    } | null>(null);

    const tableRef = useRef<HTMLDivElement>(null);

    const handleStatusClick = (filter: StatusFilter) => {
        setTableFilter({
            statusKey: filter.statusKey,
            category: filter.category,
        });

        // Scroll to table smoothly
        setTimeout(() => {
            tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    };

    const handleClearFilter = () => {
        setTableFilter(null);
    };

    return (
        <div className="space-y-6">
            {/* Dashboard Cards */}
            <DashboardCards data={dashboardData} onStatusClick={handleStatusClick} />

            {/* Agenda Table */}
            <div ref={tableRef}>
                <AgendaTable
                    data={allAgendas}
                    initialFilter={tableFilter}
                    onClearFilter={handleClearFilter}
                />
            </div>
        </div>
    );
}
