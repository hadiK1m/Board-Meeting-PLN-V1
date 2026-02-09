"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, Link as LinkIcon, MapPin, Loader2, CalendarDays, XCircle } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { showNotify } from "@/components/shared/toast-provider"
import { scheduleBulkAgendas } from "@/server/actions/agenda-siap-actions"
import { useRouter } from "next/navigation"

interface ScheduleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedAgendas: { id: string; title: string }[]
    onSuccess?: () => void
}

export function ScheduleDialog({ open, onOpenChange, selectedAgendas, onSuccess }: ScheduleDialogProps) {
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)

    // Form State
    const [date, setDate] = useState("")
    const [startTime, setStartTime] = useState("")

    // State untuk Jam Selesai
    const [endTime, setEndTime] = useState("Selesai")
    const [isCustomEndTime, setIsCustomEndTime] = useState(false)

    const [method, setMethod] = useState("HYBRID (Campuran)")
    const [location, setLocation] = useState("")
    const [link, setLink] = useState("")

    // Reset form saat dialog dibuka/tutup
    useEffect(() => {
        if (!open) return;
        // Optional: Reset logic here if needed when reopening
    }, [open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!date || !startTime) {
            showNotify("Tanggal dan Jam Mulai wajib diisi.", "error")
            return
        }

        setIsPending(true)
        try {
            const ids = selectedAgendas.map(a => a.id)
            const result = await scheduleBulkAgendas(ids, {
                executionDate: date,
                startTime,
                endTime,
                meetingMethod: method,
                meetingLocation: location,
                meetingLink: link
            })

            if (result.success) {
                showNotify(result.message || "Jadwal berhasil ditetapkan", "success")
                onOpenChange(false)
                if (onSuccess) onSuccess()
                router.refresh()
            } else {
                showNotify(result.error || "Gagal menetapkan jadwal", "error")
            }
        } catch {
            showNotify("Terjadi kesalahan sistem.", "error")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-[#006070]">
                        <CalendarDays className="h-5 w-5" />
                        PENETAPAN JADWAL MASSAL
                    </DialogTitle>
                    <DialogDescription>
                        Tetapkan jadwal untuk <b>{selectedAgendas.length} agenda terpilih</b>.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* List Agenda Terpilih */}
                    <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                        <Label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">AGENDA TERPILIH</Label>
                        <ScrollArea className="h-24 pr-2">
                            <ul className="space-y-1">
                                {selectedAgendas.map((agenda) => (
                                    <li key={agenda.id} className="text-xs text-slate-700 list-disc list-inside line-clamp-1">
                                        {agenda.title}
                                    </li>
                                ))}
                            </ul>
                        </ScrollArea>
                    </div>

                    <div className="grid gap-4">
                        {/* Tanggal */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-600">TANGGAL PELAKSANAAN</Label>
                            <div className="relative">
                                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    type="date"
                                    className="pl-9"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Waktu */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-600">MULAI</Label>
                                <div className="relative">
                                    <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="time"
                                        className="pl-9"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        required
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
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            readOnly={!isCustomEndTime}
                                            placeholder="Selesai"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="shrink-0"
                                        onClick={() => {
                                            if (isCustomEndTime) { setIsCustomEndTime(false); setEndTime("Selesai"); }
                                            else { setIsCustomEndTime(true); setEndTime(""); }
                                        }}
                                        title={isCustomEndTime ? "Set ke 'Selesai'" : "Set Jam Selesai"}
                                    >
                                        {isCustomEndTime ? <XCircle className="h-4 w-4 text-red-500" /> : <Clock className="h-4 w-4 text-slate-600" />}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Metode */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-600">METODE RAPAT</Label>
                            <Select value={method} onValueChange={setMethod}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih metode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OFFLINE (Tatap Muka)">OFFLINE (Tatap Muka)</SelectItem>
                                    <SelectItem value="ONLINE (Daring)">ONLINE (Daring)</SelectItem>
                                    <SelectItem value="HYBRID (Campuran)">HYBRID (Campuran)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Lokasi & Link */}
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            {(method === "OFFLINE (Tatap Muka)" || method === "HYBRID (Campuran)") && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-600">LOKASI RUANGAN</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                        <Input
                                            className="pl-9"
                                            placeholder="Contoh: Ruang Rapat Lt. 3"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {(method === "ONLINE (Daring)" || method === "HYBRID (Campuran)") && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-600">TAUTAN / LINK MEETING</Label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                        <Input
                                            className="pl-9"
                                            placeholder="https://zoom.us/j/..."
                                            value={link}
                                            onChange={(e) => setLink(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
                            Batal
                        </Button>
                        <Button type="submit" className="bg-[#006070] hover:bg-[#004d5a] text-white font-bold" disabled={isPending}>
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Tetapkan Jadwal
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
