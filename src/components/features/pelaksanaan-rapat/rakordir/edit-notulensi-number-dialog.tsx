// src/components/features/pelaksanaan-rapat/rakordir/edit-notulensi-number-dialog.tsx
"use client";

import { useState } from "react";
import { Pencil, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { showNotify } from "@/components/shared/toast-provider";
import { updateNotulensiNumberAction } from "@/server/actions/pelaksanaan-rakordir-actions";

interface EditNotulensiNumberDialogProps {
    currentNotulensiNumber: string;
}

export function EditNotulensiNumberDialog({
    currentNotulensiNumber,
}: EditNotulensiNumberDialogProps) {
    const [open, setOpen] = useState(false);
    const [notulensiNumber, setNotulensiNumber] = useState(currentNotulensiNumber);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!notulensiNumber.trim()) {
            showNotify("Nomor notulensi tidak boleh kosong.", "error");
            return;
        }

        setIsLoading(true);

        try {
            const result = await updateNotulensiNumberAction(
                currentNotulensiNumber,
                notulensiNumber.trim()
            );

            if (result.success) {
                showNotify(result.message || "Nomor notulensi berhasil diubah.", "success");
                setOpen(false);
            } else {
                showNotify(result.error || "Gagal mengubah nomor notulensi.", "error");
            }
        } catch (error) {
            console.error("Error updating notulensi number:", error);
            showNotify("Terjadi kesalahan saat mengubah nomor notulensi.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            setNotulensiNumber(currentNotulensiNumber);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-slate-500 hover:text-[#006070] hover:bg-[#e6f2f5]"
                    title="Edit Nomor Notulensi"
                >
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pencil className="h-5 w-5 text-[#006070]" />
                        Edit Nomor Notulensi
                    </DialogTitle>
                    <DialogDescription>
                        Ubah nomor notulensi. Perubahan akan diterapkan ke semua agenda dalam meeting.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="notulensiNumber">Nomor Notulensi</Label>
                            <Input
                                id="notulensiNumber"
                                value={notulensiNumber}
                                onChange={(e) => setNotulensiNumber(e.target.value)}
                                placeholder="Contoh: NTL-001/2026"
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Nomor saat ini: <span className="font-medium">{currentNotulensiNumber}</span>
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !notulensiNumber.trim()}
                            className="bg-[#006070] hover:bg-[#004050]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                "Simpan Perubahan"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
