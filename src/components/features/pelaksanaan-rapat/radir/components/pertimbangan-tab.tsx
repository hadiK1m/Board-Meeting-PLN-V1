// src/components/features/pelaksanaan-rapat/radir/components/pertimbangan-tab.tsx
"use client";

import { Scale } from "lucide-react";

import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PertimbanganTabProps {
    considerations: string;
    onConsiderationsChange: (value: string) => void;
}

export function PertimbanganTab({
    considerations,
    onConsiderationsChange,
}: PertimbanganTabProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Scale className="h-4 w-4 text-[#006070]" />
                    Pertimbangan
                </CardTitle>
                <CardDescription className="text-xs">
                    Hal-hal yang menjadi pertimbangan keputusan (mendukung format rich text)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <RichTextEditor
                    value={considerations}
                    onChange={onConsiderationsChange}
                    placeholder="Tuliskan hal-hal yang menjadi pertimbangan keputusan..."
                    minHeight="320px"
                />
            </CardContent>
        </Card>
    );
}
