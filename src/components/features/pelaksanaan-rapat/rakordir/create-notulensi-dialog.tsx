// src/components/features/pelaksanaan-rapat/rakordir/create-notulensi-dialog.tsx
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
import { Loader2, Plus, FileText, CheckCircle2, ListChecks, Calendar } from "lucide-react";
import { getDijadwalkanRakordirAgendas, createNotulensiAction } from "@/server/actions/pelaksanaan-rakordir-actions";
import { showNotify } from "@/components/shared/toast-provider";
import { useRouter } from "next/navigation";

interface Option {
    label: string;
    value: string;
}

// Generate year options (current year - 2 to current year + 2)
const generateYearOptions = (): Option[] => {
    const currentYear = new Date().getFullYear();
    const years: Option[] = [];
    for (let year = currentYear - 2; year <= currentYear + 2; year++) {
        years.push({ label: year.toString(), value: year.toString() });
    }
    return years;
};

// Custom Styles for React Select
const selectStyles: StylesConfig<Option, false> = {
    control: (base, state) => ({
        ...base,
        borderColor: state.isFocused ? "#006070" : "#e2e8f0",
        boxShadow: state.isFocused ? "0 0 0 1px #006070" : "none",
        borderRadius: "0.5rem",
        minHeight: "2.5rem",
        fontSize: "0.875rem",
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
    singleValue: (base) => ({
        ...base,
        color: "#1e293b",
        fontWeight: "500",
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    placeholder: (base) => ({ ...base, color: "#94a3b8" }),
};

// Custom Styles for Multi Select
const multiSelectStyles: StylesConfig<Option, true> = {
    control: (base, state) => ({
        ...base,
        borderColor: state.isFocused ? "#006070" : "#e2e8f0",
        boxShadow: state.isFocused ? "0 0 0 1px #006070" : "none",
        borderRadius: "0.5rem",
        minHeight: "2.5rem",
        fontSize: "0.875rem",
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
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    placeholder: (base) => ({ ...base, color: "#94a3b8" }),
};

export function CreateNotulensiDialog() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [agendaOptions, setAgendaOptions] = useState<Option[]>([]);
    const [selectedAgendas, setSelectedAgendas] = useState<Option[]>([]);

    // Year state - default to current year
    const [yearOptions] = useState<Option[]>(generateYearOptions());
    const [selectedYear, setSelectedYear] = useState<Option | null>(() => {
        const currentYear = new Date().getFullYear().toString();
        return { label: currentYear, value: currentYear };
    });

    const router = useRouter();

    useEffect(() => {
        let isMounted = true;
        if (open) {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    const options = await getDijadwalkanRakordirAgendas();
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
        if (!selectedYear) {
            showNotify("Mohon pilih tahun.", "error");
            return;
        }

        if (selectedAgendas.length === 0) {
            showNotify("Mohon pilih minimal satu agenda.", "error");
            return;
        }

        setIsSubmitting(true);
        const result = await createNotulensiAction({
            agendaIds: selectedAgendas.map(a => a.value),
            year: parseInt(selectedYear.value),
        });

        setIsSubmitting(false);

        if (result.success && result.notulensiNumber) {
            showNotify("Notulensi berhasil dibuat!", "success");
            setOpen(false);
            setSelectedAgendas([]);
            // Reset year to current year
            const currentYear = new Date().getFullYear().toString();
            setSelectedYear({ label: currentYear, value: currentYear });
            router.push(`/dashboard/pelaksanaan-rapat/rakordir/input/${encodeURIComponent(result.notulensiNumber)}`);
        } else {
            showNotify(result.error || "Gagal membuat notulensi.", "error");
        }
    };

    return (
        <>
            <Button onClick={() => setOpen(true)} className="bg-[#006070] hover:bg-[#004d5a]">
                <Plus className="mr-2 h-4 w-4" /> Buat Notulensi Baru
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
                            Setting Notulensi
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Pilih daftar agenda RAKORDIR yang akan dibahas dalam rapat ini. Nomor notulensi akan di-generate otomatis.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-slate-600 font-semibold text-sm">
                                <Calendar className="h-4 w-4 text-[#006070]" /> Tahun
                            </label>
                            <Select
                                options={yearOptions}
                                value={selectedYear}
                                onChange={(newValue) => setSelectedYear(newValue)}
                                getOptionLabel={(option) => option.label}
                                getOptionValue={(option) => option.value}
                                placeholder="Pilih tahun..."
                                className="text-sm w-full"
                                styles={selectStyles}
                                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                menuPosition="fixed"
                            />
                        </div>

                        <div className="p-3 bg-slate-50 rounded-lg border">
                            <p className="text-xs text-slate-500 mb-1">Nomor Notulensi</p>
                            <p className="text-sm font-medium text-slate-700">
                                Akan di-generate otomatis saat submit
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-slate-600 font-semibold text-sm">
                                <ListChecks className="h-4 w-4 text-[#006070]" /> Daftar Agenda (Dijadwalkan)
                            </label>
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
                                    styles={multiSelectStyles}
                                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                    menuPosition="fixed"
                                    closeMenuOnSelect={false}
                                    blurInputOnSelect={false}
                                />
                            )}
                            <p className="text-[10px] text-slate-400 italic">
                                *Hanya menampilkan agenda RAKORDIR dengan status &quot;Dijadwalkan&quot;
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
                            Buat Notulensi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
