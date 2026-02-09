// src/components/features/pelaksanaan-rapat/rakordir/components/notulensi-header.tsx
"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ArrowLeft, Save, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NotulensiHeaderProps {
    notulensiNumber: string | null;
    executionDate: string | null;
    agendaCount: number;
    isSaving: boolean;
    isFinalizing: boolean;
    onBack: () => void;
    onSave: () => void;
    onFinalize: () => void;
}

export function NotulensiHeader({
    notulensiNumber,
    executionDate,
    agendaCount,
    isSaving,
    isFinalizing,
    onBack,
    onSave,
    onFinalize,
}: NotulensiHeaderProps) {
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        try {
            return format(new Date(dateStr), "EEEE, dd MMMM yyyy", { locale: idLocale });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 -mx-8 px-8 py-4 border-b">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onBack}
                        className="shrink-0 h-10 w-10"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                Input Notulensi
                            </h1>
                            <Badge variant="outline" className="font-mono text-[#006070] border-[#006070]/30">
                                {notulensiNumber}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            {formatDate(executionDate)} • {agendaCount} Agenda
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onSave}
                        disabled={isSaving}
                        className="min-w-35"
                    >
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Simpan Draft
                    </Button>
                    <Button
                        onClick={onFinalize}
                        disabled={isFinalizing}
                        className="bg-[#006070] hover:bg-[#004d5a] min-w-40"
                    >
                        {isFinalizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Selesaikan Notulensi
                    </Button>
                </div>
            </div>
        </div>
    );
}
