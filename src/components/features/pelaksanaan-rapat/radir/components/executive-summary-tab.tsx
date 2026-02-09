// src/components/features/pelaksanaan-rapat/radir/components/executive-summary-tab.tsx
"use client";

import { FileText } from "lucide-react";

import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ExecutiveSummaryTabProps {
    executiveSummary: string;
    onExecutiveSummaryChange: (value: string) => void;
}

export function ExecutiveSummaryTab({
    executiveSummary,
    onExecutiveSummaryChange,
}: ExecutiveSummaryTabProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#006070]" />
                    Executive Summary
                </CardTitle>
                <CardDescription className="text-xs">
                    Ringkasan eksekutif dari pembahasan rapat (mendukung format rich text)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <RichTextEditor
                    value={executiveSummary}
                    onChange={onExecutiveSummaryChange}
                    placeholder="Tuliskan ringkasan eksekutif dari pembahasan rapat..."
                    minHeight="320px"
                />
            </CardContent>
        </Card>
    );
}
