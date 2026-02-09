// src/components/features/pelaksanaan-rapat/radir/create-risalah-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import Select, { StylesConfig } from "react-select";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Hash, Calendar, FileText, CheckCircle2, ListChecks } from "lucide-react";
import { getDijadwalkanRadirAgendas, createRisalahAction } from "@/server/actions/pelaksanaan-rapat-actions";
import { showNotify } from "@/components/shared/toast-provider";
import { useRouter } from "next/navigation";

interface Option {
    label: string;
    value: string;
}

// Custom Styles for React Select to match Shadcn UI & Fix Overflow
const selectStyles: StylesConfig<Option, true> = {
    control: (base, state) => ({
        ...base,
        borderColor: state.isFocused ? "#006070" : "#e2e8f0",
        boxShadow: state.isFocused ? "0 0 0 1px #006070" : "none",
        borderRadius: "0.5rem", // rounded-lg
        minHeight: "2.5rem", // h-10
        fontSize: "0.875rem", // text-sm
        "&:hover": {
            borderColor: "#006070"
        }
    }),
    input: (base) => ({
        ...base,
        color: "#1e293b",
    }),
    menu: (base) => ({
        ...base,
        zIndex: 9999,
    }),
    multiValue: (base) => ({
        ...base,
        backgroundColor: "#e6f2f5",
        borderRadius: "0.25rem",
        border: "1px solid #bce3eb",
        maxWidth: "200px",
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: "#006070",
        fontWeight: "600",
        fontSize: "0.75rem",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    }),
    multiValueRemove: (base) => ({
        ...base,
        color: "#006070",
        "&:hover": {
            backgroundColor: "#006070",
            color: "white",
        },
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }), // Important for Dialog overflow
    placeholder: (base) => ({ ...base, color: "#94a3b8" }),
};

export function CreateRisalahDialog() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [meetingNumber, setMeetingNumber] = useState("");
    const [meetingYear, setMeetingYear] = useState(new Date().getFullYear().toString());
    const [agendaOptions, setAgendaOptions] = useState<Option[]>([]);
    const [selectedAgendas, setSelectedAgendas] = useState<Option[]>([]);

    const router = useRouter();

    useEffect(() => {
        let isMounted = true;
        if (open) {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    const options = await getDijadwalkanRadirAgendas();
                    if (isMounted) setAgendaOptions(options);
                } finally {
                    if (isMounted) setIsLoading(false);
                }
            };
            fetchData();
        }
        return () => { isMounted = false; };
    }, [open]);

    const handleSubmit = async () => {
        if (!meetingNumber || selectedAgendas.length === 0) {
            showNotify("Mohon lengkapi Nomor Risalah dan pilih Agenda.", "error");
            return;
        }

        setIsSubmitting(true);
        const result = await createRisalahAction({
            meetingNumber,
            meetingYear,
            agendaIds: selectedAgendas.map(a => a.value),
        });

        setIsSubmitting(false);

        if (result.success) {
            showNotify("Risalah berhasil dibuat!", "success");
            setOpen(false);
            setMeetingNumber("");
            setSelectedAgendas([]);
            // Redirect ke halaman input risalah
            router.push(`/dashboard/pelaksanaan-rapat/radir/input/${encodeURIComponent(meetingNumber)}`);
        } else {
            showNotify(result.error || "Gagal membuat risalah.", "error");
        }
    };

    return (
        <>
            <Button onClick={() => setOpen(true)} className="bg-[#006070] hover:bg-[#004d5a]">
                <Plus className="mr-2 h-4 w-4" /> Buat Risalah Baru
            </Button>

            <Dialog open={open} onOpenChange={setOpen} modal={false}>
                <DialogContent
                    className="sm:max-w-125"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[#006070] text-xl">
                            <FileText className="h-5 w-5" />
                            Setting Risalah
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Tentukan nomor risalah dan pilih daftar agenda yang akan dibahas dalam rapat ini.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-2">
                                <Label className="flex items-center gap-2 text-slate-600 font-semibold">
                                    <Hash className="h-4 w-4 text-[#006070]" /> Nomor Risalah
                                </Label>
                                <Input
                                    value={meetingNumber}
                                    onChange={(e) => setMeetingNumber(e.target.value)}
                                    placeholder="001/DIR/2026"
                                    className="focus-visible:ring-[#006070] h-10"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-slate-600 font-semibold">
                                    <Calendar className="h-4 w-4 text-[#006070]" /> Tahun
                                </Label>
                                <Input
                                    value={meetingYear}
                                    onChange={(e) => setMeetingYear(e.target.value)}
                                    type="number"
                                    className="focus-visible:ring-[#006070] h-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-slate-600 font-semibold">
                                <ListChecks className="h-4 w-4 text-[#006070]" /> Daftar Agenda (Dijadwalkan)
                            </Label>
                            {isLoading ? (
                                <div className="text-sm text-muted-foreground flex items-center gap-2 p-3 border rounded-lg bg-slate-50">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Memuat agenda...
                                </div>
                            ) : (
                                <Select
                                    isMulti
                                    options={agendaOptions}
                                    value={selectedAgendas}
                                    onChange={(newValue) => setSelectedAgendas(newValue ? [...newValue] : [])}
                                    getOptionLabel={(option) => option.label}
                                    getOptionValue={(option) => option.value}
                                    placeholder="Pilih agenda..."
                                    className="text-sm w-full"
                                    styles={selectStyles}
                                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                    menuPosition="fixed"
                                    closeMenuOnSelect={false}
                                    blurInputOnSelect={false}
                                />
                            )}
                            <p className="text-[10px] text-slate-400 italic">
                                *Hanya menampilkan agenda dengan status &quot;Dijadwalkan&quot;
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpen(false)} className="text-slate-500">
                            Batal
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || isLoading}
                            className="bg-[#006070] hover:bg-[#004d5a] min-w-40 font-bold shadow-sm"
                        >
                            {isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            Buat Risalah
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
