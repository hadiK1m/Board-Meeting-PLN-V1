// src/components/features/pelaksanaan-rapat/rakordir/components/dokumen-tab.tsx
"use client";

import { useState, useEffect } from "react";
import { FileText, Upload, Loader2, X, File, FileImage, Archive, Download } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { showNotify } from "@/components/shared/toast-provider";

// Bucket name
const STORAGE_BUCKET = "Dokumen";

// Interface for agenda document data
interface AgendaDocument {
    id: string;
    title: string;
    director: string | null;
    initiator: string | null;
    // Document fields from agendasRakordir
    legalReview?: string | null;
    riskReview?: string | null;
    complianceReview?: string | null;
    regulationReview?: string | null;
    recommendationNote?: string | null;
    proposalNote?: string | null;
    presentationMaterial?: string | null;
    supportingDocuments?: string[];
}

interface DokumenTabProps {
    agendas: AgendaDocument[];
    selectedAgendaId: string;
    notulensiTtd: string | null;
    onNotulensiTtdChange: (path: string | null) => void;
    notulensiNumber?: string; // To use in file path for organization
}

// Helper to get file icon based on extension
function getFileIcon(filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
        return <FileImage className="h-4 w-4 text-green-600" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        return <Archive className="h-4 w-4 text-yellow-600" />;
    }
    if (['pdf'].includes(ext)) {
        return <FileText className="h-4 w-4 text-red-600" />;
    }
    return <File className="h-4 w-4 text-blue-600" />;
}

// Helper to get display name from path
function getDisplayName(path: string | null | undefined): string {
    if (!path) return "";
    const parts = path.split("/");
    const filename = parts[parts.length - 1] || "";
    // Remove UUID prefix if present (format: Type-UUID-originalname or UUID-originalname)
    let name = filename.replace(/^[a-z0-9]+-[a-f0-9-]{36}-/i, '');
    name = name.replace(/^[a-f0-9-]{36}-/i, '');
    return decodeURIComponent(name) || filename;
}

export function DokumenTab({
    agendas,
    selectedAgendaId,
    notulensiTtd,
    onNotulensiTtdChange,
    notulensiNumber,
}: DokumenTabProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

    // Get current selected agenda
    const currentAgenda = agendas.find(a => a.id === selectedAgendaId);

    // Document type labels
    const documentLabels: Record<string, string> = {
        legalReview: "Kajian Hukum",
        riskReview: "Kajian Risiko",
        complianceReview: "Kajian Kepatuhan",
        regulationReview: "Kajian Regulasi",
        recommendationNote: "Nota Rekomendasi",
        proposalNote: "Nota Usulan",
        presentationMaterial: "Materi Presentasi",
    };

    // Get all documents for current agenda
    const getAgendaDocuments = (agenda: AgendaDocument | undefined) => {
        if (!agenda) return [];

        const docs: { label: string; path: string }[] = [];

        // Check each document field
        Object.entries(documentLabels).forEach(([key, label]) => {
            const path = agenda[key as keyof AgendaDocument];
            if (path && typeof path === 'string') {
                docs.push({ label, path });
            }
        });

        // Add supporting documents
        if (agenda.supportingDocuments && Array.isArray(agenda.supportingDocuments)) {
            agenda.supportingDocuments.forEach((path, index) => {
                if (path) {
                    docs.push({ label: `Dokumen Pendukung ${index + 1}`, path });
                }
            });
        }

        return docs;
    };

    const agendaDocuments = getAgendaDocuments(currentAgenda);

    // Fetch signed URLs for all documents
    useEffect(() => {
        const fetchSignedUrls = async () => {
            if (!currentAgenda) return;

            const supabase = createClient();
            const urls: Record<string, string> = {};

            const sign = async (path: string | null | undefined) => {
                if (!path) return;
                if (path.startsWith("http")) {
                    urls[path] = path;
                    return;
                }

                const { data: res } = await supabase.storage
                    .from(STORAGE_BUCKET)
                    .createSignedUrl(path, 3600); // 1 hour expiry

                if (res?.signedUrl) {
                    urls[path] = res.signedUrl;
                }
            };

            // Sign all document paths
            const allPaths = agendaDocuments.map(d => d.path);
            if (notulensiTtd) allPaths.push(notulensiTtd);

            await Promise.all(allPaths.map(p => sign(p)));
            setSignedUrls(urls);
        };

        fetchSignedUrls();
    }, [currentAgenda, agendaDocuments, notulensiTtd]);

    // Handle file upload for Notulensi TTD
    // File disimpan sekali di bucket, path disimpan ke semua agenda terkait notulensi
    const handleNotulensiTtdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            showNotify("Hanya file PDF, JPG, atau PNG yang diperbolehkan.", "error");
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showNotify("Ukuran file maksimal 10MB.", "error");
            return;
        }

        setIsUploading(true);

        try {
            const supabase = createClient();

            // If there's an existing file, delete it first
            if (notulensiTtd) {
                await supabase.storage
                    .from(STORAGE_BUCKET)
                    .remove([notulensiTtd]);
            }

            // Use notulensiNumber in path if available, otherwise use UUID
            const identifier = notulensiNumber ? notulensiNumber.replace(/[^a-zA-Z0-9-]/g, '_') : uuidv4();
            const fileExt = file.name.split('.').pop() || 'pdf';
            const fileName = `notulensi-ttd-${identifier}.${fileExt}`;
            const filePath = `rakordir/notulensi-ttd/${fileName}`;

            // Upload file with upsert to replace existing file with same path
            const { error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: true, // Replace if exists
                });

            if (uploadError) {
                throw uploadError;
            }

            onNotulensiTtdChange(filePath);
            showNotify("File berhasil diupload! Path akan tersimpan ke semua agenda.", "success");
        } catch (error) {
            console.error("Upload error:", error);
            showNotify("Gagal mengupload file. Silakan coba lagi.", "error");
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = "";
        }
    };

    // Handle remove Notulensi TTD
    const handleRemoveNotulensiTtd = async () => {
        if (!notulensiTtd) return;

        try {
            const supabase = createClient();
            const { error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .remove([notulensiTtd]);

            if (error) {
                console.error("Delete error:", error);
            }

            onNotulensiTtdChange(null);
            showNotify("File berhasil dihapus.", "success");
        } catch (error) {
            console.error("Delete error:", error);
            showNotify("Gagal menghapus file.", "error");
        }
    };

    return (
        <div className="space-y-6">
            {/* Upload Perikatan Notulensi (TTD) */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Upload className="h-4 w-4 text-[#006070]" />
                        Upload Perikatan Notulensi
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Upload dokumen notulensi yang telah ditandatangani (PDF, JPG, atau PNG, maks 10MB)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {notulensiTtd ? (
                        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <FileText className="h-5 w-5 text-green-600" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-green-800 truncate">
                                    {getDisplayName(notulensiTtd)}
                                </p>
                                <p className="text-xs text-green-600">File berhasil diupload</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const url = signedUrls[notulensiTtd];
                                        if (url) window.open(url, "_blank");
                                    }}
                                    disabled={!signedUrls[notulensiTtd]}
                                    className="text-green-700 hover:text-green-800 hover:bg-green-100"
                                >
                                    {signedUrls[notulensiTtd] ? <Download className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemoveNotulensiTtd}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-100"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleNotulensiTtdUpload}
                                disabled={isUploading}
                                className="flex-1"
                            />
                            {isUploading && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Uploading...</span>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dokumen Agenda */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#006070]" />
                        Dokumen Agenda
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Daftar dokumen yang terlampir pada agenda: <span className="font-medium">{currentAgenda?.title || "-"}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!currentAgenda ? (
                        <div className="text-center py-8 border rounded-lg bg-slate-50/50 border-dashed">
                            <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                                Pilih agenda terlebih dahulu
                            </p>
                        </div>
                    ) : agendaDocuments.length === 0 ? (
                        <div className="text-center py-8 border rounded-lg bg-slate-50/50 border-dashed">
                            <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                                Tidak ada dokumen terlampir pada agenda ini
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {agendaDocuments.map((doc, index) => {
                                const signedUrl = signedUrls[doc.path];
                                return (
                                    <a
                                        key={index}
                                        href={signedUrl || "#"}
                                        target={signedUrl ? "_blank" : undefined}
                                        rel="noreferrer"
                                        onClick={(e) => {
                                            if (!signedUrl) e.preventDefault();
                                        }}
                                        className={`flex items-center gap-3 p-3 bg-slate-50 border rounded-lg hover:bg-slate-100 transition-colors ${!signedUrl ? "cursor-wait opacity-70" : "cursor-pointer"}`}
                                    >
                                        {getFileIcon(doc.path)}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-700 truncate">
                                                {getDisplayName(doc.path)}
                                            </p>
                                            <Badge variant="secondary" className="text-xs mt-1">
                                                {doc.label}
                                            </Badge>
                                        </div>
                                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-[#006070]/10 transition-colors">
                                            {signedUrl ? (
                                                <Download className="h-4 w-4 text-[#006070]" />
                                            ) : (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            )}
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
