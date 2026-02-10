"use client";

import * as React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation"; // Untuk cek URL aktif
import { ChevronRight, MoreHorizontal, LogOut } from "lucide-react";
import { sidebarData } from "@/config/sidebar-data";
import { logoutAction } from "@/actions/auth/logout"; // Import Action Logout
import { showNotify } from "@/components/shared/toast-provider"; // Toast notifikasi
import { cn } from "@/lib/utils";
import type { CurrentUserData } from "@/server/actions/user-actions";

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- HELPER HOOK UNTUK PERSISTENCE ---
// Menyimpan status buka/tutup menu di LocalStorage
function useMenuPersistence() {
    const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({});

    // 1. Load state saat pertama kali render (Client-Side only)
    React.useEffect(() => {
        const savedState = localStorage.getItem("sidebar-menu-state");
        if (savedState) {
            setOpenMenus(JSON.parse(savedState));
        }
    }, []);

    // 2. Fungsi untuk toggle dan simpan ke storage
    const toggleMenu = (title: string, isOpen: boolean) => {
        const newState = { ...openMenus, [title]: isOpen };
        setOpenMenus(newState);
        localStorage.setItem("sidebar-menu-state", JSON.stringify(newState));
    };

    return { openMenus, toggleMenu };
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    user: CurrentUserData | null;
}

export function AppSidebar({ className, user, ...props }: AppSidebarProps) {
    const activeTeam = sidebarData.teams[0];
    const pathname = usePathname(); // Dapatkan URL saat ini
    const { openMenus, toggleMenu } = useMenuPersistence();

    // --- HANDLER LOGOUT AMAN ---
    const handleLogout = async () => {
        // 1. Tampilkan notifikasi "Sedang keluar" (Opsional, bisa dihapus jika ingin silent)
        showNotify("Mengakhiri sesi...", "info");

        // 2. Panggil Action.
        // JANGAN gunakan try-catch di sini karena redirect() akan dianggap error oleh catch.
        // Jika logout sukses, server akan melempar redirect signal yang ditangani otomatis oleh Next.js
        await logoutAction();
    };

    return (
        <Sidebar collapsible="icon" className={cn("z-50", className)} {...props} suppressHydrationWarning>
            {/* --- HEADER --- */}
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex aspect-square size-14 items-center justify-center">
                                <Image
                                    src={activeTeam?.logo || "/Logo_PLN.svg"}
                                    alt="PLN"
                                    width={56}
                                    height={56}
                                    className="size-14"
                                />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{activeTeam?.name}</span>
                                <span className="truncate text-xs">{activeTeam?.plan}</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* Separator dihapus sesuai request sebelumnya */}

            {/* --- CONTENT --- */}
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
                    <SidebarMenu>
                        {sidebarData.navMain.map((item) => {
                            // Cek apakah salah satu sub-item sedang aktif berdasarkan URL
                            const isChildActive = item.items?.some(
                                (sub) => sub.url === pathname
                            );

                            // Logika Buka/Tutup:
                            // 1. Prioritas Utama: State dari LocalStorage (openMenus)
                            // 2. Fallback: Jika URL aktif ada di dalam menu ini, buka otomatis
                            const isOpen = openMenus[item.title] ?? isChildActive ?? false;

                            return (
                                <Collapsible
                                    key={item.title}
                                    asChild
                                    open={isOpen}
                                    onOpenChange={(open) => toggleMenu(item.title, open)}
                                    className="group/collapsible"
                                >
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton tooltip={item.title} suppressHydrationWarning>
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent suppressHydrationWarning>
                                            <SidebarMenuSub>
                                                {item.items?.map((subItem) => (
                                                    <SidebarMenuSubItem key={subItem.title}>
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            isActive={subItem.url === pathname} // Highlight item aktif
                                                        >
                                                            <a href={subItem.url}>
                                                                <span>{subItem.title}</span>
                                                            </a>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>

                <SidebarGroup className="group-data-[collapsible=icon]:hidden">
                    <SidebarGroupLabel>Lainnya</SidebarGroupLabel>
                    <SidebarMenu>
                        {sidebarData.projects.map((item) => (
                            <SidebarMenuItem key={item.name}>
                                <SidebarMenuButton asChild isActive={item.url === pathname}>
                                    <a href={item.url}>
                                        <item.icon />
                                        <span>{item.name}</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            {/* --- FOOTER --- */}
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage src="" alt={user?.fullName || "User"} />
                                        <AvatarFallback className="rounded-lg">{user?.initials || "U"}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{user?.fullName || "Guest"}</span>
                                        <span className="truncate text-xs">{user?.email || ""}</span>
                                    </div>
                                    <MoreHorizontal className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                side="bottom"
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                        <Avatar className="h-8 w-8 rounded-lg">
                                            <AvatarFallback className="rounded-lg">{user?.initials || "U"}</AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold">{user?.fullName || "Guest"}</span>
                                            <span className="truncate text-xs">{user?.role || "User"}</span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>

                                {/* TOMBOL LOGOUT IMPLEMENTASI */}
                                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}