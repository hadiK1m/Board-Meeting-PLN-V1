// src/components/features/monev/rakordir/update-progress-dialog.tsx
"use client";

import { useState, useTransition } from "react";
import { Loader2, CheckCircle2, Clock, FileCheck, ExternalLink, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArahanDireksiItem } from "@/server/actions/monev-rakordir-actions";
import { createClient } from "@/lib/supabase/client";
import { showNotify } from "@/components/shared/toast-provider";

interface UpdateProgressDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    agendaId: string;
    agendaTitle: string;
    notulensiNumber: string;
    arahanDireksi: ArahanDireksiItem[];
    onSuccess?: () => void;
}

export function UpdateProgressDialog({
    open,
    onOpenChange,
    agendaId,
    agendaTitle,
    notulensiNumber,
    arahanDireksi: initialArahan,
    onSuccess,
}: UpdateProgressDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [localArahan, setLocalArahan] = useState<ArahanDireksiItem[]>(initialArahan);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

    // Reset local state when dialog opens
    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            setLocalArahan(initialArahan);
        }
        onOpenChange(newOpen);
    };

    // Update a specific arahan field
    const updateArahan = (index: number, field: keyof ArahanDireksiItem, value: string) => {
        setLocalArahan(prev => {
            const updated = [...prev];
            if (updated[index]) {
                updated[index] = { ...updated[index], [field]: value } as ArahanDireksiItem;
            }
            return updated;
        });
    };

    // Get display name from path
    const getDisplayName = (path: string) => {
        if (!path) return "";
        const parts = path.split("/");
        const filename = parts[parts.length - 1] || "";
        const match = filename.match(/^evidence-[a-f0-9-]+-(.+)$/);
        return match ? match[1] : filename;
    };

    // Handle file upload
    const handleFileUpload = async (index: number, file: File) => {
        setUploadingIndex(index);
        try {
            const supabase = createClient();
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const fileName = `evidence-${uuidv4()}-${sanitizedName}`;
            const filePath = `rakordir/evidence/${fileName}`;

            const { error } = await supabase.storage
                .from('Dokumen')
                .upload(filePath, file);

            if (error) throw error;

            updateArahan(index, "evidence", filePath);
            showNotify("File berhasil diupload!", "success");
        } catch (error) {
            console.error("Upload error:", error);
            showNotify("Gagal upload file.", "error");
        } finally {
            setUploadingIndex(null);
        }
    };

    // Handle file view
    const handleViewFile = async (path: string) => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase.storage
                .from('Dokumen')
                .createSignedUrl(path, 3600);

            if (error) throw error;
            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank');
            }
        } catch (error) {
            console.error("View error:", error);
            showNotify("Gagal membuka file.", "error");
        }
    };

    // Handle file removal
    const handleRemoveFile = async (index: number) => {
        const path = localArahan[index]?.evidence;
        if (!path) return;

        try {
            const supabase = createClient();
            await supabase.storage.from('Dokumen').remove([path]);
            updateArahan(index, "evidence", "");
            showNotify("File berhasil dihapus.", "success");
        } catch (error) {
            console.error("Remove error:", error);
            updateArahan(index, "evidence", "");
        }
    };

    // Handle save
    const handleSave = () => {
        startTransition(async () => {
            try {
                // Call API to update arahan direksi
                const response = await fetch('/api/monev/update-arahan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agendaId,
                        arahanDireksi: localArahan,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to update');
                }

                showNotify("Progress berhasil diperbarui!", "success");
                onOpenChange(false);
                onSuccess?.();
            } catch (error) {
                console.error("Save error:", error);
                showNotify("Gagal menyimpan perubahan.", "error");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-[#125d72]" />
                        Update Progress Arahan Direksi
                    </DialogTitle>
                    <DialogDescription>
                        <Badge variant="secondary" className="bg-[#125d72] text-white font-mono mr-2">
                            {notulensiNumber}
                        </Badge>
                        <span className="text-slate-600">{agendaTitle}</span>
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-6 py-4">
                        {localArahan.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Belum ada arahan direksi untuk agenda ini.
                            </div>
                        ) : (
                            localArahan.map((arahan, index) => (
                                <div key={index} className="border rounded-lg p-4 bg-slate-50/50">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#125d72] text-white text-sm font-bold">
                                                {index + 1}
                                            </span>
                                            <span className="text-sm font-medium text-slate-700">
                                                Arahan #{index + 1}
                                            </span>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={
                                                arahan.statusPenyelesaian === "selesai"
                                                    ? "bg-green-50 text-green-700 border-green-200"
                                                    : "bg-orange-50 text-orange-700 border-orange-200"
                                            }
                                        >
                                            {arahan.statusPenyelesaian === "selesai" ? (
                                                <><CheckCircle2 className="h-3 w-3 mr-1" /> Selesai</>
                                            ) : (
                                                <><Clock className="h-3 w-3 mr-1" /> Dalam Proses</>
                                            )}
                                        </Badge>
                                    </div>

                                    {/* Isi Arahan (Read-only) */}
                                    <div className="mb-4">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                                            Isi Arahan
                                        </Label>
                                        <p className="text-sm text-slate-700 mt-1 p-2 bg-white rounded border">
                                            {arahan.arahan || <span className="italic text-muted-foreground">Tidak ada</span>}
                                        </p>
                                    </div>

                                    <Separator className="my-4" />

                                    {/* Editable Fields */}
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                                                Target Output
                                            </Label>
                                            <Textarea
                                                value={arahan.targetOutput || ""}
                                                onChange={(e) => updateArahan(index, "targetOutput", e.target.value)}
                                                placeholder="Target output yang diharapkan..."
                                                className="mt-1 min-h-20 resize-y"
                                            />
                                        </div>



                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                                                Progress Terkini
                                            </Label>
                                            <Textarea
                                                value={arahan.progresTerkini || ""}
                                                onChange={(e) => updateArahan(index, "progresTerkini", e.target.value)}
                                                placeholder="Jelaskan progress terkini..."
                                                className="mt-1 min-h-20 resize-y"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                                <FileCheck className="h-3 w-3" />
                                                Evidence (Bukti)
                                            </Label>
                                            <div className="mt-1">
                                                {arahan.evidence ? (
                                                    <div className="flex items-center gap-2 p-2 bg-white border rounded-md">
                                                        <FileCheck className="h-4 w-4 text-green-600 shrink-0" />
                                                        <span className="text-sm text-slate-700 truncate flex-1">
                                                            {getDisplayName(arahan.evidence)}
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewFile(arahan.evidence)}
                                                            className="h-7 px-2 text-[#006070]"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleRemoveFile(index)}
                                                            className="h-7 px-2 text-destructive hover:text-destructive"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="file"
                                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                                            disabled={uploadingIndex === index}
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleFileUpload(index, file);
                                                            }}
                                                            className="flex-1 cursor-pointer"
                                                        />
                                                        {uploadingIndex === index && (
                                                            <Loader2 className="h-4 w-4 animate-spin text-[#006070]" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                                                Status
                                            </Label>
                                            <Select
                                                value={arahan.statusPenyelesaian || "dalam_proses"}
                                                onValueChange={(value) => updateArahan(index, "statusPenyelesaian", value)}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="dalam_proses">Dalam Proses</SelectItem>
                                                    <SelectItem value="selesai">Selesai</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isPending || localArahan.length === 0}
                        className="bg-[#125d72] hover:bg-[#14a2ba]"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Simpan Perubahan
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
