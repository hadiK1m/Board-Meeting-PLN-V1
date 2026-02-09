// src/components/features/pelaksanaan-rapat/radir/components/keputusan-tab.tsx
"use client";

import { useState } from "react";
import { Plus, Trash2, Gavel, FileCheck, Loader2, ExternalLink, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { showNotify } from "@/components/shared/toast-provider";

interface MeetingDecision {
    decision: string;
    output: string;
    progressTerkini: string;
    status: string; // "dalam_proses" or "selesai"
    evidence: string; // Path in Supabase storage: "radir/evidence/filename"
}

interface KeputusanTabProps {
    meetingDecisions: MeetingDecision[];
    onAddDecision: () => void;
    onRemoveDecision: (index: number) => void;
    onUpdateDecision: (index: number, field: keyof MeetingDecision, value: string) => void;
}

export function KeputusanTab({
    meetingDecisions,
    onAddDecision,
    onRemoveDecision,
    onUpdateDecision,
}: KeputusanTabProps) {
    return (
        <Card>
            <CardHeader className="pb-4">
                <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Gavel className="h-4 w-4 text-[#006070]" />
                        Keputusan Rapat
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Daftar keputusan yang diambil dalam rapat
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {meetingDecisions.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg bg-slate-50/50 border-dashed">
                        <Gavel className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                            Belum ada keputusan rapat.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Klik &quot;Tambah Keputusan&quot; untuk menambahkan.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {meetingDecisions.map((decision, index) => (
                            <DecisionCard
                                key={index}
                                index={index}
                                decision={decision}
                                onRemove={() => onRemoveDecision(index)}
                                onUpdate={(field, value) => onUpdateDecision(index, field, value)}
                            />
                        ))}
                    </div>
                )}
                <Button type="button" onClick={onAddDecision} size="sm" className="w-full bg-[#006070] hover:bg-[#004d5a]">
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Keputusan
                </Button>
            </CardContent>
        </Card>
    );
}

interface DecisionCardProps {
    index: number;
    decision: MeetingDecision;
    onRemove: () => void;
    onUpdate: (field: keyof MeetingDecision, value: string) => void;
}

function DecisionCard({ index, decision, onRemove, onUpdate }: DecisionCardProps) {
    const [isUploading, setIsUploading] = useState(false);

    // Get display name from path
    const getDisplayName = (path: string) => {
        if (!path) return "";
        const parts = path.split("/");
        const filename = parts[parts.length - 1] || "";
        // Remove UUID prefix if present (format: evidence-UUID-originalname)
        const match = filename.match(/^evidence-[a-f0-9-]+-(.+)$/);
        return match ? match[1] : filename;
    };

    // Handle file upload to Supabase
    const handleFileUpload = async (file: File) => {
        setIsUploading(true);
        try {
            const supabase = createClient();

            // Sanitize filename
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const fileName = `evidence-${uuidv4()}-${sanitizedName}`;
            const filePath = `radir/evidence/${fileName}`;

            const { error } = await supabase.storage
                .from('Dokumen')
                .upload(filePath, file);

            if (error) {
                throw new Error(error.message);
            }

            // Store the path in the decision
            onUpdate("evidence", filePath);
            showNotify("File berhasil diupload!", "success");
        } catch (error) {
            console.error("Upload error:", error);
            showNotify("Gagal upload file. Silakan coba lagi.", "error");
        } finally {
            setIsUploading(false);
        }
    };

    // Handle file removal from Supabase
    const handleRemoveFile = async () => {
        if (!decision.evidence) return;

        try {
            const supabase = createClient();
            const { error } = await supabase.storage
                .from('Dokumen')
                .remove([decision.evidence]);

            if (error) {
                console.error("Remove error:", error);
            }

            onUpdate("evidence", "");
            showNotify("File berhasil dihapus.", "success");
        } catch (error) {
            console.error("Remove error:", error);
            onUpdate("evidence", ""); // Still clear the field
        }
    };

    // Open file in new tab
    const handleViewFile = async () => {
        if (!decision.evidence) return;

        try {
            const supabase = createClient();
            const { data, error } = await supabase.storage
                .from('Dokumen')
                .createSignedUrl(decision.evidence, 3600); // 1 hour expiry

            if (error) throw error;
            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank');
            }
        } catch (error) {
            console.error("View error:", error);
            showNotify("Gagal membuka file.", "error");
        }
    };

    return (
        <div className="border rounded-xl p-5 bg-linear-to-br from-slate-50 to-white shadow-sm">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#006070] text-white text-sm font-bold">
                        {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">
                        Keputusan #{index + 1}
                    </span>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Hapus
                </Button>
            </div>
            <div className="space-y-4">
                <div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Isi Keputusan
                    </Label>
                    <Textarea
                        placeholder="Tuliskan isi keputusan..."
                        value={decision.decision}
                        onChange={(e) => onUpdate("decision", e.target.value)}
                        className="mt-1.5 min-h-20 resize-y"
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Output
                        </Label>
                        <Input
                            placeholder="Output yang diharapkan..."
                            value={decision.output}
                            onChange={(e) => onUpdate("output", e.target.value)}
                            className="mt-1.5"
                        />
                    </div>
                    <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Progress Terkini
                        </Label>
                        <Input
                            placeholder="Status progress saat ini..."
                            value={decision.progressTerkini}
                            onChange={(e) => onUpdate("progressTerkini", e.target.value)}
                            className="mt-1.5"
                        />
                    </div>
                    <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Status
                        </Label>
                        <Select
                            value={decision.status || "dalam_proses"}
                            onValueChange={(value) => onUpdate("status", value)}
                        >
                            <SelectTrigger className="mt-1.5">
                                <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="dalam_proses">Dalam Proses</SelectItem>
                                <SelectItem value="selesai">Selesai</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <FileCheck className="h-3 w-3" />
                        Evidence (Bukti Fisik)
                    </Label>
                    <div className="mt-1.5">
                        {decision.evidence ? (
                            <div className="flex items-center gap-2 p-2 bg-slate-50 border rounded-md">
                                <FileCheck className="h-4 w-4 text-green-600 shrink-0" />
                                <span className="text-sm text-slate-700 truncate flex-1">
                                    {getDisplayName(decision.evidence)}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleViewFile}
                                    className="h-7 px-2 text-[#006070] hover:text-[#004d5a]"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemoveFile}
                                    className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                    disabled={isUploading}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            handleFileUpload(file);
                                        }
                                    }}
                                    className="flex-1 cursor-pointer"
                                />
                                {isUploading && (
                                    <Loader2 className="h-4 w-4 animate-spin text-[#006070]" />
                                )}
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Upload bukti fisik (PDF, DOC, XLS, atau gambar) ke bucket Dokumen
                    </p>
                </div>
            </div>
        </div>
    );
}
