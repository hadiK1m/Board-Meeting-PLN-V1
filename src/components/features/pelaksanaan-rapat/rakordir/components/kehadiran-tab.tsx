// src/components/features/pelaksanaan-rapat/rakordir/components/kehadiran-tab.tsx
"use client";

import { useState } from "react";
import { Users, UserCheck, UserPlus, Plus, Trash2, ChevronDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

// Type for attendance status: "hadir" | "tidak_hadir"
export type AttendanceStatus = "hadir" | "tidak_hadir";

export interface DirectorAttendance {
    status: AttendanceStatus;
    keterangan?: string; // Reason for tidak hadir
}

export interface GuestParticipant {
    name: string;
    jabatan: string;
}

interface KehadiranTabProps {
    directorOptions: { label: string; value: string }[];
    pimpinanRapat: string[];
    attendanceData: Record<string, DirectorAttendance>;
    guestParticipants: GuestParticipant[];
    newGuest: string;
    newGuestJabatan: string;
    onPimpinanChange: (names: string[]) => void;
    onAttendanceChange: (directorName: string, attendance: DirectorAttendance) => void;
    onNewGuestChange: (value: string) => void;
    onNewGuestJabatanChange: (value: string) => void;
    onAddGuest: () => void;
    onRemoveGuest: (index: number) => void;
}

export function KehadiranTab({
    directorOptions,
    pimpinanRapat,
    attendanceData,
    guestParticipants,
    newGuest,
    newGuestJabatan,
    onPimpinanChange,
    onAttendanceChange,
    onNewGuestChange,
    onNewGuestJabatanChange,
    onAddGuest,
    onRemoveGuest,
}: KehadiranTabProps) {
    const [pimpinanOpen, setPimpinanOpen] = useState(false);

    // Count attendance (only hadir counts as present)
    const attendanceCount = Object.values(attendanceData).filter(
        (att) => att.status === "hadir"
    ).length;

    // Toggle pimpinan selection
    const togglePimpinan = (name: string) => {
        if (pimpinanRapat.includes(name)) {
            onPimpinanChange(pimpinanRapat.filter(p => p !== name));
        } else {
            onPimpinanChange([...pimpinanRapat, name]);
        }
    };

    // Remove pimpinan from selection
    const removePimpinan = (name: string) => {
        onPimpinanChange(pimpinanRapat.filter(p => p !== name));
    };

    // Get status label and color
    const getStatusBadge = (status: AttendanceStatus) => {
        switch (status) {
            case "hadir":
                return <Badge className="bg-green-500 text-[10px]">Hadir</Badge>;
            case "tidak_hadir":
                return <Badge variant="destructive" className="text-[10px]">Tidak Hadir</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Pimpinan Rapat - Multi-Select (Full Width) */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-[#006070]" />
                        Pimpinan Rapat
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Pilih direktur yang memimpin rapat (bisa lebih dari satu)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* Multi-select trigger */}
                    <Popover open={pimpinanOpen} onOpenChange={setPimpinanOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={pimpinanOpen}
                                className="w-full justify-between h-auto min-h-10 py-2"
                            >
                                <span className="text-muted-foreground text-sm">
                                    {pimpinanRapat.length > 0
                                        ? `${pimpinanRapat.length} pimpinan terpilih`
                                        : "Pilih pimpinan rapat..."}
                                </span>
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                            <ScrollArea className="h-60">
                                <div className="p-2 space-y-1">
                                    {directorOptions.map((dir) => (
                                        <label
                                            key={dir.value}
                                            htmlFor={`pimpinan-${dir.value}`}
                                            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors hover:bg-slate-100 ${pimpinanRapat.includes(dir.label)
                                                ? 'bg-[#006070]/5'
                                                : ''
                                                }`}
                                        >
                                            <Checkbox
                                                id={`pimpinan-${dir.value}`}
                                                checked={pimpinanRapat.includes(dir.label)}
                                                onCheckedChange={() => togglePimpinan(dir.label)}
                                            />
                                            <span className="text-sm">{dir.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>

                    {/* Selected chips */}
                    {pimpinanRapat.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {pimpinanRapat.map((name) => (
                                <Badge
                                    key={name}
                                    variant="secondary"
                                    className="pl-2 pr-1 py-1 text-xs gap-1"
                                >
                                    {name}
                                    <button
                                        type="button"
                                        onClick={() => removePimpinan(name)}
                                        className="ml-1 p-0.5 rounded hover:bg-destructive/20 hover:text-destructive transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Daftar Hadir Direksi */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Users className="h-4 w-4 text-[#006070]" />
                                Daftar Hadir Direksi
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Pilih status kehadiran tiap direktur
                            </CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                            {attendanceCount}/{directorOptions.length}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2">
                        {directorOptions.map((dir) => {
                            const att = attendanceData[dir.label] || { status: "hadir" as AttendanceStatus };

                            return (
                                <div
                                    key={dir.value}
                                    className="flex flex-col p-3 bg-slate-50 rounded-lg gap-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar size="default">
                                                <AvatarFallback className="bg-[#006070]/10 text-[#006070] text-xs font-medium">
                                                    {dir.label.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">{dir.label}</p>
                                                {att.status === "tidak_hadir" && att.keterangan && (
                                                    <p className="text-xs text-red-600">
                                                        Keterangan: {att.keterangan}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(att.status)}
                                            <Select
                                                value={att.status}
                                                onValueChange={(value: AttendanceStatus) => {
                                                    onAttendanceChange(dir.label, { status: value, keterangan: value === "tidak_hadir" ? att.keterangan : undefined });
                                                }}
                                            >
                                                <SelectTrigger className="w-32 h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="hadir">Hadir</SelectItem>
                                                    <SelectItem value="tidak_hadir">Tidak Hadir</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {att.status === "tidak_hadir" && (
                                        <div className="ml-11">
                                            <Input
                                                placeholder="Masukkan keterangan tidak hadir..."
                                                value={att.keterangan || ""}
                                                onChange={(e) => {
                                                    onAttendanceChange(dir.label, { status: "tidak_hadir", keterangan: e.target.value });
                                                }}
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Daftar Undangan / Peserta Lainnya */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-[#006070]" />
                        Peserta Lainnya / Undangan
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Tambahkan peserta non-direksi yang menghadiri rapat
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Nama peserta..."
                            value={newGuest}
                            onChange={(e) => onNewGuestChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && newGuest.trim()) {
                                    e.preventDefault();
                                    onAddGuest();
                                }
                            }}
                            className="flex-1"
                        />
                        <Input
                            placeholder="Jabatan..."
                            value={newGuestJabatan}
                            onChange={(e) => onNewGuestJabatanChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && newGuest.trim()) {
                                    e.preventDefault();
                                    onAddGuest();
                                }
                            }}
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            onClick={onAddGuest}
                            size="icon"
                            className="bg-[#006070] hover:bg-[#004d5a] shrink-0"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    {guestParticipants.length > 0 ? (
                        <div className="grid gap-2">
                            {guestParticipants.map((guest, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar size="default">
                                            <AvatarFallback className="bg-slate-200 text-slate-600 text-xs font-medium">
                                                {guest.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{guest.name}</p>
                                            {guest.jabatan && (
                                                <p className="text-xs text-muted-foreground">{guest.jabatan}</p>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onRemoveGuest(index)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 border rounded-lg bg-slate-50/50 border-dashed">
                            <UserPlus className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                                Belum ada peserta lainnya
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
