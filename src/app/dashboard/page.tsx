import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getDashboardData, getDirectorAttendanceData, getAllAgendas } from "@/server/actions/dashboard-actions";
import { DashboardContent } from "@/components/features/dashboard/dashboard-content";
import { AttendanceChart } from "@/components/features/dashboard/attendance-chart";
import { Separator } from "@/components/ui/separator";
import { LayoutDashboard } from "lucide-react";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const [dashboardData, attendanceData, allAgendas] = await Promise.all([
        getDashboardData(),
        getDirectorAttendanceData(),
        getAllAgendas(),
    ]);

    return (
        <div className="flex flex-col h-full space-y-6 p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-1.5 self-stretch bg-[#125d72] rounded-full" />
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-none flex items-center gap-2">
                            <LayoutDashboard className="h-6 w-6 text-[#125d72]" />
                            Dashboard
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Ringkasan status agenda dan monitoring evaluasi rapat.
                        </p>
                    </div>
                </div>
            </div>

            <Separator />
            {/* Attendance Chart */}
            <Suspense fallback={<div className="p-10 text-center">Memuat chart...</div>}>
                <AttendanceChart data={attendanceData} />
            </Suspense>

            {/* Dashboard Content (Cards + Table) */}
            <Suspense fallback={<div className="p-10 text-center">Memuat data...</div>}>
                <DashboardContent dashboardData={dashboardData} allAgendas={allAgendas} />
            </Suspense>

        </div>
    );
}