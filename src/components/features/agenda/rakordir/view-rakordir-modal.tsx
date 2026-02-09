"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Calendar, User, Building2, FileText, Phone, Briefcase, ShieldCheck, Paperclip, Download, Loader2, Copy, ChevronDown, ChevronUp, AlertCircle, Clock, CheckCircle2, ArrowUpCircle, MinusCircle, Check, Share2, type LucideIcon } from "lucide-react"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import { getRakordirById } from "@/server/actions/rakordir-actions"

interface ViewRakordirModalProps {
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

const getStatusStyle = (status: string | null) => {
    switch (status) {
        case "Selesai": return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "Dijadwalkan": return "bg-blue-50 text-blue-700 border-blue-200";
        case "Dapat Dilanjutkan": return "bg-indigo-50 text-indigo-700 border-indigo-200";
        case "Ditunda": return "bg-orange-50 text-orange-700 border-orange-200";
        case "Dibatalkan": return "bg-red-50 text-red-700 border-red-200";
        default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
};

export function ViewRakordirModal({ open, onOpenChange, agendaId }: ViewRakordirModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any>(null)
    const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
    const [isHeaderMinimized, setIsHeaderMinimized] = useState(false)
    const [hasCopied, setHasCopied] = useState(false)

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
                    const res = await getRakordirById(agendaId)
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

                // ✅ Hanya file RAKORDIR
                const fileFields = ["proposalNote", "presentationMaterial"];
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
            const match = part.trim().match(/\(([^)]+)\)$/);
            return match?.[1]?.trim() ?? part.trim();
        }).join(", ");
    };

    const handleCopyInvitation = async () => {
        if (!data) return;
        const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const dateString = data.executionDate ? new Date(data.executionDate).toLocaleDateString('id-ID', dateOptions) : "Belum di input";
        // Format waktu agar hanya menampilkan HH:mm
        const formatTime = (t: string) => {
            if (!t) return "";
            // Jika tidak ada ':', kembalikan aslinya (misal "Selesai")
            if (!t.includes(':')) return t;
            return t.split(':').slice(0, 2).join(':');
        };
        const timeString = (data.startTime && data.endTime) ? `${formatTime(data.startTime)} - ${formatTime(data.endTime)} WIB` : "Belum di input";
        const locationString = data.meetingLocation || "Belum di input";
        const cleanDirektur = getAbbreviation(data?.director);
        const cleanPemrakarsa = getAbbreviation(data?.initiator);
        const cleanSupport = getAbbreviation(data?.support || "-");

        const text = `*UNDANGAN RAPAT KOORDINASI DIREKSI (RAKORDIR)*

Ykh. Bapak/Ibu 
• BoD Holding
• KSPI
• SEVP HKK
• KSDTI
• Senior Leaders

Dengan ini dimohon untuk berkenan hadir dalam *Rapat Koordinasi Direksi* yang akan dilaksanakan secara tatap muka pada :

🗓  Hari, tanggal: ${dateString}
⏰️  Pukul: ${timeString}
📍  Ruang: ${locationString}

AGENDA

*RAKORDIR*

1. *${data?.title}*

Direktur Pemrakarsa: ${cleanDirektur}

Pemrakarsa: ${cleanPemrakarsa}

Support: ${cleanSupport}

Terimakasih dan salam hormat, 🙏🏼🙏🏼
_SEKPER PLN_`;

        await navigator.clipboard.writeText(text);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    }

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
    const displaySupport = getAbbreviation(data?.support);

    const getFilePath = (key: string) => data?.filePaths?.[key] || data?.[key] || null;

    const getFileCount = () => {
        if (!data) return 0;
        let count = 0;
        ["proposalNote", "presentationMaterial"].forEach(f => { if (getFilePath(f)) count++; });
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
                <SheetHeader className="sr-only"><SheetTitle>Detail Agenda RAKORDIR</SheetTitle></SheetHeader>
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
                                <Badge variant="outline" className={cn("flex items-center gap-1.5 px-3 py-1 border", getStatusStyle(data.status))}>
                                    {data.status === "Draft" ? <Clock className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                    <span className="font-semibold">{data.status || "Submitted"}</span>
                                </Badge>
                                <Button size="icon" variant="ghost" className={cn("h-8 w-8 transition-all rounded-full", hasCopied ? "text-emerald-600 bg-emerald-50" : "text-slate-400 hover:bg-[#e7f6f9]")} onClick={handleCopyInvitation} title="Salin Undangan Rapat">
                                    {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
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
                                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: COLORS.primary }} />
                                            <div className="flex items-center gap-2 mb-3"><Briefcase className="h-4 w-4" style={{ color: COLORS.primary }} /><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">URGENSI</span></div>
                                            <div className="p-3 rounded-lg border" style={{ backgroundColor: `${COLORS.light}50`, borderColor: `${COLORS.primary}10` }}><p className="text-sm font-semibold leading-relaxed" style={{ color: COLORS.primary }}>{data.urgency || "Tidak ada keterangan urgensi."}</p></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                <div className="flex items-center gap-2 mb-2"><Calendar className="h-4 w-4" style={{ color: COLORS.primary }} /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DEADLINE</span></div>
                                                <p className="text-base font-bold text-slate-800">{data.deadlineDate ? new Date(data.deadlineDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}</p>
                                                {data.executionDate && (
                                                    <div className="mt-2 pt-2 border-t border-slate-100">
                                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">DIJADWALKAN PADA</span>
                                                        <p className="text-sm font-semibold text-slate-700">{new Date(data.executionDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                <div className="flex items-center gap-2 mb-2"><AlertCircle className="h-4 w-4" style={{ color: COLORS.primary }} /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PRIORITAS</span></div>
                                                {(() => {
                                                    const today = new Date();
                                                    const deadline = data.deadlineDate ? new Date(data.deadlineDate) : null;
                                                    let p = "Low";
                                                    if (deadline) {
                                                        const diff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 3600 * 24));
                                                        if (diff < 0) p = "-";
                                                        else if (diff <= 7) p = "High"; else if (diff <= 14) p = "Medium";
                                                    }
                                                    if (p === '-') return <Badge variant="outline" className="bg-slate-100 text-slate-400 border-slate-200 flex gap-1 w-fit"><MinusCircle className="h-3 w-3" /> -</Badge>
                                                    if (p === 'High') return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 flex gap-1 w-fit"><ArrowUpCircle className="h-3 w-3" /> High</Badge>
                                                    if (p === 'Medium') return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200 flex gap-1 w-fit"><MinusCircle className="h-3 w-3" /> Medium</Badge>
                                                    return <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 flex gap-1 w-fit">Low</Badge>
                                                })()}
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div className="bg-slate-50/50 px-5 py-3 border-b border-slate-100 flex items-center gap-2"><Building2 className="h-4 w-4" style={{ color: COLORS.primary }} /><h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.primary }}>INFORMASI PEMRAKARSA</h3></div>
                                            <div className="p-5 space-y-6">
                                                <div className="flex gap-4 group"><div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border group-hover:scale-105 transition-transform" style={{ backgroundColor: COLORS.light, color: COLORS.primary, borderColor: `${COLORS.primary}10` }}><User className="h-5 w-5" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">DIREKTUR</label><p className="text-sm font-semibold text-slate-800 leading-snug">{displayDirektur}</p></div></div>
                                                <div className="flex gap-4 group"><div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border group-hover:scale-105 transition-transform" style={{ backgroundColor: COLORS.light, color: COLORS.primary, borderColor: `${COLORS.primary}10` }}><Building2 className="h-5 w-5" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">UNIT PEMRAKARSA</label><p className="text-sm font-semibold text-slate-800 leading-snug">{displayPemrakarsa}</p></div></div>
                                                <div className="flex gap-4 group"><div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border group-hover:scale-105 transition-transform" style={{ backgroundColor: COLORS.light, color: COLORS.primary, borderColor: `${COLORS.primary}10` }}><Share2 className="h-5 w-5" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">UNIT SUPPORT</label><p className="text-sm font-medium text-slate-600 leading-snug">{displaySupport}</p></div></div>
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

                                        {/* CATATAN */}
                                        {data.notes && (
                                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                                <div className="bg-slate-50/50 px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                                                    <FileText className="h-4 w-4" style={{ color: COLORS.primary }} />
                                                    <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.primary }}>CATATAN</h3>
                                                </div>
                                                <div className="p-5">
                                                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{data.notes}</p>
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="files" className="mt-0 space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">DOKUMEN UTAMA</h4>
                                            <div className="grid gap-3">
                                                <FileCard title="ND Usulan Agenda" url={getFilePath('proposalNote')} signed={signedUrls[getFilePath('proposalNote')!]} fileNameFunc={getFileName} />
                                                <FileCard title="Materi Presentasi" url={getFilePath('presentationMaterial')} signed={signedUrls[getFilePath('presentationMaterial')!]} icon={FileText} highlight fileNameFunc={getFileName} />
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

function FileCard({ title, url, signed, icon: Icon = ShieldCheck, highlight, fileNameFunc }: { title: string, url?: string | null, signed?: string, icon?: LucideIcon, highlight?: boolean, fileNameFunc: (p: string) => string }) {
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
