"use client"

import { useState } from "react"
import { Trash2, AlertTriangle, Loader2 } from "lucide-react"

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
import { deleteRadir, deleteBulkRadir } from "@/server/actions/radir-delete-actions"
import { showNotify } from "@/components/shared/toast-provider"

interface DeleteRadirDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    ids: string[] // Array ID (bisa 1 atau banyak)
    onSuccess?: () => void
}

export function DeleteRadirDialog({ open, onOpenChange, ids, onSuccess }: DeleteRadirDialogProps) {
    const [isPending, setIsPending] = useState(false)
    const isBulk = ids.length > 1

    const handleDelete = async () => {
        setIsPending(true)
        try {
            const result = isBulk
                ? await deleteBulkRadir(ids)
                : await deleteRadir(ids[0] ?? "")

            if (result.success) {
                showNotify(result.message || "Berhasil dihapus", "success")
                onOpenChange(false)
                if (onSuccess) onSuccess()
            } else {
                showNotify(result.message || "Gagal menghapus", "error")
            }
        } catch {
            showNotify("Terjadi kesalahan saat menghapus.", "error")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        {isBulk ? `Hapus ${ids.length} Agenda Terpilih?` : "Hapus Agenda?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Agenda yang dihapus akan hilang permanen dari database.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold"
                        disabled={isPending}
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        {isPending ? "Menghapus..." : "Ya, Hapus"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}