// src/components/features/pelaksanaan-rapat/radir/components/agenda-selector.tsx
"use client";

import { FileText, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Agenda {
    id: string;
    title: string;
    status: string;
    director: string | null;
    initiator: string | null;
}

interface AgendaSelectorProps {
    agendas: Agenda[];
    selectedAgendaId: string;
    onSelectAgenda: (agendaId: string) => void;
}

export function AgendaSelector({
    agendas,
    selectedAgendaId,
    onSelectAgenda,
}: AgendaSelectorProps) {
    if (agendas.length <= 1) {
        return null; // Don't show selector for single agenda
    }

    return (
        <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-[#006070]" />
                <span className="text-sm font-medium text-slate-700">
                    Pilih Agenda ({agendas.length} agenda)
                </span>
            </div>
            <ScrollArea className="w-full">
                <div className="flex gap-2 pb-2">
                    {agendas.map((agenda, index) => (
                        <button
                            key={agenda.id}
                            type="button"
                            onClick={() => onSelectAgenda(agenda.id)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all min-w-50 max-w-75",
                                selectedAgendaId === agenda.id
                                    ? "bg-[#006070] text-white border-[#006070] shadow-md"
                                    : "bg-white text-slate-700 border-slate-200 hover:border-[#006070]/50 hover:bg-slate-50"
                            )}
                        >
                            <Badge
                                variant={selectedAgendaId === agenda.id ? "secondary" : "outline"}
                                className={cn(
                                    "shrink-0 text-xs",
                                    selectedAgendaId === agenda.id && "bg-white/20 text-white border-white/30"
                                )}
                            >
                                {index + 1}
                            </Badge>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {agenda.title}
                                </p>
                                {agenda.director && (
                                    <p className={cn(
                                        "text-xs truncate",
                                        selectedAgendaId === agenda.id ? "text-white/70" : "text-slate-500"
                                    )}>
                                        {agenda.director}
                                    </p>
                                )}
                            </div>
                            {selectedAgendaId === agenda.id && (
                                <ChevronRight className="h-4 w-4 shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
