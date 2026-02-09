// src/components/layout/dynamic-breadcrumb.tsx
"use client";

import { usePathname } from "next/navigation";
import { Fragment } from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Mapping segment to readable label
const segmentLabels: Record<string, string> = {
    dashboard: "Dashboard",
    agenda: "Agenda",
    "agenda-siap": "Agenda Siap",
    "jadwal-rapat": "Jadwal Rapat",
    radir: "RADIR",
    rakordir: "RAKORDIR",
    input: "Input Risalah",
    create: "Buat Baru",
    edit: "Edit",
    settings: "Pengaturan",
    users: "Pengguna",
    profile: "Profil",
};

// Segments to skip/hide from breadcrumb
const hiddenSegments: string[] = [
    "pelaksanaan-rapat",
    "agenda",
    "agenda-siap",
    "monev",
    "jadwal-rapat",

];

// Function to get readable label from segment
function getSegmentLabel(segment: string): string {
    // Check if segment is in predefined labels
    const label = segmentLabels[segment.toLowerCase()];
    if (label) {
        return label;
    }

    // If segment looks like an ID or encoded string, show generic label
    if (segment.includes("%") || segment.match(/^[a-f0-9-]{36}$/i)) {
        return "Detail";
    }

    // Capitalize first letter and replace hyphens with spaces
    return segment
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export function DynamicBreadcrumb() {
    const pathname = usePathname();

    // Split pathname into segments, filter empty strings and hidden segments
    const segments = pathname.split("/").filter(Boolean).filter(
        segment => !hiddenSegments.includes(segment.toLowerCase())
    );

    // Build breadcrumb items with cumulative paths
    const breadcrumbItems = segments.map((segment, index) => {
        const path = "/" + segments.slice(0, index + 1).join("/");
        const label = getSegmentLabel(segment);
        const isLast = index === segments.length - 1;

        return {
            path,
            label,
            isLast,
        };
    });

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {breadcrumbItems.map((item, index) => (
                    <Fragment key={item.path}>
                        {index > 0 && (
                            <BreadcrumbSeparator className="hidden md:block" />
                        )}
                        <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                            {item.isLast ? (
                                <BreadcrumbPage>{item.label}</BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink href={item.path}>{item.label}</BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                    </Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
