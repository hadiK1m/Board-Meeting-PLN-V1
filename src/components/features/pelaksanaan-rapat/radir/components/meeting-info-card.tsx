// src/components/features/pelaksanaan-rapat/radir/components/meeting-info-card.tsx
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
    FileText,
    ClipboardList,
    Calendar,
    MapPin,
    Clock,
    Link as LinkIcon,
    Trash2,
    Pencil,
    Loader2,
    Check,
    XCircle,
} from "lucide-react";

import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { showNotify } from "@/components/shared/toast-provider";
import { updateMeetingInfoAction } from "@/server/actions/pelaksanaan-rapat-actions";

interface MeetingInfoCardProps {
    meetingNumber: string;
    executionDate: string | null;
    startTime: string | null;
    endTime: string | null;
    meetingLocation: string | null;
    meetingMethod: string | null;
    meetingLink: string | null;
    agendas: {
        id: string;
        title: string;
        initiator: string | null;
    }[];
    attendanceCount: number;
    decisionsCount: number;
    onRemoveAgenda?: (agendaId: string) => void;
    isRemoving?: boolean;
    onInfoUpdated?: () => void;
}

export function MeetingInfoCard({
    meetingNumber,
    executionDate,
    startTime,
    endTime,
    meetingLocation,
    meetingMethod,
    meetingLink,
    agendas,
    attendanceCount,
    decisionsCount,
    onRemoveAgenda,
    isRemoving,
    onInfoUpdated,
}: MeetingInfoCardProps) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCustomEndTime, setIsCustomEndTime] = useState(endTime !== "Selesai" && endTime !== null && endTime !== "");
    const [formData, setFormData] = useState({
        executionDate: executionDate || "",
        startTime: startTime || "",
        endTime: endTime || "Selesai",
        meetingLocation: meetingLocation || "",
        meetingMethod: meetingMethod || "HYBRID (Campuran)",
        meetingLink: meetingLink || "",
    });

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        try {
            return format(new Date(dateStr), "EEEE, dd MMMM yyyy", { locale: idLocale });
        } catch {
            return dateStr;
        }
    };

    const handleOpenEditDialog = () => {
        setFormData({
            executionDate: executionDate || "",
            startTime: startTime || "",
            endTime: endTime || "Selesai",
            meetingLocation: meetingLocation || "",
            meetingMethod: meetingMethod || "HYBRID (Campuran)",
            meetingLink: meetingLink || "",
        });
        setIsCustomEndTime(endTime !== "Selesai" && endTime !== null && endTime !== "");
        setIsEditDialogOpen(true);
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const result = await updateMeetingInfoAction(meetingNumber, {
                executionDate: formData.executionDate || null,
                startTime: formData.startTime || null,
                endTime: formData.endTime || null,
                meetingLocation: formData.meetingLocation || null,
                meetingMethod: formData.meetingMethod || null,
                meetingLink: formData.meetingLink || null,
            });

            if (result.success) {
                showNotify(result.message || "Informasi rapat berhasil diperbarui.", "success");
                setIsEditDialogOpen(false);
                onInfoUpdated?.();
            } else {
                showNotify(result.error || "Gagal memperbarui informasi rapat.", "error");
            }
        } catch (error) {
            console.error("Error updating meeting info:", error);
            showNotify("Terjadi kesalahan saat memperbarui informasi rapat.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-[#006070]/20 xl:sticky xl:top-32">
            <CardHeader className="pb-3 bg-linear-to-rrom-[#006070]/5 to-transparent">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2 text-[#006070]">
                        <FileText className="h-4 w-4" />
                        Informasi Rapat
                    </CardTitle>
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-slate-500 hover:text-[#006070] hover:bg-[#006070]/10"
                                onClick={handleOpenEditDialog}
                            >
                                <Pencil className="h-3.5 w-3.5 mr-1" />
                                Edit
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Pencil className="h-5 w-5 text-[#006070]" />
                                    Edit Informasi Rapat
                                </DialogTitle>
                                <DialogDescription>
                                    Ubah informasi tanggal, waktu, lokasi, dan metode rapat.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-600">TANGGAL PELAKSANAAN</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                        <Input
                                            type="date"
                                            className="pl-9"
                                            value={formData.executionDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, executionDate: e.target.value }))}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-600">MULAI</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                type="time"
                                                className="pl-9"
                                                value={formData.startTime}
                                                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-600">SELESAI</Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                                <Input
                                                    type={isCustomEndTime ? "time" : "text"}
                                                    className="pl-9"
                                                    value={formData.endTime}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                                    readOnly={!isCustomEndTime}
                                                    placeholder="Selesai"
                                                    disabled={isLoading}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="shrink-0"
                                                onClick={() => {
                                                    if (isCustomEndTime) {
                                                        setIsCustomEndTime(false);
                                                        setFormData(prev => ({ ...prev, endTime: "Selesai" }));
                                                    } else {
                                                        setIsCustomEndTime(true);
                                                        setFormData(prev => ({ ...prev, endTime: "" }));
                                                    }
                                                }}
                                                title={isCustomEndTime ? "Set ke 'Selesai'" : "Set Jam Selesai"}
                                                disabled={isLoading}
                                            >
                                                {isCustomEndTime ? <XCircle className="h-4 w-4 text-red-500" /> : <Clock className="h-4 w-4 text-slate-600" />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-600">METODE RAPAT</Label>
                                    <Select
                                        value={formData.meetingMethod}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, meetingMethod: value }))}
                                        disabled={isLoading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih metode rapat" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="OFFLINE (Tatap Muka)">OFFLINE (Tatap Muka)</SelectItem>
                                            <SelectItem value="ONLINE (Daring)">ONLINE (Daring)</SelectItem>
                                            <SelectItem value="HYBRID (Campuran)">HYBRID (Campuran)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    {(formData.meetingMethod === "OFFLINE (Tatap Muka)" || formData.meetingMethod === "HYBRID (Campuran)") && (
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600">LOKASI RUANGAN</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                                <Input
                                                    className="pl-9"
                                                    placeholder="Contoh: Ruang Rapat Lt. 3"
                                                    value={formData.meetingLocation}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, meetingLocation: e.target.value }))}
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {(formData.meetingMethod === "ONLINE (Daring)" || formData.meetingMethod === "HYBRID (Campuran)") && (
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600">TAUTAN / LINK MEETING</Label>
                                            <div className="relative">
                                                <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                                <Input
                                                    className="pl-9"
                                                    placeholder="https://zoom.us/j/..."
                                                    value={formData.meetingLink}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditDialogOpen(false)}
                                    disabled={isLoading}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="bg-[#006070] hover:bg-[#004050]"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            Simpan Perubahan
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Meeting Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-slate-50 border">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
                            <Calendar className="h-3 w-3" /> Tanggal
                        </p>
                        <p className="font-medium text-sm leading-tight">{formatDate(executionDate)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
                            <Clock className="h-3 w-3" /> Waktu
                        </p>
                        <p className="font-medium text-sm">
                            {startTime || "-"} - {endTime || "Selesai"}
                        </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
                            <MapPin className="h-3 w-3" /> Lokasi
                        </p>
                        <p className="font-medium text-sm truncate">{meetingLocation || "-"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
                            <LinkIcon className="h-3 w-3" /> Metode
                        </p>
                        <p className="font-medium text-sm">{meetingMethod || "-"}</p>
                    </div>
                </div>

                <Separator />

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-lg bg-[#006070]/5 border border-[#006070]/10">
                        <p className="text-2xl font-bold text-[#006070]">{agendas.length}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Agenda</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-green-50 border border-green-100">
                        <p className="text-2xl font-bold text-green-600">{attendanceCount}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Hadir</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-blue-50 border border-blue-100">
                        <p className="text-2xl font-bold text-blue-600">{decisionsCount}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Keputusan</p>
                    </div>
                </div>

                <Separator />

                {/* Agenda List */}
                <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <ClipboardList className="h-3 w-3" /> Daftar Agenda
                    </p>
                    <ScrollArea className="max-h-50">
                        <div className="space-y-2 pr-2">
                            {agendas.map((agenda, idx) => (
                                <div
                                    key={agenda.id}
                                    className="p-2 rounded-md bg-slate-50 border text-xs group"
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="shrink-0 w-5 h-5 rounded-full bg-[#006070] text-white flex items-center justify-center text-[10px] font-bold">
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-700 line-clamp-2">{agenda.title}</p>
                                            {agenda.initiator && (
                                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                                    {agenda.initiator}
                                                </p>
                                            )}
                                        </div>
                                        {onRemoveAgenda && agendas.length > 1 && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        disabled={isRemoving}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Hapus Agenda dari Risalah?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Agenda &quot;{agenda.title}&quot; akan dihapus dari risalah ini.
                                                            Status agenda akan kembali ke &quot;Dijadwalkan&quot; dan data risalah untuk agenda ini akan dihapus.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => onRemoveAgenda(agenda.id)}
                                                            className="bg-destructive hover:bg-destructive/90"
                                                        >
                                                            Hapus Agenda
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}
