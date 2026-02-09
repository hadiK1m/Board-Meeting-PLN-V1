// src/components/features/pelaksanaan-rapat/radir/components/dissenting-opinion-tab.tsx
"use client";

import { MessageSquareWarning } from "lucide-react";

import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DissentingOpinionTabProps {
    dissentingOpinion: string;
    onDissentingOpinionChange: (value: string) => void;
}

export function DissentingOpinionTab({
    dissentingOpinion,
    onDissentingOpinionChange,
}: DissentingOpinionTabProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquareWarning className="h-4 w-4 text-[#006070]" />
                    Dissenting Opinion
                </CardTitle>
                <CardDescription className="text-xs">
                    Pendapat berbeda dari peserta rapat (jika ada)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <RichTextEditor
                    value={dissentingOpinion}
                    onChange={onDissentingOpinionChange}
                    placeholder="Tuliskan dissenting opinion jika ada..."
                    minHeight="320px"
                />
            </CardContent>
        </Card>
    );
}
