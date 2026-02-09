// src/components/features/dashboard/attendance-chart.tsx
"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, Cell } from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Users, Loader2 } from "lucide-react";
import { getDirectorAttendanceData, type DirectorAttendanceData, type AttendancePeriod } from "@/server/actions/dashboard-actions";

interface AttendanceChartProps {
    data: DirectorAttendanceData[];
}

const chartConfig = {
    hadir: {
        label: "Hadir",
        color: "#125d72",
    },
    hadirDisplay: {
        label: "Hadir",
        color: "#125d72",
    },
    kuasa: {
        label: "Kuasa",
        color: "#efe62f",
    },
    kuasaDisplay: {
        label: "Kuasa",
        color: "#efe62f",
    },
} satisfies ChartConfig;

const periodOptions = [
    { value: "3m", label: "3 Bulan Terakhir" },
    { value: "6m", label: "6 Bulan Terakhir" },
    { value: "1y", label: "1 Tahun Terakhir" },
];

// Minimum display value for bars when actual value is 0
const MIN_DISPLAY = 0.3;

export function AttendanceChart({ data: initialData }: AttendanceChartProps) {
    const [period, setPeriod] = useState<AttendancePeriod>("6m");
    const [data, setData] = useState<DirectorAttendanceData[]>(initialData);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        startTransition(async () => {
            const newData = await getDirectorAttendanceData(period);
            setData(newData);
        });
    }, [period]);

    // Transform data to ensure bars are always visible
    const chartData = useMemo(() => {
        return data.map((d) => ({
            ...d,
            hadirOriginal: d.hadir,
            hadirDisplay: d.hadir === 0 ? MIN_DISPLAY : d.hadir,
            kuasaOriginal: d.kuasa,
            kuasaDisplay: d.kuasa === 0 ? MIN_DISPLAY : d.kuasa,
        }));
    }, [data]);

    const totalMeetings = data.length > 0 && data[0] ? data[0].totalMeetings : 0;
    const totalHadir = data.reduce((sum, d) => sum + d.hadir, 0);
    const totalAll = data.reduce((sum, d) => sum + d.hadir + d.kuasa, 0);
    const attendanceRate = totalAll > 0 ? Math.round((totalHadir / totalAll) * 100) : 0;

    const currentPeriodLabel = periodOptions.find(p => p.value === period)?.label || "6 Bulan Terakhir";

    if (data.length === 0 && !isPending) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-[#125d72]" />
                            Kehadiran Direksi
                        </CardTitle>
                        <CardDescription>Rapat Direksi (RADIR)</CardDescription>
                    </div>
                    <Select value={period} onValueChange={(v) => setPeriod(v as AttendancePeriod)}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Pilih periode" />
                        </SelectTrigger>
                        <SelectContent>
                            {periodOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    <div className="h-40 flex items-center justify-center text-muted-foreground">
                        Belum ada data kehadiran
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-[#125d72]" />
                        Kehadiran Direksi
                    </CardTitle>
                    <CardDescription>
                        Data kehadiran dari {totalMeetings} Rapat Direksi (RADIR) - {currentPeriodLabel}
                    </CardDescription>
                </div>
                <Select value={period} onValueChange={(v) => setPeriod(v as AttendancePeriod)}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Pilih periode" />
                    </SelectTrigger>
                    <SelectContent>
                        {periodOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="relative">
                {isPending && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                        <Loader2 className="h-6 w-6 animate-spin text-[#125d72]" />
                    </div>
                )}
                <ChartContainer config={chartConfig} className="h-48 w-full">
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.length > 15 ? value.slice(0, 12) + "..." : value}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    indicator="dashed"
                                    formatter={(value, name, props) => {
                                        // Show original values in tooltip, not the display values
                                        if (name === "hadirDisplay") {
                                            const originalValue = props.payload?.hadirOriginal ?? 0;
                                            return [originalValue, "Hadir"];
                                        }
                                        if (name === "kuasaDisplay") {
                                            const originalValue = props.payload?.kuasaOriginal ?? 0;
                                            return [originalValue, "Kuasa"];
                                        }
                                        return [value, name];
                                    }}
                                />
                            }
                        />
                        <Bar dataKey="hadirDisplay" fill="var(--color-hadir)" radius={4}>
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-hadir-${index}`}
                                    fill={entry.hadirOriginal === 0 ? "rgba(18, 93, 114, 0.3)" : "#125d72"}
                                />
                            ))}
                        </Bar>
                        <Bar dataKey="kuasaDisplay" fill="var(--color-kuasa)" radius={4}>
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.kuasaOriginal === 0 ? "rgba(239, 230, 47, 0.3)" : "#efe62f"}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex w-full items-center justify-between">
                    <div className="flex gap-2 leading-none font-medium">
                        Tingkat kehadiran {attendanceRate}% dari total {totalMeetings} rapat
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">
                        * Data diambil dari rapat yang telah selesai.
                    </p>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground leading-none">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-[#125d72]" />
                        <span>Hadir</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-[#efe62f]" />
                        <span>Kuasa</span>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
