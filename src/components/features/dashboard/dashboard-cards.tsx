// src/components/features/dashboard/dashboard-cards.tsx
"use client";

import { Progress } from "@/components/ui/progress";
import {
    FileText,
    CheckCircle2,
    Clock,
    CalendarCheck,
    XCircle,
    Users,
    TrendingUp,
    LayoutGrid,
} from "lucide-react";
import type { DashboardCategoryData } from "@/server/actions/dashboard-actions";

export interface StatusFilter {
    statusKey: string;
    category: "RADIR" | "RAKORDIR";
}

interface DashboardCardsProps {
    data: DashboardCategoryData[];
    onStatusClick?: (filter: StatusFilter) => void;
}

const statusConfig = {
    draft: { label: "Draft", icon: FileText, color: "text-slate-500", bg: "bg-slate-100", borderColor: "border-slate-200" },
    canProceed: { label: "Dapat Dilanjutkan", icon: CheckCircle2, color: "text-[#14a2ba]", bg: "bg-[#e7f6f9]", borderColor: "border-[#14a2ba]/20" },
    scheduled: { label: "Dijadwalkan", icon: CalendarCheck, color: "text-[#125d72]", bg: "bg-[#e7f6f9]", borderColor: "border-[#125d72]/20" },
    postponed: { label: "Ditunda", icon: Clock, color: "text-[#b5a800]", bg: "bg-[#efe62f]/20", borderColor: "border-[#efe62f]/30" },
    completed: { label: "Selesai", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", borderColor: "border-emerald-200" },
    cancelled: { label: "Dibatalkan", icon: XCircle, color: "text-red-500", bg: "bg-red-50", borderColor: "border-red-200" },
};

function StatusItem({
    label,
    count,
    icon: Icon,
    color,
    bg,
    borderColor,
    onClick,
}: {
    label: string;
    count: number;
    icon: React.ElementType;
    color: string;
    bg: string;
    borderColor: string;
    onClick?: () => void;
}) {
    const isClickable = count > 0 && onClick;

    return (
        <div
            className={`${bg} ${borderColor} border rounded-xl p-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${isClickable ? 'cursor-pointer' : ''}`}
            onClick={isClickable ? onClick : undefined}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
        >
            <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">{label}</p>
                    <p className={`text-xl font-black ${color}`}>{count}</p>
                </div>
            </div>
        </div>
    );
}

function MonitoringItem({ label, current, total, percentage, color, bgColor, icon: Icon }: {
    label: string;
    current: number;
    total: number;
    percentage: number;
    color: string;
    bgColor: string;
    icon: React.ElementType;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-black ${color}`}>
                        {current} / {total}
                    </span>
                    <div className={`${bgColor} px-2 py-0.5 rounded-full`}>
                        <span className={`text-xs font-black ${color}`}>{percentage}%</span>
                    </div>
                </div>
            </div>
            <Progress
                value={percentage}
                className="h-2 bg-slate-100 rounded-full"
                indicatorClassName={`${bgColor.replace('/20', '')} rounded-full`}
            />
        </div>
    );
}

// Card Header Component
function CardHeader({ category, categoryLabel, total }: { category: string; categoryLabel: string; total: number }) {
    return (
        <div className="relative bg-linear-to-br from-[#125d72] via-[#0f4d5c] to-[#0a3440] p-4 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#14a2ba]/10 rounded-full blur-xl" />

            <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20">
                        <Users size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black leading-tight tracking-tight uppercase">{category}</h2>
                        <p className="text-xs text-white/60 font-medium">{categoryLabel}</p>
                    </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-1">
                    <span className="text-lg font-black">{total}</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">Agenda</span>
                </div>
            </div>
        </div>
    );
}

// Status Card Component
function StatusCard({ data, onStatusClick }: { data: DashboardCategoryData; onStatusClick?: (filter: StatusFilter) => void }) {
    const { category, categoryLabel, statusSummary } = data;

    const handleStatusClick = (key: string) => {
        onStatusClick?.({ statusKey: key, category });
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden h-full flex flex-col">
            <CardHeader category={category} categoryLabel={categoryLabel} total={statusSummary.total} />

            <div className="p-4 flex-1">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-[#e7f6f9] flex items-center justify-center border border-[#14a2ba]/10">
                        <LayoutGrid size={16} className="text-[#125d72]" />
                    </div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status Agenda</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((key) => {
                        const config = statusConfig[key];
                        const count = statusSummary[key];

                        return (
                            <StatusItem
                                key={key}
                                label={config.label}
                                count={count}
                                icon={config.icon}
                                color={config.color}
                                bg={config.bg}
                                borderColor={config.borderColor}
                                onClick={() => handleStatusClick(key)}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// Combined Monitoring Card Component (for all categories)
function CombinedMonitoringCard({ data }: { data: DashboardCategoryData[] }) {
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="relative bg-linear-to-br from-[#125d72] via-[#0f4d5c] to-[#0a3440] p-4 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#14a2ba]/10 rounded-full blur-xl" />

                <div className="relative flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20">
                        <TrendingUp size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black leading-tight tracking-tight uppercase">Monitoring</h2>
                        <p className="text-xs text-white/60 font-medium">Tindak Lanjut Rapat</p>
                    </div>
                </div>
            </div>

            <div className="p-4 flex-1 space-y-4">
                {data.map((item) => (
                    <div key={item.category} className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-[#e7f6f9] flex items-center justify-center">
                                <Users size={12} className="text-[#125d72]" />
                            </div>
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{item.category}</h3>
                        </div>
                        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-3">
                            <MonitoringItem
                                label="Dalam Proses"
                                current={item.monevProgress.inProgress}
                                total={item.monevProgress.total}
                                percentage={item.monevProgress.inProgressPercentage}
                                color="text-[#b5a800]"
                                bgColor="bg-[#efe62f]/20"
                                icon={Clock}
                            />
                            <MonitoringItem
                                label="Selesai"
                                current={item.monevProgress.completed}
                                total={item.monevProgress.total}
                                percentage={item.monevProgress.completedPercentage}
                                color="text-emerald-600"
                                bgColor="bg-emerald-100"
                                icon={CheckCircle2}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function DashboardCards({ data, onStatusClick }: DashboardCardsProps) {
    if (data.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                Tidak ada data tersedia
            </div>
        );
    }

    // Create 3 cards: Status for each category + Combined Monitoring
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {data.map((item) => (
                <StatusCard key={`status-${item.category}`} data={item} onStatusClick={onStatusClick} />
            ))}
            <CombinedMonitoringCard data={data} />
        </div>
    );
}
