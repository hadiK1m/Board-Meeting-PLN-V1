"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Calendar, User, Building2, FileText, Phone, Briefcase, ShieldCheck, Paperclip, Download, Loader2, ChevronDown, ChevronUp, Clock, CheckCircle2, type LucideIcon } from "lucide-react"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import { getKepdirById } from "@/server/actions/kepdir-actions"

interface ViewKepdirModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    agendaId: string | null;
}

const COLORS = {
    primary: "#125d72",
    secondary: "#14a2ba",
    light: "#e7f6f9",
    textSecondary: "#64748b"
}

export function ViewKepdirModal({ open, onOpenChange, agendaId }: ViewKepdirModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any>(null)
    const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
    const [isHeaderMinimized, setIsHeaderMinimized] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        if (open && agendaId) {
            setData(null); setSignedUrls({}); setIsHeaderMinimized(false);
            const fetchData = async () => {
                setIsLoading(true)
                try {
                    const res = await getKepdirById(agendaId)
                    setData(res)
                } catch (error) {
                    console.error("Gagal mengambil data agenda:", error)
                } finally {
                    setIsLoading(false)
                }
            }
            fetchData()
        }
    }, [open, agendaId])

    useEffect(() => {
        if (open && data) {
            const fetchUrls = async () => {
                const urls: Record<string, string> = {}
                const sign = async (path: string | null) => {
                    if (!path) return
                    if (path.startsWith("http")) { urls[path] = path; return }
                    const { data: res } = await supabase.storage.from('Dokumen').createSignedUrl(path, 3600)
                    if (res?.signedUrl) urls[path] = res.signedUrl
                }

                const fileFields = ["kepdirFile", "grcFile"];
                await Promise.all(fileFields.map(key => {
                    const path = data.filePaths?.[key] || data[key];
                    return sign(path);
                }));

                let supporting: string[] = [];
                const rawSupporting = data.supportingFiles || data.supportingDocuments;
                if (typeof rawSupporting === 'string') {
                    try { supporting = JSON.parse(rawSupporting); } catch { /* ignore */ }
                } else if (Array.isArray(rawSupporting)) {
                    supporting = rawSupporting;
                }
                if (Array.isArray(supporting)) {
                    await Promise.all(supporting.map(p => sign(p)))
                }
                setSignedUrls(urls)
            }
            fetchUrls()
        }
    }, [open, data, supabase])

    const getAbbreviation = (text: string | null) => {
        if (!text) return "-";
        return text.split(",").map(part => {
            const match = part.match(/\(([^)]+)\)$/);
            return match?.[1]?.trim() ?? part.trim();
        }).join(", ");
    };

    const getFileName = (path: string) => {
        try {
            const filename = path.split('/').pop() || "Dokumen";
            let name = filename.replace(/^[a-z0-9]+-[a-f0-9-]{36}-/i, '');
            name = name.replace(/^[a-f0-9-]{36}-/i, '');
            return decodeURIComponent(name);
        } catch { return "Dokumen"; }
    };

    const displayDirektur = getAbbreviation(data?.director);
    const displayPemrakarsa = getAbbreviation(data?.initiator);

    const getFilePath = (key: string) => data?.filePaths?.[key] || data?.[key] || null;

    const getFileCount = () => {
        if (!data) return 0;
        let count = 0;
        ["kepdirFile", "grcFile"].forEach(f => { if (getFilePath(f)) count++; });
        let supporting: string[] = [];
        const rawSupporting = data.supportingFiles || data.supportingDocuments;
        if (typeof rawSupporting === 'string') {
            try { supporting = JSON.parse(rawSupporting); } catch { /* ignore */ }
        } else if (Array.isArray(rawSupporting)) {
            supporting = rawSupporting;
        }
        return count + supporting.length;
    };

    const totalFiles = getFileCount();
    const getSupportingFiles = (): string[] => {
        if (!data) return [];
        const rawSupporting = data.supportingFiles || data.supportingDocuments;
        if (typeof rawSupporting === 'string') {
            try { return JSON.parse(rawSupporting); } catch { return []; }
        } else if (Array.isArray(rawSupporting)) {
            return rawSupporting;
        }
        return [];
    }
    const supportingFilesList = getSupportingFiles();

    if (!open) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col h-full border-l shadow-2xl bg-white overflow-x-hidden">
                <SheetHeader className="sr-only"><SheetTitle>Detail Agenda Kepdir Sirkuler</SheetTitle></SheetHeader>
                {isLoading || !data ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-[#125d72]">
                        <Loader2 className="h-10 w-10 animate-spin" />
                        <p className="text-sm font-medium">Memuat data agenda...</p>
                    </div>
                ) : (
                    <>
                        <div className="shrink-0 border-b border-slate-100 bg-white/95 backdrop-blur-sm z-10 pt-6 px-6 pb-2 space-y-3">
                            <div className="flex justify-between text-xs">
                                <div className="flex gap-2 items-center px-2.5 py-1 rounded-md border" style={{ backgroundColor: COLORS.light, borderColor: `${COLORS.secondary}30` }}>
                                    <span style={{ color: COLORS.secondary }}>#</span>
                                    <span className="font-bold tracking-wider" style={{ color: COLORS.primary }}>{data.id.substring(0, 8)}</span>
                                </div>
                                <div className="flex gap-1.5 items-center text-slate-500 font-medium">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {data.createdAt ? new Date(data.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                                </div>
                            </div>
                            <div className="relative group">
                                <h2 className={cn("text-xl font-bold leading-relaxed wrap-break-word transition-all duration-300", isHeaderMinimized ? "line-clamp-2" : "")} style={{ color: COLORS.primary }}>{data.title}</h2>
                                <div className="flex justify-center mt-1">
                                    <Button variant="ghost" size="sm" className="h-5 w-auto rounded-full text-slate-300 hover:bg-slate-50" style={{ color: isHeaderMinimized ? undefined : COLORS.secondary }} onClick={() => setIsHeaderMinimized(!isHeaderMinimized)}>
                                        {isHeaderMinimized ? <ChevronDown className="h-4 w-4 animate-bounce" /> : <ChevronUp className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pb-2">
                                <Badge variant={data.status === "Draft" ? "outline" : "default"} className={cn("flex items-center gap-1.5 px-3 py-1", data.status === "Draft" ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-emerald-50 text-emerald-700 border-emerald-200")}>
                                    {data.status === "Draft" ? <Clock className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                    <span className="font-semibold">{data.status || "Submitted"}</span>
                                </Badge>
                            </div>
                        </div>

                        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
                            <TabsList className="shrink-0 w-full justify-start h-auto bg-white border-b border-slate-100 px-6 py-0">
                                <TabsTrigger value="overview" className="data-[state=active]:border-b-2 rounded-none px-0 py-3 mr-6 font-semibold text-slate-500 transition-colors bg-transparent" style={{ borderColor: "transparent" }}><span className="group-data-[state=active]:text-[#125d72]">Ringkasan</span></TabsTrigger>
                                <TabsTrigger value="files" className="data-[state=active]:border-b-2 rounded-none px-0 py-3 font-semibold text-slate-500 transition-colors bg-transparent flex items-center gap-2">Dokumen <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-slate-200">{totalFiles}</span></TabsTrigger>
                            </TabsList>

                            <ScrollArea className="flex-1 bg-slate-50/50 overflow-y-auto relative touch-pan-y">
                                <div className="p-6 space-y-6">
                                    <TabsContent value="overview" className="mt-0 space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">

                                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div className="bg-slate-50/50 px-5 py-3 border-b border-slate-100 flex items-center gap-2"><Building2 className="h-4 w-4" style={{ color: COLORS.primary }} /><h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.primary }}>INFORMASI PEMRAKARSA</h3></div>
                                            <div className="p-5 space-y-6">
                                                <div className="flex gap-4 group"><div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border group-hover:scale-105 transition-transform" style={{ backgroundColor: COLORS.light, color: COLORS.primary, borderColor: `${COLORS.primary}10` }}><User className="h-5 w-5" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">DIREKTUR</label><p className="text-sm font-semibold text-slate-800 leading-snug">{displayDirektur}</p></div></div>
                                                <div className="flex gap-4 group"><div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border group-hover:scale-105 transition-transform" style={{ backgroundColor: COLORS.light, color: COLORS.primary, borderColor: `${COLORS.primary}10` }}><Building2 className="h-5 w-5" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">UNIT PEMRAKARSA</label><p className="text-sm font-semibold text-slate-800 leading-snug">{displayPemrakarsa}</p></div></div>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div className="bg-slate-50/50 px-5 py-3 border-b border-slate-100 flex items-center gap-2"><User className="h-4 w-4" style={{ color: COLORS.primary }} /><h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.primary }}>NARAHUBUNG (PIC)</h3></div>
                                            <div className="p-5 flex items-start gap-5">
                                                <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0 border-2 border-white ring-1 ring-slate-100" style={{ background: `linear-gradient(to bottom right, ${COLORS.primary}, ${COLORS.secondary})` }}>{data.contactPerson?.charAt(0)?.toUpperCase() || "?"}</div>
                                                <div className="space-y-3 flex-1 min-w-0">
                                                    <div><p className="text-sm font-bold text-slate-800 truncate">{data.contactPerson || "-"}</p></div>
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-2 py-1.5 rounded border border-slate-100 w-fit"><Briefcase className="h-3 w-3 text-slate-400" /><span className="truncate max-w-50">{data.position || "-"}</span></div>
                                                        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-2 py-1.5 rounded border border-slate-100 w-fit"><Phone className="h-3 w-3 text-slate-400" /><span className="font-mono">{data.phone || "-"}</span></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="files" className="mt-0 space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">DOKUMEN UTAMA</h4>
                                            <div className="grid gap-3">
                                                <FileCard title="Dokumen Kepdir Sirkuler" url={getFilePath('kepdirFile')} signed={signedUrls[getFilePath('kepdirFile')!]} fileNameFunc={getFileName} />
                                                <FileCard title="Dokumen GRC" url={getFilePath('grcFile')} signed={signedUrls[getFilePath('grcFile')!]} icon={ShieldCheck} highlight fileNameFunc={getFileName} />
                                            </div>
                                        </div>
                                        {supportingFilesList.length > 0 && (
                                            <div className="space-y-3 pt-2">
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">LAMPIRAN PENDUKUNG</h4>
                                                <div className="grid gap-3">
                                                    {supportingFilesList.map((p: string, i: number) => (
                                                        <FileCard key={i} title={`Lampiran #${i + 1}`} url={p} signed={signedUrls[p]} icon={Paperclip} fileNameFunc={getFileName} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {totalFiles === 0 && (
                                            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400">
                                                <Paperclip className="h-8 w-8 mb-2 opacity-50" />
                                                <p className="text-sm font-medium">Tidak ada dokumen dilampirkan.</p>
                                            </div>
                                        )}
                                    </TabsContent>
                                </div>
                            </ScrollArea>
                        </Tabs>
                        <div className="p-5 bg-white border-t border-slate-100 shrink-0">
                            <Button variant="outline" className="w-full font-bold h-11 border-slate-200" style={{ color: COLORS.primary }} onClick={() => onOpenChange(false)}>Tutup Detail</Button>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}

function FileCard({ title, url, signed, icon: Icon = FileText, highlight, fileNameFunc }: { title: string, url?: string | null, signed?: string, icon?: LucideIcon, highlight?: boolean, fileNameFunc: (p: string) => string }) {
    if (!url) return null;
    return (
        <a href={signed || "#"} target={signed ? "_blank" : undefined} rel="noreferrer" onClick={(e) => { if (!signed) e.preventDefault(); }} className={cn("flex items-center gap-4 p-3.5 rounded-xl border bg-white hover:shadow-md transition-all duration-200 group relative overflow-hidden", highlight ? "" : "border-slate-200", !signed ? "cursor-wait opacity-70" : "cursor-pointer")} style={highlight ? { borderColor: `${COLORS.secondary}50`, backgroundColor: `${COLORS.light}30` } : {}}>
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors", highlight ? "group-hover:text-white" : "bg-slate-100 text-slate-500 group-hover:text-white")} style={highlight ? { backgroundColor: `${COLORS.secondary}20`, color: COLORS.secondary } : {}}><Icon className="h-5 w-5" /></div>
            <style jsx>{`a:hover div:first-child { background-color: ${highlight ? COLORS.secondary : COLORS.primary} !important; }`}</style>
            <div className="flex-1 min-w-0 space-y-0.5"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p><p className={cn("text-sm font-semibold truncate transition-colors", highlight ? "" : "text-slate-700")} style={{ color: highlight ? COLORS.primary : undefined }}>{fileNameFunc(url)}</p></div>
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-slate-300 transition-all group-hover:bg-[#e7f6f9]" style={{ color: undefined }}><Download className="h-4 w-4 group-hover:text-[#125d72]" /></div>
        </a>
    );
}
