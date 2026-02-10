import { cookies } from "next/headers"; // ✅ Import wajib untuk baca cookie di server
import { AppSidebarWrapper } from "@/components/layout/app-sidebar-wrapper";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // 1. Baca status sidebar dari cookie
    const cookieStore = await cookies();
    const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

    return (
        // 2. Kirim status tersebut ke SidebarProvider agar Server & Client sinkron
        <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebarWrapper />
            <SidebarInset>
                {/* --- HEADER DASHBOARD (Sticky) --- */}
                <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sticky top-0 bg-background z-10">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <DynamicBreadcrumb />
                    </div>
                </header>

                {/* --- MAIN CONTENT --- */}
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}