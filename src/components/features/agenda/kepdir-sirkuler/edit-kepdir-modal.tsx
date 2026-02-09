"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileText, Loader2, Save, FileCheck, Paperclip, EyeOff, User, Briefcase, Phone, Trash2, AlertCircle } from "lucide-react"
import Select, { MultiValue, StylesConfig } from "react-select"
import { v4 as uuidv4 } from 'uuid';

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

import { updateKepdirAction, getKepdirById } from "@/server/actions/kepdir-actions"
import { getUnitsByCategory } from "@/server/master-data-actions"
import { createClient } from "@/lib/supabase/client"
import { DeleteKepdirDialog } from "./delete-kepdir-dialog"
import { showNotify } from "@/components/shared/toast-provider"

interface AgendaData {
    title: string;
    status: string;
    director: string | null;
    initiator: string | null;
    contactPerson?: string | null;
    position?: string | null;
    phone?: string | null;
    filePaths?: Record<string, string> | null;
    supportingFiles?: string[] | null;
}

const selectStyles: StylesConfig<{ label: string; value: string }, true> = {
    control: (base) => ({
        ...base, borderColor: "#e2e8f0", "&:hover": { borderColor: "#006070" },
        boxShadow: "none", borderRadius: "0.5rem", fontSize: "0.875rem", minHeight: "44px",
    }),
    multiValue: (base) => ({ ...base, backgroundColor: "#e6f2f5", borderRadius: "0.25rem", border: "1px solid #bce3eb" }),
    multiValueLabel: (base) => ({ ...base, color: "#006070", fontWeight: "600", fontSize: "0.75rem" }),
    multiValueRemove: (base) => ({ ...base, color: "#006070", "&:hover": { backgroundColor: "#006070", color: "white" } }),
}

interface EditKepdirModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    agendaId: string | null;
}

export function EditKepdirModal({ open, onOpenChange, agendaId }: EditKepdirModalProps) {
    const supabase = createClient()
    const router = useRouter()

    const [isLoadingData, setIsLoadingData] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState("Proses...")

    const [judul, setJudul] = useState("")
    const [isDraft, setIsDraft] = useState(false)

    const [dirOptions, setDirOptions] = useState<{ label: string; value: string }[]>([])
    const [pemOptions, setPemOptions] = useState<{ label: string; value: string }[]>([])

    const [selectedDir, setSelectedDir] = useState<MultiValue<{ label: string; value: string }>>([])
    const [selectedPemrakarsa, setSelectedPemrakarsa] = useState<MultiValue<{ label: string; value: string }>>([])

    const [contactPerson, setContactPerson] = useState("")
    const [position, setPosition] = useState("")
    const [phone, setPhone] = useState("")

    const [notRequiredFiles, setNotRequiredFiles] = useState<string[]>([])
    const [existingFiles, setExistingFiles] = useState<Record<string, string>>({})
    const [existingSupporting, setExistingSupporting] = useState<string[]>([])

    const [fileToDelete, setFileToDelete] = useState<string | null>(null)
    const [showDeleteAgenda, setShowDeleteAgenda] = useState(false)

    const FILE_LIST = [
        { id: "kepdirFile", label: "Dokumen Kepdir Sirkuler" },
        { id: "grcFile", label: "Dokumen GRC" },
    ] as const

    useEffect(() => {
        if (open) {
            const fetchMaster = async () => {
                if (dirOptions.length > 0) return;
                const [dirs, pems] = await Promise.all([
                    getUnitsByCategory("DIREKTUR_PEMRAKARSA"),
                    getUnitsByCategory("PEMRAKARSA")
                ])
                setDirOptions(dirs); setPemOptions(pems);
            }
            fetchMaster()
        }
    }, [open, dirOptions.length])

    useEffect(() => {
        if (open && agendaId) {
            setIsLoadingData(true)
            const fetchAgenda = async () => {
                const rawData = await getKepdirById(agendaId)
                const data = rawData as unknown as AgendaData

                if (data) {
                    setJudul(data.title ?? "")
                    setIsDraft(data.status === "Draft")

                    setContactPerson(data.contactPerson ?? "")
                    setPosition(data.position ?? "")
                    setPhone(data.phone ?? "")

                    setExistingFiles(data.filePaths || {})
                    setExistingSupporting(data.supportingFiles || [])

                    if (data.director) setSelectedDir(data.director.split(", ").map(d => ({ label: d, value: d })))
                    else setSelectedDir([])

                    if (data.initiator) setSelectedPemrakarsa(data.initiator.split(", ").map(i => ({ label: i, value: i })))
                    else setSelectedPemrakarsa([])
                }
                setIsLoadingData(false)
            }
            fetchAgenda()
        }
    }, [open, agendaId])

    const toggleNotRequired = (fieldId: string) => {
        setNotRequiredFiles((prev) =>
            prev.includes(fieldId) ? prev.filter((f) => f !== fieldId) : [...prev, fieldId]
        )
    }

    const handleConfirmDelete = () => {
        if (fileToDelete) {
            const newFiles = { ...existingFiles };
            delete newFiles[fileToDelete];
            setExistingFiles(newFiles);
            setFileToDelete(null);
            showNotify("File dihapus dari daftar. Silakan upload file baru.", "info");
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!agendaId) return;

        setIsPending(true)
        setLoadingMessage("Memproses perubahan...")

        const formData = new FormData(event.currentTarget)
        const newFilePaths: Record<string, string> = { ...existingFiles }
        const newSupportingPaths: string[] = [...existingSupporting]

        try {
            for (const doc of FILE_LIST) {
                if (notRequiredFiles.includes(doc.id)) {
                    delete newFilePaths[doc.id];
                    continue;
                }

                const file = formData.get(doc.id) as File;
                if (file && file.size > 0) {
                    setLoadingMessage(`Mengunggah update ${doc.label}...`)
                    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                    const fileName = `${doc.id}-${uuidv4()}-${sanitizedName}`;
                    const filePath = `kepdir/${fileName}`;

                    const { error } = await supabase.storage.from('Dokumen').upload(filePath, file);
                    if (error) throw new Error(error.message);

                    newFilePaths[doc.id] = filePath;
                }
                formData.delete(doc.id)
            }


            const supportingFiles = formData.getAll("supportingDocuments") as File[];
            if (supportingFiles.length > 0) {
                let count = 1;
                for (const file of supportingFiles) {
                    if (file && file.size > 0) {
                        setLoadingMessage(`Mengunggah Pendukung Baru (${count})...`)
                        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                        const fileName = `support-${uuidv4()}-${sanitizedName}`;
                        const filePath = `kepdir/supporting/${fileName}`;

                        const { error } = await supabase.storage.from('Dokumen').upload(filePath, file);
                        if (error) throw new Error(error.message);

                        newSupportingPaths.push(filePath);
                    }
                    count++;
                }
                formData.delete("supportingDocuments")
            }

            setLoadingMessage("Menyimpan perubahan...")

            formData.append("finalFilePaths", JSON.stringify(newFilePaths))
            formData.append("finalSupportingFiles", JSON.stringify(newSupportingPaths))
            formData.append("status", isDraft ? "Draft" : "Dapat Dilanjutkan")
            formData.append("director", selectedDir.map(i => i.value).join(", "))
            formData.append("initiator", selectedPemrakarsa.map(i => i.value).join(", "))
            formData.append("contactPerson", contactPerson)
            formData.append("position", position)
            formData.append("phone", phone)

            const result = await updateKepdirAction(agendaId, formData)

            if (result.success) {
                showNotify("Perubahan data telah berhasil disimpan.", "success");
                onOpenChange(false)
                router.refresh()
            } else {
                showNotify("Gagal update data.", "error")
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Error";
            showNotify(msg, "error");
        } finally {
            setIsPending(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[95vw] sm:max-w-3xl h-[90vh] max-h-[90vh] p-0 flex flex-col gap-0 border-none shadow-2xl rounded-xl bg-white overflow-hidden">
                    <DialogHeader className="px-6 py-5 bg-[#006070] text-white shrink-0 z-10">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <FileText className="h-5 w-5 text-yellow-400" />
                            Edit Agenda Kepdir Sirkuler
                        </DialogTitle>
                        <DialogDescription className="text-slate-100/80 text-sm">
                            Perbarui informasi agenda di bawah ini.
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingData ? (
                        <div className="flex flex-1 items-center justify-center flex-col gap-3 text-[#006070]">
                            <Loader2 className="h-10 w-10 animate-spin" />
                            <p className="text-sm font-medium">Mengambil data agenda...</p>
                        </div>
                    ) : (
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
                                                <Label className="text-slate-600">Pemrakarsa</Label>
                                                <Select isMulti options={pemOptions} styles={selectStyles} value={selectedPemrakarsa} onChange={setSelectedPemrakarsa} placeholder="Pilih Pemrakarsa..." menuPlacement="auto" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                                <div className="space-y-1.5">
                                                    <Label className="text-slate-600 text-xs uppercase font-bold flex items-center gap-1"><User className="h-3 w-3" /> Nama Narahubung</Label>
                                                    <Input name="contactPerson" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Nama Lengkap" required className="bg-white" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-slate-600 text-xs uppercase font-bold flex items-center gap-1"><Briefcase className="h-3 w-3" /> Jabatan</Label>
                                                    <Input name="position" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Jabatan" required className="bg-white" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-slate-600 text-xs uppercase font-bold flex items-center gap-1"><Phone className="h-3 w-3" /> No. HP / WA</Label>
                                                    <Input name="phone" type="number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812..." required className="bg-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                            <div className="bg-[#006070] text-white text-xs font-bold px-2 py-0.5 rounded">3</div>
                                            <h3 className="font-bold text-slate-700 uppercase text-sm tracking-wide">Update Dokumen</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            {FILE_LIST.map((doc) => (
                                                <div key={doc.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${notRequiredFiles.includes(doc.id) ? "bg-slate-100 border-slate-200" : "bg-white border-slate-200 hover:border-[#006070]"}`}>
                                                    <div className="flex flex-col gap-1 flex-1 mr-4">
                                                        <Label htmlFor={doc.id} className={`text-xs font-bold uppercase ${notRequiredFiles.includes(doc.id) ? "text-slate-400" : "text-slate-700"}`}>
                                                            {doc.label}
                                                        </Label>
                                                        {!notRequiredFiles.includes(doc.id) && (
                                                            <>
                                                                {existingFiles[doc.id] ? (
                                                                    <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                                                                        <div className="flex items-center gap-2 text-[10px] text-green-700 bg-green-50 px-3 py-1.5 rounded border border-green-200 w-fit">
                                                                            <FileCheck className="h-3.5 w-3.5" />
                                                                            <span className="font-medium">File tersimpan</span>
                                                                        </div>
                                                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" onClick={() => setFileToDelete(doc.id)} title="Hapus untuk mengganti file">
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <Input id={doc.id} name={doc.id} type="file" accept=".pdf" className="h-8 text-[10px] file:mr-2 file:h-full file:bg-slate-100 file:text-slate-600 file:border-0 cursor-pointer animate-in fade-in slide-in-from-left-2" />
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => toggleNotRequired(doc.id)} className={`h-7 px-2 text-[10px] ${notRequiredFiles.includes(doc.id) ? "text-red-500 bg-red-50" : "text-slate-400 hover:text-slate-600"}`}>
                                                        {notRequiredFiles.includes(doc.id) ? <><EyeOff className="h-3 w-3 mr-1" /> Tidak Diperlukan</> : "Wajib"}
                                                    </Button>
                                                </div>
                                            ))}

                                            <div className="mt-2 p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                                                <Label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                                                    <Paperclip className="h-4 w-4" /> Tambah Dokumen Pendukung
                                                </Label>
                                                {existingSupporting.length > 0 && (
                                                    <div className="mb-3 flex flex-wrap gap-2">
                                                        {existingSupporting.map((_, i) => (
                                                            <div key={i} className="text-[10px] bg-white border px-2 py-1 rounded flex items-center gap-1 text-slate-500">
                                                                <FileCheck className="h-3 w-3 text-green-600" /> Lampiran #{i + 1}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <Input name="supportingDocuments" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" className="bg-white cursor-pointer" />
                                                <p className="text-[10px] text-slate-500 mt-1">*Upload file baru untuk menambah lampiran.</p>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>

                            <DialogFooter className="p-4 bg-white border-t shrink-0 flex items-center justify-between z-10">
                                {agendaId && (
                                    <Button type="button" variant="destructive" onClick={() => setShowDeleteAgenda(true)} className="mr-auto bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-none">
                                        <Trash2 className="mr-2 h-4 w-4" /> Hapus Agenda
                                    </Button>
                                )}
                                <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-2 rounded-md border border-yellow-200">
                                    <Checkbox id="draftEdit" checked={isDraft} onCheckedChange={(checked) => setIsDraft(checked as boolean)} className="data-[state=checked]:bg-yellow-600 data-[state=checked]:border-yellow-600" />
                                    <Label htmlFor="draftEdit" className="text-sm font-medium text-yellow-800 cursor-pointer select-none">Simpan sebagai Draft</Label>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Batal</Button>
                                    <Button type="submit" disabled={isPending} className="bg-[#006070] hover:bg-[#004d5a] text-white min-w-35 font-bold shadow-md">
                                        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {loadingMessage}</> : <><Save className="mr-2 h-4 w-4" /> Simpan Perubahan</>}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600"><AlertCircle className="h-5 w-5" /> Hapus Dokumen?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-600">Apakah Anda yakin ingin menghapus dokumen ini? <br /><span className="font-semibold text-slate-800">Tindakan ini tidak dapat dibatalkan.</span> Anda harus mengunggah dokumen baru sebagai pengganti.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold">Ya, Hapus & Ganti</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {agendaId && (
                <DeleteKepdirDialog
                    open={showDeleteAgenda}
                    onOpenChange={setShowDeleteAgenda}
                    ids={[agendaId]}
                    onSuccess={() => { onOpenChange(false); router.refresh(); }}
                />
            )}
        </>
    )
}
