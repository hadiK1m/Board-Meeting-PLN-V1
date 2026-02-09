// src/components/features/pelaksanaan-rapat/radir/risalah-input-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, FileText, Scale, MessageSquareWarning, Gavel, FolderOpen } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showNotify } from "@/components/shared/toast-provider";
import { updateRisalahAction, finalizeRisalahAction, removeAgendaFromMeetingAction } from "@/server/actions/pelaksanaan-rapat-actions";
import { exportRisalahToDocx, type ExportRisalahData, type ExportAttendance } from "@/lib/export-risalah";

import {
    RisalahHeader,
    MeetingInfoCard,
    KehadiranTab,
    ExecutiveSummaryTab,
    PertimbanganTab,
    DissentingOpinionTab,
    KeputusanTab,
    DokumenTab,
    AgendaSelector,
} from "./components";
import type { DirectorAttendance, GuestParticipant } from "./components/kehadiran-tab";

// Types for per-agenda content
interface AgendaContent {
    executiveSummary: string;
    considerations: string;
    meetingDecisions: { decision: string; output: string; progressTerkini: string; status: string; evidence: string }[];
    dissentingOpinion: string;
}

interface RisalahData {
    meetingNumber: string | null;
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
    // Risalah TTD (signed document)
    risalahTtd?: string | null;
    // Legacy fields (for backward compatibility)
    executiveSummary?: string | null;
    considerations?: string | null;
    meetingDecisions?: { decision: string; output: string; progressTerkini: string; status: string; evidence: string }[];
    dissentingOpinion?: string | null;
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

interface RisalahInputFormProps {
    initialData: RisalahData;
    directorOptions: { label: string; value: string }[];
}

export function RisalahInputForm({ initialData, directorOptions }: RisalahInputFormProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [localAgendas, setLocalAgendas] = useState(initialData.agendas);

    // Debug: Log initial data
    console.log("=== RisalahInputForm initialData ===");
    console.log("Meeting Number:", initialData.meetingNumber);
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

    // Initialize per-agenda content
    const initializePerAgendaContent = (): Record<string, AgendaContent> => {
        const result: Record<string, AgendaContent> = {};

        initialData.agendas.forEach((agenda) => {
            const existing = initialData.perAgendaContent?.[agenda.id];
            result[agenda.id] = {
                executiveSummary: existing?.executiveSummary || "",
                considerations: existing?.considerations || "",
                meetingDecisions: existing?.meetingDecisions || [],
                dissentingOpinion: existing?.dissentingOpinion || "",
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

    // ===== RISALAH TTD STATE =====
    const [risalahTtd, setRisalahTtd] = useState<string | null>(initialData.risalahTtd || null);

    // ===== PER-AGENDA STATE (Content - different for each agenda) =====
    const [perAgendaContent, setPerAgendaContent] = useState<Record<string, AgendaContent>>(initializePerAgendaContent);

    // Get current agenda content
    const currentContent = perAgendaContent[selectedAgendaId] || {
        executiveSummary: "",
        considerations: "",
        meetingDecisions: [],
        dissentingOpinion: "",
    };

    // Update content for current agenda
    const updateCurrentAgendaContent = <K extends keyof AgendaContent>(field: K, value: AgendaContent[K]) => {
        setPerAgendaContent(prev => {
            const currentAgenda = prev[selectedAgendaId] || {
                executiveSummary: "",
                considerations: "",
                meetingDecisions: [],
                dissentingOpinion: "",
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

    // ===== HANDLERS =====
    const handleSave = async () => {
        if (!initialData.meetingNumber) return;

        console.log("=== handleSave called ===");
        console.log("Meeting Number:", initialData.meetingNumber);
        console.log("Pimpinan Rapat:", pimpinanRapat);
        console.log("Attendance Data:", attendanceData);
        console.log("Guest Participants:", guestParticipants);
        console.log("Per-Agenda Content:", perAgendaContent);
        console.log("Risalah TTD:", risalahTtd);

        setIsSaving(true);
        const result = await updateRisalahAction(initialData.meetingNumber, {
            // Shared kehadiran data
            pimpinanRapat,
            attendanceData,
            guestParticipants,
            // Risalah TTD
            risalahTtd,
            // Per-agenda content
            perAgendaContent,
        });
        setIsSaving(false);

        console.log("Save result:", result);

        if (result.success) {
            showNotify("Risalah berhasil disimpan!", "success");
        } else {
            showNotify(result.error || "Gagal menyimpan risalah.", "error");
        }
    };

    const handleFinalize = async () => {
        if (!initialData.meetingNumber) return;

        setIsFinalizing(true);

        // First, save all data before finalizing
        const saveResult = await updateRisalahAction(initialData.meetingNumber, {
            pimpinanRapat,
            attendanceData,
            guestParticipants,
            risalahTtd,
            perAgendaContent,
        });

        if (!saveResult.success) {
            setIsFinalizing(false);
            showNotify(saveResult.error || "Gagal menyimpan risalah.", "error");
            return;
        }

        // Then finalize
        const result = await finalizeRisalahAction(initialData.meetingNumber);
        setIsFinalizing(false);

        if (result.success) {
            showNotify("Risalah telah diselesaikan!", "success");
            router.push("/dashboard/pelaksanaan-rapat/radir");
        } else {
            showNotify(result.error || "Gagal menyelesaikan risalah.", "error");
        }
    };

    // Export handler
    const handleExport = async () => {
        setIsExporting(true);
        try {
            // Prepare attendance data for export
            const attendance: ExportAttendance[] = directorOptions.map(dir => {
                const att = attendanceData[dir.label] || { status: "hadir" as const };
                return {
                    name: dir.label,
                    status: att.status,
                    kuasaTo: att.kuasaTo,
                };
            });

            // Prepare export data
            const exportData: ExportRisalahData = {
                meetingNumber: initialData.meetingNumber,
                meetingYear: initialData.meetingYear,
                executionDate: initialData.executionDate,
                startTime: initialData.startTime,
                endTime: initialData.endTime,
                meetingMethod: initialData.meetingMethod,
                meetingLocation: initialData.meetingLocation,
                meetingLink: initialData.meetingLink,
                pimpinanRapat,
                attendance,
                guestParticipants,
                agendas: localAgendas.map(agenda => {
                    const content = perAgendaContent[agenda.id] || {
                        executiveSummary: "",
                        considerations: "",
                        dissentingOpinion: "",
                        meetingDecisions: [],
                    };
                    return {
                        id: agenda.id,
                        title: agenda.title,
                        director: agenda.director,
                        initiator: agenda.initiator,
                        executiveSummary: content.executiveSummary,
                        considerations: content.considerations,
                        dissentingOpinion: content.dissentingOpinion,
                        decisions: content.meetingDecisions,
                    };
                }),
            };

            await exportRisalahToDocx(exportData);
            showNotify("Risalah berhasil di-export ke DOCX!", "success");
        } catch (error) {
            console.error("Export error:", error);
            showNotify("Gagal export risalah. Silakan coba lagi.", "error");
        } finally {
            setIsExporting(false);
        }
    };

    // Decision handlers for current agenda
    const addDecision = () => {
        const newDecisions = [...currentContent.meetingDecisions, { decision: "", output: "", progressTerkini: "", status: "dalam_proses", evidence: "" }];
        updateCurrentAgendaContent("meetingDecisions", newDecisions);
    };

    const removeDecision = (index: number) => {
        const newDecisions = currentContent.meetingDecisions.filter((_, i) => i !== index);
        updateCurrentAgendaContent("meetingDecisions", newDecisions);
    };

    const updateDecision = (index: number, field: keyof { decision: string; output: string; progressTerkini: string; status: string; evidence: string }, value: string) => {
        const updated = [...currentContent.meetingDecisions];
        if (updated[index]) {
            updated[index] = { ...updated[index], [field]: value };
            updateCurrentAgendaContent("meetingDecisions", updated);
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
        if (!initialData.meetingNumber) return;

        setIsRemoving(true);
        const result = await removeAgendaFromMeetingAction(agendaId, initialData.meetingNumber);
        setIsRemoving(false);

        if (result.success) {
            showNotify("Agenda berhasil dihapus dari risalah.", "success");
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
                router.push("/dashboard/pelaksanaan-rapat/radir");
            }
        } else {
            showNotify(result.error || "Gagal menghapus agenda.", "error");
        }
    };

    // Count attendance (hadir or kuasa counts as present)
    const attendanceCount = Object.values(attendanceData).filter(
        (att) => att.status === "hadir" || att.status === "kuasa"
    ).length;

    // Count total decisions across all agendas
    const totalDecisionsCount = Object.values(perAgendaContent).reduce(
        (total, content) => total + content.meetingDecisions.length,
        0
    );

    return (
        <div className="flex flex-col gap-6">
            {/* Sticky Header */}
            <RisalahHeader
                meetingNumber={initialData.meetingNumber}
                executionDate={initialData.executionDate}
                agendaCount={localAgendas.length}
                isSaving={isSaving}
                isFinalizing={isFinalizing}
                isExporting={isExporting}
                onBack={() => router.back()}
                onSave={handleSave}
                onFinalize={handleFinalize}
                onExport={handleExport}
            />

            {/* Main Content - Two Column Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Left Sidebar - Meeting Info & Quick Stats */}
                <div className="xl:col-span-4 space-y-6">
                    <MeetingInfoCard
                        meetingNumber={initialData.meetingNumber || ""}
                        executionDate={initialData.executionDate}
                        startTime={initialData.startTime}
                        endTime={initialData.endTime}
                        meetingLocation={initialData.meetingLocation}
                        meetingMethod={initialData.meetingMethod}
                        meetingLink={initialData.meetingLink}
                        agendas={localAgendas}
                        attendanceCount={attendanceCount}
                        decisionsCount={totalDecisionsCount}
                        onRemoveAgenda={handleRemoveAgenda}
                        isRemoving={isRemoving}
                        onInfoUpdated={() => router.refresh()}
                    />
                </div>

                {/* Right Content - Main Form */}
                <div className="xl:col-span-8">
                    <Tabs defaultValue="kehadiran" className="w-full">
                        <TabsList className="w-full grid grid-cols-6 h-12 p-1 bg-slate-100">
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
                                value="pertimbangan"
                                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                            >
                                <Scale className="h-4 w-4" />
                                <span className="hidden sm:inline">Pertimbangan</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="dissenting"
                                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                            >
                                <MessageSquareWarning className="h-4 w-4" />
                                <span className="hidden sm:inline">Dissenting</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="keputusan"
                                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                            >
                                <Gavel className="h-4 w-4" />
                                <span className="hidden sm:inline">Keputusan</span>
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
                                onExecutiveSummaryChange={(value) => updateCurrentAgendaContent("executiveSummary", value)}
                            />
                        </TabsContent>

                        {/* Tab: Pertimbangan (PER-AGENDA) */}
                        <TabsContent value="pertimbangan" className="mt-6">
                            <AgendaSelector
                                agendas={localAgendas}
                                selectedAgendaId={selectedAgendaId}
                                onSelectAgenda={setSelectedAgendaId}
                            />
                            <PertimbanganTab
                                considerations={currentContent.considerations}
                                onConsiderationsChange={(value) => updateCurrentAgendaContent("considerations", value)}
                            />
                        </TabsContent>

                        {/* Tab: Dissenting Opinion (PER-AGENDA) */}
                        <TabsContent value="dissenting" className="mt-6">
                            <AgendaSelector
                                agendas={localAgendas}
                                selectedAgendaId={selectedAgendaId}
                                onSelectAgenda={setSelectedAgendaId}
                            />
                            <DissentingOpinionTab
                                dissentingOpinion={currentContent.dissentingOpinion}
                                onDissentingOpinionChange={(value) => updateCurrentAgendaContent("dissentingOpinion", value)}
                            />
                        </TabsContent>

                        {/* Tab: Keputusan (PER-AGENDA) */}
                        <TabsContent value="keputusan" className="mt-6">
                            <AgendaSelector
                                agendas={localAgendas}
                                selectedAgendaId={selectedAgendaId}
                                onSelectAgenda={setSelectedAgendaId}
                            />
                            <KeputusanTab
                                meetingDecisions={currentContent.meetingDecisions}
                                onAddDecision={addDecision}
                                onRemoveDecision={removeDecision}
                                onUpdateDecision={updateDecision}
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
                                risalahTtd={risalahTtd}
                                onRisalahTtdChange={setRisalahTtd}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}