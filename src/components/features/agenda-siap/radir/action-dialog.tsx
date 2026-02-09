"use client"

import { useState } from "react"
import { Loader2, AlertTriangle } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateAgendaStatusAction } from "@/server/actions/agenda-siap-actions"
import { showNotify } from "@/components/shared/toast-provider"
import { useRouter } from "next/navigation"

interface ActionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    agendaId: string | null
    actionType: "tunda" | "batal" | null
    onSuccess?: () => void
}

export function ActionDialog({ open, onOpenChange, agendaId, actionType, onSuccess }: ActionDialogProps) {
    const [reason, setReason] = useState("")
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    const handleSubmit = async () => {
        if (!agendaId || !actionType) return;
        if (!reason.trim()) {
            showNotify("Mohon isi alasan terlebih dahulu.", "error");
            return;
        }

        setIsPending(true);
        try {
            const status = actionType === "tunda" ? "Ditunda" : "Dibatalkan";
            const result = await updateAgendaStatusAction(agendaId, status, reason);

            if (result.success) {
                showNotify(result.message || "Status berhasil diperbarui", "success");
                onOpenChange(false);
                setReason(""); // Reset form
                router.refresh();
                if (onSuccess) onSuccess();
            } else {
                showNotify(result.error || "Gagal memperbarui status", "error");
            }
        } catch {
            showNotify("Terjadi kesalahan sistem.", "error");
        } finally {
            setIsPending(false);
        }
    }

    const title = actionType === "tunda" ? "Tunda Agenda" : "Batalkan Agenda";
    const description = actionType === "tunda"
        ? "Agenda ini akan ditunda pelaksanaannya. Mohon berikan alasan penundaan."
        : "Agenda ini akan dibatalkan sepenuhnya. Tindakan ini tidak dapat dibatalkan. Mohon berikan alasan.";
    const confirmText = actionType === "tunda" ? "Ya, Tunda Agenda" : "Ya, Batalkan Agenda";

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className={`h-5 w-5 ${actionType === 'batal' ? 'text-red-600' : 'text-orange-600'}`} />
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-2 space-y-2">
                    <Label htmlFor="reason" className="text-sm font-semibold text-slate-700">
                        Alasan {actionType === "tunda" ? "Penundaan" : "Pembatalan"} <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        id="reason"
                        placeholder="Tuliskan alasan di sini..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="min-h-25"
                    />
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending} onClick={() => setReason("")}>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleSubmit();
                        }}
                        className={` text-white font-bold`}
                        disabled={isPending}
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {isPending ? "Memproses..." : confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
