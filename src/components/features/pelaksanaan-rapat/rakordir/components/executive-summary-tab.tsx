// src/components/features/pelaksanaan-rapat/rakordir/components/executive-summary-tab.tsx
"use client";

import { FileText, Keyboard } from "lucide-react";

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
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1">
                    <Keyboard className="h-3 w-3" />
                    <span><kbd className="px-1 py-0.5 bg-slate-100 border rounded text-[10px] font-mono">Enter</kbd> lanjut list • <kbd className="px-1 py-0.5 bg-slate-100 border rounded text-[10px] font-mono">Shift+Enter</kbd> baris baru dalam item</span>
                </div>
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
