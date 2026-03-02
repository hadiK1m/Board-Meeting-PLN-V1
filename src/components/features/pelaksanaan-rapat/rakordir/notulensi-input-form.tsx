// src/components/features/pelaksanaan-rapat/rakordir/notulensi-input-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, FileText, MessageSquare, FolderOpen } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showNotify } from "@/components/shared/toast-provider";
import { updateNotulensiAction, finalizeNotulensiAction, removeAgendaFromNotulensiAction } from "@/server/actions/pelaksanaan-rakordir-actions";

import {
    NotulensiHeader,
    MeetingInfoCard,
    KehadiranTab,
    ExecutiveSummaryTab,
    ArahanDireksiTab,
    DokumenTab,
    AgendaSelector,
} from "./components";
import type { DirectorAttendance, GuestParticipant } from "./components/kehadiran-tab";
import type { ArahanItem } from "./components/arahan-direksi-tab";

// Types for per-agenda content (RAKORDIR version - no decisions, pertimbangan, dissenting)
interface AgendaContent {
    executiveSummary: string;
    arahanDireksi: ArahanItem[];
}

interface NotulensiData {
    notulensiNumber: string | null;
    meetingYear: string | null;
    executionDate: string | null;
    startTime: string | null;
    endTime: string | null;
    meetingMethod: string | null;
    meetingLocation: string | null;
    meetingLink: string | null;
    // Shared kehadiran data
    pimpinanRapat: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attendanceData: Record<string, any>;
    guestParticipants: GuestParticipant[];
    // Per-agenda content
    perAgendaContent?: Record<string, AgendaContent>;
    // Notulensi TTD (signed document)
    notulensiTtd?: string | null;
    // Agendas list with document fields
    agendas: {
        id: string;
        title: string;
        status: string;
        director: string | null;
        initiator: string | null;
        // Document fields
        legalReview?: string | null;
        riskReview?: string | null;
        complianceReview?: string | null;
        regulationReview?: string | null;
        recommendationNote?: string | null;
        proposalNote?: string | null;
        presentationMaterial?: string | null;
        supportingDocuments?: string[];
    }[];
}

interface NotulensiInputFormProps {
    initialData: NotulensiData;
    directorOptions: { label: string; value: string }[];
}

export function NotulensiInputForm({ initialData, directorOptions }: NotulensiInputFormProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [localAgendas, setLocalAgendas] = useState(initialData.agendas);

    // Sync local state with server data when initialData changes (e.g., after router.refresh from add/remove agenda)
    useEffect(() => {
        setLocalAgendas(initialData.agendas);
        // Initialize perAgendaContent for any newly added agendas
        setPerAgendaContent(prev => {
            const updated = { ...prev };
            let hasNew = false;
            initialData.agendas.forEach(agenda => {
                if (!updated[agenda.id]) {
                    hasNew = true;
                    updated[agenda.id] = {
                        executiveSummary: initialData.perAgendaContent?.[agenda.id]?.executiveSummary || "",
                        arahanDireksi: (initialData.perAgendaContent?.[agenda.id]?.arahanDireksi as ArahanItem[]) || [],
                    };
                }
            });
            return hasNew ? updated : prev;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData.agendas]);

    // Debug: Log initial data
    console.log("=== NotulensiInputForm initialData ===");
    console.log("Notulensi Number:", initialData.notulensiNumber);
    console.log("Agendas:", initialData.agendas);
    console.log("Pimpinan Rapat from DB:", initialData.pimpinanRapat);
    console.log("Attendance Data from DB:", initialData.attendanceData);
    console.log("Guest Participants from DB:", initialData.guestParticipants);
    console.log("Per-Agenda Content from DB:", initialData.perAgendaContent);

    // Selected agenda for per-agenda tabs
    const [selectedAgendaId, setSelectedAgendaId] = useState<string>(
        initialData.agendas[0]?.id || ""
    );

    // Initialize attendance data with default "hadir" status for all directors
    const initializeAttendanceData = (): Record<string, DirectorAttendance> => {
        const existingData = initialData.attendanceData || {};
        const result: Record<string, DirectorAttendance> = {};

        directorOptions.forEach((dir) => {
            const existing = existingData[dir.label];
            if (existing && typeof existing === 'object' && 'status' in existing) {
                result[dir.label] = existing as DirectorAttendance;
            } else {
                result[dir.label] = { status: "hadir" };
            }
        });

        return result;
    };

    // Initialize per-agenda content (RAKORDIR version)
    const initializePerAgendaContent = (): Record<string, AgendaContent> => {
        const result: Record<string, AgendaContent> = {};

        initialData.agendas.forEach((agenda) => {
            const existing = initialData.perAgendaContent?.[agenda.id];
            result[agenda.id] = {
                executiveSummary: existing?.executiveSummary || "",
                arahanDireksi: (existing?.arahanDireksi as ArahanItem[]) || [],
            };
        });

        return result;
    };

    // Helper to migrate old string[] format to new GuestParticipant[] format
    const initializeGuestParticipants = (): GuestParticipant[] => {
        const existing = initialData.guestParticipants || [];
        if (existing.length === 0) return [];
        // Check if it's old format (string[]) or new format (GuestParticipant[])
        if (typeof existing[0] === 'string') {
            // Old format - migrate to new format
            return (existing as unknown as string[]).map(name => ({ name, jabatan: "" }));
        }
        return existing as GuestParticipant[];
    };

    // ===== SHARED STATE (Kehadiran - same for all agendas) =====
    const [pimpinanRapat, setPimpinanRapat] = useState<string[]>(initialData.pimpinanRapat || []);
    const [attendanceData, setAttendanceData] = useState<Record<string, DirectorAttendance>>(initializeAttendanceData);
    const [guestParticipants, setGuestParticipants] = useState<GuestParticipant[]>(initializeGuestParticipants);
    const [newGuest, setNewGuest] = useState("");
    const [newGuestJabatan, setNewGuestJabatan] = useState("");

    // ===== NOTULENSI TTD STATE =====
    const [notulensiTtd, setNotulensiTtd] = useState<string | null>(initialData.notulensiTtd || null);

    // ===== PER-AGENDA STATE (Content - different for each agenda) =====
    const [perAgendaContent, setPerAgendaContent] = useState<Record<string, AgendaContent>>(initializePerAgendaContent);

    // Get current agenda content
    const currentContent = perAgendaContent[selectedAgendaId] || {
        executiveSummary: "",
        arahanDireksi: [],
    };

    // Update content for current agenda
    const updateCurrentAgendaContent = <K extends keyof AgendaContent>(field: K, value: AgendaContent[K]) => {
        setPerAgendaContent(prev => {
            const currentAgenda = prev[selectedAgendaId] || {
                executiveSummary: "",
                arahanDireksi: [],
            };
            return {
                ...prev,
                [selectedAgendaId]: {
                    ...currentAgenda,
                    [field]: value,
                },
            };
        });
    };

    // Arahan handlers for current agenda
    const addArahan = () => {
        const newArahanList = [...currentContent.arahanDireksi, { arahan: "", targetOutput: "", progresTerkini: "", evidence: "", statusPenyelesaian: "" }];
        updateCurrentAgendaContent("arahanDireksi", newArahanList);
    };

    const removeArahan = (index: number) => {
        const newArahanList = currentContent.arahanDireksi.filter((_, i) => i !== index);
        updateCurrentAgendaContent("arahanDireksi", newArahanList);
    };

    const updateArahan = (index: number, field: keyof ArahanItem, value: string) => {
        const updated = [...currentContent.arahanDireksi];
        if (updated[index]) {
            updated[index] = { ...updated[index], [field]: value };
            updateCurrentAgendaContent("arahanDireksi", updated);
        }
    };

    // ===== HANDLERS =====
    const handleSave = async () => {
        if (!initialData.notulensiNumber) return;

        console.log("=== handleSave called ===");
        console.log("Notulensi Number:", initialData.notulensiNumber);
        console.log("Pimpinan Rapat:", pimpinanRapat);
        console.log("Attendance Data:", attendanceData);
        console.log("Guest Participants:", guestParticipants);
        console.log("Per-Agenda Content:", perAgendaContent);
        console.log("Notulensi TTD:", notulensiTtd);

        setIsSaving(true);
        const result = await updateNotulensiAction(initialData.notulensiNumber, {
            // Shared kehadiran data
            pimpinanRapat,
            attendanceData,
            guestParticipants,
            // Notulensi TTD
            notulensiTtd,
            // Per-agenda content
            perAgendaContent,
        });
        setIsSaving(false);

        console.log("Save result:", result);

        if (result.success) {
            showNotify("Notulensi berhasil disimpan!", "success");
        } else {
            showNotify(result.error || "Gagal menyimpan notulensi.", "error");
        }
    };

    const handleFinalize = async () => {
        if (!initialData.notulensiNumber) return;

        setIsFinalizing(true);

        // First, save all data before finalizing
        const saveResult = await updateNotulensiAction(initialData.notulensiNumber, {
            pimpinanRapat,
            attendanceData,
            guestParticipants,
            notulensiTtd,
            perAgendaContent,
        });

        if (!saveResult.success) {
            setIsFinalizing(false);
            showNotify(saveResult.error || "Gagal menyimpan notulensi.", "error");
            return;
        }

        // Then finalize
        const result = await finalizeNotulensiAction(initialData.notulensiNumber);
        setIsFinalizing(false);

        if (result.success) {
            showNotify("Notulensi telah diselesaikan!", "success");
            router.push("/dashboard/pelaksanaan-rapat/rakordir");
        } else {
            showNotify(result.error || "Gagal menyelesaikan notulensi.", "error");
        }
    };

    const addGuest = () => {
        if (newGuest.trim()) {
            setGuestParticipants([...guestParticipants, { name: newGuest.trim(), jabatan: newGuestJabatan.trim() }]);
            setNewGuest("");
            setNewGuestJabatan("");
        }
    };

    const removeGuest = (index: number) => {
        setGuestParticipants(guestParticipants.filter((_, i) => i !== index));
    };

    // Handler for attendance change (new structure with DirectorAttendance)
    const handleAttendanceChange = (directorName: string, attendance: DirectorAttendance) => {
        setAttendanceData(prev => ({
            ...prev,
            [directorName]: attendance
        }));
    };

    // Handler for pimpinan rapat multi-select
    const handlePimpinanChange = (names: string[]) => {
        setPimpinanRapat(names);
    };

    // Handler for removing an agenda from the meeting
    const handleRemoveAgenda = async (agendaId: string) => {
        if (!initialData.notulensiNumber) return;

        setIsRemoving(true);
        const result = await removeAgendaFromNotulensiAction(agendaId, initialData.notulensiNumber);
        setIsRemoving(false);

        if (result.success) {
            showNotify("Agenda berhasil dihapus dari notulensi.", "success");
            // Update local state
            const newAgendas = localAgendas.filter(a => a.id !== agendaId);
            setLocalAgendas(newAgendas);
            // Remove from perAgendaContent
            setPerAgendaContent(prev => {
                const updated = { ...prev };
                delete updated[agendaId];
                return updated;
            });
            // If the removed agenda was selected, select the first available
            if (selectedAgendaId === agendaId && newAgendas.length > 0) {
                setSelectedAgendaId(newAgendas[0]?.id || "");
            }
            // If no agendas left, redirect back
            if (newAgendas.length === 0) {
                router.push("/dashboard/pelaksanaan-rapat/rakordir");
            }
        } else {
            showNotify(result.error || "Gagal menghapus agenda.", "error");
        }
    };

    // Count attendance (hadir counts as present)
    const attendanceCount = Object.values(attendanceData).filter(
        (att) => att.status === "hadir"
    ).length;

    return (
        <div className="flex flex-col gap-6">
            {/* Sticky Header */}
            <NotulensiHeader
                notulensiNumber={initialData.notulensiNumber}
                executionDate={initialData.executionDate}
                agendaCount={localAgendas.length}
                isSaving={isSaving}
                isFinalizing={isFinalizing}
                onBack={() => router.back()}
                onSave={handleSave}
                onFinalize={handleFinalize}
            />

            {/* Main Content - Two Column Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Left Sidebar - Meeting Info & Quick Stats */}
                <div className="xl:col-span-4 space-y-6">
                    <MeetingInfoCard
                        notulensiNumber={initialData.notulensiNumber || ""}
                        executionDate={initialData.executionDate}
                        startTime={initialData.startTime}
                        endTime={initialData.endTime}
                        meetingLocation={initialData.meetingLocation}
                        meetingMethod={initialData.meetingMethod}
                        meetingLink={initialData.meetingLink}
                        agendas={localAgendas}
                        attendanceCount={attendanceCount}
                        onRemoveAgenda={handleRemoveAgenda}
                        isRemoving={isRemoving}
                        onInfoUpdated={() => router.refresh()}
                        sharedData={{
                            pimpinanRapat,
                            attendanceData,
                            guestParticipants,
                            notulensiTtd,
                        }}
                        onAgendaAdded={() => {
                            // Refresh page to get updated data
                            router.refresh();
                        }}
                    />
                </div>

                {/* Right Content - Main Form */}
                <div className="xl:col-span-8">
                    <Tabs defaultValue="kehadiran" className="w-full">
                        <TabsList className="w-full grid grid-cols-4 h-12 p-1 bg-slate-100">
                            <TabsTrigger
                                value="kehadiran"
                                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                            >
                                <Users className="h-4 w-4" />
                                <span className="hidden sm:inline">Kehadiran</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="executive-summary"
                                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                            >
                                <FileText className="h-4 w-4" />
                                <span className="hidden sm:inline">Summary</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="arahan-direksi"
                                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                            >
                                <MessageSquare className="h-4 w-4" />
                                <span className="hidden sm:inline">Arahan Direksi</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="dokumen"
                                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                            >
                                <FolderOpen className="h-4 w-4" />
                                <span className="hidden sm:inline">Dokumen</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab: Kehadiran */}
                        <TabsContent value="kehadiran" className="mt-6">
                            <KehadiranTab
                                directorOptions={directorOptions}
                                pimpinanRapat={pimpinanRapat}
                                attendanceData={attendanceData}
                                guestParticipants={guestParticipants}
                                newGuest={newGuest}
                                newGuestJabatan={newGuestJabatan}
                                onPimpinanChange={handlePimpinanChange}
                                onAttendanceChange={handleAttendanceChange}
                                onNewGuestChange={setNewGuest}
                                onNewGuestJabatanChange={setNewGuestJabatan}
                                onAddGuest={addGuest}
                                onRemoveGuest={removeGuest}
                            />
                        </TabsContent>

                        {/* Tab: Executive Summary (PER-AGENDA) */}
                        <TabsContent value="executive-summary" className="mt-6">
                            <AgendaSelector
                                agendas={localAgendas}
                                selectedAgendaId={selectedAgendaId}
                                onSelectAgenda={setSelectedAgendaId}
                            />
                            <ExecutiveSummaryTab
                                executiveSummary={currentContent.executiveSummary}
                                onExecutiveSummaryChange={(value: string) => updateCurrentAgendaContent("executiveSummary", value)}
                            />
                        </TabsContent>

                        {/* Tab: Arahan Direksi (PER-AGENDA) */}
                        <TabsContent value="arahan-direksi" className="mt-6">
                            <AgendaSelector
                                agendas={localAgendas}
                                selectedAgendaId={selectedAgendaId}
                                onSelectAgenda={setSelectedAgendaId}
                            />
                            <ArahanDireksiTab
                                arahanDireksi={currentContent.arahanDireksi}
                                onAddArahan={addArahan}
                                onRemoveArahan={removeArahan}
                                onUpdateArahan={updateArahan}
                            />
                        </TabsContent>

                        {/* Tab: Dokumen (PER-AGENDA) */}
                        <TabsContent value="dokumen" className="mt-6">
                            <AgendaSelector
                                agendas={localAgendas}
                                selectedAgendaId={selectedAgendaId}
                                onSelectAgenda={setSelectedAgendaId}
                            />
                            <DokumenTab
                                agendas={localAgendas}
                                selectedAgendaId={selectedAgendaId}
                                notulensiTtd={notulensiTtd}
                                onNotulensiTtdChange={setNotulensiTtd}
                                notulensiNumber={initialData.notulensiNumber ?? undefined}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
