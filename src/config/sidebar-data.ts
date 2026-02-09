import {
    PieChart,
    FileText,
    Calendar,
    Gavel,
    Activity,
    Settings2,
    Users,
    type LucideIcon,
} from "lucide-react";

export interface SubItem {
    title: string;
    url: string;
}

export interface NavItem {
    title: string;
    url: string;
    icon: LucideIcon;
    items?: SubItem[];
    isActive?: boolean;
}

export const sidebarData = {
    teams: [
        {
            name: "Board Meeting",
            logo: "/Logo_PLN.svg", // Menggunakan SVG yang sudah ada
            plan: "PT PLN (Persero)",
        },
    ],
    navMain: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: PieChart,
            isActive: true,
            items: [
                { title: "Ringkasan", url: "/dashboard" },
                { title: "Jadwal Rapat", url: "/dashboard/jadwal-rapat" },
            ],
        },
        {
            title: "Usulan Agenda",
            url: "#",
            icon: FileText,
            items: [
                { title: "Kepdir Sirkuler", url: "/dashboard/agenda/kepdir-sirkuler" },
                { title: "Rapat Direksi (RADIR)", url: "/dashboard/agenda/radir" },
                { title: "Rapat Koordinasi (RAKORDIR)", url: "/dashboard/agenda/rakordir" },
            ],
        },
        {
            title: "Agenda Siap RAPAT",
            url: "#",
            icon: Calendar,
            items: [
                { title: "Siap RAPAT Radir", url: "/dashboard/agenda-siap/radir" },
                { title: "Siap RAPAT Rakordir", url: "/dashboard/agenda-siap/rakordir" },
            ],
        },
        {
            title: "Pelaksanaan Rapat",
            url: "#",
            icon: Gavel,
            items: [
                { title: "Radir", url: "/dashboard/pelaksanaan-rapat/radir" },
                { title: "Rakordir", url: "/dashboard/pelaksanaan-rapat/rakordir" },
            ],
        },
        {
            title: "Monitoring & Evaluasi",
            url: "#",
            icon: Activity,
            items: [
                { title: "Monev Radir", url: "/monev/radir" },
                { title: "Monev Rakordir", url: "/monev/rakordir" },
            ],
        },
    ] as NavItem[],
    projects: [
        {
            name: "Pengaturan",
            url: "/dashboard/settings",
            icon: Settings2,
        },
        {
            name: "User Management",
            url: "/dashboard/users",
            icon: Users,
        },
    ],
};