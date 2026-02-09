"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, FileText, Paperclip, Loader2, EyeOff, Send, Phone, User, Briefcase } from "lucide-react"
import { differenceInDays } from "date-fns"
import Select, { MultiValue, StylesConfig } from "react-select"
import { v4 as uuidv4 } from 'uuid';

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

import { createRakordirAction } from "@/server/actions/rakordir-actions"
import { createClient } from "@/lib/supabase/client"
import { showNotify } from "@/components/shared/toast-provider"

export type UnitOption = { label: string; value: string };

interface AddRakordirModalProps {
    dirOptions: UnitOption[];
    pemOptions: UnitOption[];
    supOptions: UnitOption[];
}

const selectStyles: StylesConfig<UnitOption, true> = {
    control: (base) => ({
        ...base, borderColor: "#e2e8f0", "&:hover": { borderColor: "#006070" },
        boxShadow: "none", borderRadius: "0.5rem", fontSize: "0.875rem", minHeight: "44px",
    }),
    multiValue: (base) => ({ ...base, backgroundColor: "#e6f2f5", borderRadius: "0.25rem", border: "1px solid #bce3eb" }),
    multiValueLabel: (base) => ({ ...base, color: "#006070", fontWeight: "600", fontSize: "0.75rem" }),
    multiValueRemove: (base) => ({ ...base, color: "#006070", "&:hover": { backgroundColor: "#006070", color: "white" } }),
}

export function AddRakordirModal({ dirOptions, pemOptions, supOptions }: AddRakordirModalProps) {
    const supabase = createClient()
    const [isClient, setIsClient] = useState(false)
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState("Proses...")
    const router = useRouter()

    const [judul, setJudul] = useState("")
    const [urgensiText, setUrgensiText] = useState("")
    const [deadline, setDeadline] = useState("")
    const [prioritas, setPrioritas] = useState("Low")
    const [isDraft, setIsDraft] = useState(false)

    const [selectedDir, setSelectedDir] = useState<MultiValue<UnitOption>>([])
    const [selectedPemrakarsa, setSelectedPemrakarsa] = useState<MultiValue<UnitOption>>([])
    const [selectedSupport, setSelectedSupport] = useState<MultiValue<UnitOption>>([])
    const [notRequiredFiles, setNotRequiredFiles] = useState<string[]>([])

    // ✅ LIST FILE KHUSUS RAKORDIR
    const FILE_LIST = [
        { id: "proposalNote", label: "ND Usulan Agenda" },
        { id: "presentationMaterial", label: "Materi Presentasi" },
    ] as const

    useEffect(() => { setIsClient(true) }, [])

    useEffect(() => {
        if (deadline) {
            const today = new Date()
            const target = new Date(deadline)
            const days = differenceInDays(target, today)
            if (days < 0) setPrioritas("-")
            else if (days <= 7) setPrioritas("High")
            else if (days <= 14) setPrioritas("Medium")
            else setPrioritas("Low")
        } else {
            setPrioritas("Low")
        }
    }, [deadline])

    const resetForm = () => {
        setJudul(""); setUrgensiText(""); setDeadline("")
        setSelectedDir([]); setSelectedPemrakarsa([]); setSelectedSupport([])
        setNotRequiredFiles([]); setIsDraft(false)
    }

    const toggleNotRequired = (fieldId: string) => {
        setNotRequiredFiles((prev) =>
            prev.includes(fieldId) ? prev.filter((f) => f !== fieldId) : [...prev, fieldId]
        )
    }

    // ✅ Helper untuk memformat opsi Support (Ambil singkatan dalam kurung)
    const handleSupportChange = (newValue: MultiValue<UnitOption>) => {
        const formatted = newValue.map(item => {
            // Cari teks dalam kurung di akhir string, misal: "... (UID SULSELRABAR)" -> "UID SULSELRABAR"
            const match = item.label.match(/\(([^)]+)\)$/);
            if (match && match[1]) {
                return { label: match[1], value: match[1] };
            }
            return item;
        });
        // Hapus duplikasi
        const unique = formatted.filter((v, i, a) => a.findIndex(t => t.value === v.value) === i);
        setSelectedSupport(unique);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsPending(true)
        setLoadingMessage("Mempersiapkan data...")

        const formData = new FormData(event.currentTarget)
        const filePaths: Record<string, string> = {}
        const supportingPaths: string[] = []

        try {
            for (const doc of FILE_LIST) {
                if (notRequiredFiles.includes(doc.id)) continue;
                const file = formData.get(doc.id) as File;

                if (file && file.size > 0) {
                    setLoadingMessage(`Mengunggah ${doc.label}...`)
                    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                    const fileName = `${doc.id}-${uuidv4()}-${sanitizedName}`;
                    // ✅ Simpan di folder rakordir
                    const filePath = `rakordir/${fileName}`;

                    const { error: uploadError } = await supabase.storage.from('Dokumen').upload(filePath, file);
                    if (uploadError) throw new Error(`Gagal upload ${doc.label}: ${uploadError.message}`);

                    filePaths[doc.id] = filePath;
                    formData.delete(doc.id);
                }
            }

            const supportingFiles = formData.getAll("supportingDocuments") as File[];
            if (supportingFiles.length > 0) {
                let count = 1;
                for (const file of supportingFiles) {
                    if (file && file.size > 0) {
                        setLoadingMessage(`Mengunggah Pendukung (${count}/${supportingFiles.length})...`)
                        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                        const fileName = `support-${uuidv4()}-${sanitizedName}`;
                        const filePath = `rakordir/supporting/${fileName}`;
                        const { error } = await supabase.storage.from('Dokumen').upload(filePath, file);
                        if (error) throw new Error(error.message);
                        supportingPaths.push(filePath);
                    }
                    count++;
                }
                formData.delete("supportingDocuments");
            }

            setLoadingMessage("Menyimpan ke database...")

            formData.delete("urgency")
            formData.delete("priority")
            formData.append("urgencyDesc", urgensiText)
            formData.append("priorityLevel", prioritas)
            formData.append("uploadedFiles", JSON.stringify(filePaths));
            formData.append("uploadedSupporting", JSON.stringify(supportingPaths));
            formData.append("status", isDraft ? "Draft" : "Dapat Dilanjutkan")
            formData.append("director", selectedDir.map(i => i.value).join(", "))
            formData.append("initiator", selectedPemrakarsa.map(i => i.value).join(", "))
            formData.append("support", selectedSupport.map(i => i.value).join(", "))
            formData.append("notRequiredFiles", JSON.stringify(notRequiredFiles))

            const result = await createRakordirAction(formData)

            if (result.success) {
                showNotify(
                    isDraft ? "Data tersimpan lokal sebagai Draft." : "Agenda masuk antrian verifikasi.",
                    "success"
                );

                setOpen(false)
                resetForm()
                router.refresh()
            } else {
                showNotify("Gagal menyimpan data.", "error")
            }

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan.";
            showNotify(errorMessage, "error");
        } finally {
            setIsPending(false)
        }
    }

    if (!isClient) return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#006070] hover:bg-[#004d5a] text-white shadow-md font-semibold rounded-lg h-10 px-4 transition-all active:scale-95">
                    <PlusCircle className="mr-2 h-4 w-4" /> Tambah Usulan
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-[95vw] sm:max-w-3xl h-[90vh] max-h-[90vh] p-0 flex flex-col gap-0 border-none shadow-2xl rounded-xl bg-white overflow-hidden">
                <DialogHeader className="px-6 py-5 bg-[#006070] text-white shrink-0 z-10">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-[#4ade80]" />
                        Form Usulan Agenda RAKORDIR
                    </DialogTitle>
                    <DialogDescription className="text-slate-100/80 text-sm">
                        Lengkapi formulir di bawah ini untuk mengajukan agenda RAKORDIR baru.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className="flex-1 overflow-y-auto bg-slate-50/50 px-6 py-6 scroll-smooth">
                        <div className="grid gap-8 pb-4">
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                    <div className="bg-[#006070] text-white text-xs font-bold px-2 py-0.5 rounded">1</div>
                                    <h3 className="font-bold text-slate-700 uppercase text-sm tracking-wide">Informasi Agenda</h3>
                                </div>
                                <div className="grid gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[#006070] font-semibold">Judul Agenda</Label>
                                        <Textarea name="title" value={judul} onChange={(e) => setJudul(e.target.value)} required className="min-h-20 bg-white border-slate-300 focus:border-[#006070]" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[#006070] font-semibold">Penjelasan Urgensi</Label>
                                        <Textarea name="urgency" value={urgensiText} onChange={(e) => setUrgensiText(e.target.value)} required placeholder="Jelaskan kenapa agenda ini penting..." className="min-h-20 bg-white border-slate-300 focus:border-[#006070]" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[#006070] font-semibold">Deadline Rapat</Label>
                                            <Input name="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required className="bg-white border-slate-300" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[#006070] font-semibold">Prioritas (Otomatis)</Label>
                                            <div className="h-10 flex items-center px-3 border rounded-md bg-slate-100 font-bold text-sm">
                                                <span className={prioritas === "High" ? "text-red-600" : prioritas === "Medium" ? "text-orange-600" : prioritas === "-" ? "text-slate-400" : "text-green-600"}>{prioritas.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                    <div className="bg-[#006070] text-white text-xs font-bold px-2 py-0.5 rounded">2</div>
                                    <h3 className="font-bold text-slate-700 uppercase text-sm tracking-wide">Pihak Terkait & Narahubung</h3>
                                </div>
                                <div className="grid gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-600">Direktur Pemrakarsa</Label>
                                        <Select isMulti options={dirOptions} styles={selectStyles} value={selectedDir} onChange={setSelectedDir} placeholder="Pilih Direktur..." menuPlacement="auto" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-600">Pemrakarsa (Divisi/Unit)</Label>
                                        <Select isMulti options={pemOptions} styles={selectStyles} value={selectedPemrakarsa} onChange={setSelectedPemrakarsa} placeholder="Pilih Pemrakarsa..." menuPlacement="auto" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-600">Support (Divisi/Unit)</Label>
                                        {/* Opsi Support gabungan dari Initiator dan Support */}
                                        <Select isMulti options={[...pemOptions, ...supOptions]} styles={selectStyles} value={selectedSupport} onChange={handleSupportChange} placeholder="Pilih Unit Support..." menuPlacement="auto" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                        <div className="space-y-1.5">
                                            <Label className="text-slate-600 text-xs uppercase font-bold flex items-center gap-1"><User className="h-3 w-3" /> Nama Narahubung</Label>
                                            <Input name="contactPerson" placeholder="Nama Lengkap" required className="bg-white" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-slate-600 text-xs uppercase font-bold flex items-center gap-1"><Briefcase className="h-3 w-3" /> Jabatan</Label>
                                            <Input name="position" placeholder="Jabatan" required className="bg-white" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-slate-600 text-xs uppercase font-bold flex items-center gap-1"><Phone className="h-3 w-3" /> No. HP / WA</Label>
                                            <Input name="phone" type="number" placeholder="0812..." required className="bg-white" />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                    <div className="bg-[#006070] text-white text-xs font-bold px-2 py-0.5 rounded">3</div>
                                    <h3 className="font-bold text-slate-700 uppercase text-sm tracking-wide">Lampiran Dokumen</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    {FILE_LIST.map((doc) => (
                                        <div key={doc.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${notRequiredFiles.includes(doc.id) ? "bg-slate-100 border-slate-200" : "bg-white border-slate-200 hover:border-[#006070]"}`}>
                                            <div className="flex flex-col gap-1 flex-1 mr-4">
                                                <Label htmlFor={doc.id} className={`text-xs font-bold uppercase ${notRequiredFiles.includes(doc.id) ? "text-slate-400" : "text-slate-700"}`}>{doc.label}</Label>
                                                {!notRequiredFiles.includes(doc.id) && (
                                                    <Input id={doc.id} name={doc.id} type="file" accept=".pdf" className="h-8 text-[10px] file:mr-2 file:h-full file:bg-slate-100 file:text-slate-600 file:border-0 cursor-pointer" />
                                                )}
                                            </div>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => toggleNotRequired(doc.id)} className={`h-7 px-2 text-[10px] ${notRequiredFiles.includes(doc.id) ? "text-red-500 bg-red-50" : "text-slate-400 hover:text-slate-600"}`}>
                                                {notRequiredFiles.includes(doc.id) ? <><EyeOff className="h-3 w-3 mr-1" /> Tidak Diperlukan</> : "Wajib"}
                                            </Button>
                                        </div>
                                    ))}

                                    <div className="mt-2 p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                                        <Label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                                            <Paperclip className="h-4 w-4" /> Dokumen Pendukung Lainnya
                                        </Label>
                                        <Input name="supportingDocuments" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" className="bg-white cursor-pointer" />
                                        <p className="text-[10px] text-slate-500 mt-1">*Bisa pilih banyak file sekaligus.</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-white border-t shrink-0 flex items-center justify-between z-10">
                        <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-2 rounded-md border border-yellow-200">
                            <Checkbox id="draft" checked={isDraft} onCheckedChange={(checked) => setIsDraft(checked as boolean)} className="data-[state=checked]:bg-yellow-600 data-[state=checked]:border-yellow-600" />
                            <Label htmlFor="draft" className="text-sm font-medium text-yellow-800 cursor-pointer select-none">Simpan sebagai Draft</Label>
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={isPending} className={`min-w-35 font-bold shadow-md transition-all ${isDraft ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "bg-[#006070] hover:bg-[#004d5a] text-white"}`}>
                                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {loadingMessage}</> : isDraft ? <><FileText className="mr-2 h-4 w-4" /> Simpan Draft</> : <><Send className="mr-2 h-4 w-4" /> Kirim Usulan</>}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
