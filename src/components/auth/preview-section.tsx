"use client";

import React from "react";
import {
    LayoutDashboard,
    FileText,
    Calendar,
    Gavel,
    Activity,
    Settings,
    HelpCircle,
    ChevronDown,
    Search,
    Bell,
    User
} from "lucide-react";

export function PreviewSection() {
    return (
        <div className="relative w-full aspect-video lg:aspect-16/10g-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)] overflow-hidden border border-slate-200 flex transition-transform duration-700 hover:scale-[1.01]">

            {/* --- SIDEBAR --- */}
            <aside className="w-64 bg-[#f8fcfd] border-r border-slate-100 flex flex-col p-5 shrink-0">
                {/* Logo Section */}
                <div className="flex items-start gap-3 mb-10 px-2 pt-1">
                    <div className="w-9 h-9 bg-[#006070] rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-lg shadow-teal-900/10">
                        PLN
                    </div>
                    <div>
                        <div className="text-[12px] font-bold text-[#004d5a] leading-tight tracking-tight">Board Meeting</div>
                        <div className="text-[10px] text-slate-400 font-medium tracking-wide">PT PLN (PERSERO)</div>
                    </div>
                </div>

                {/* Menu Items (Masking diterapkan otomatis di komponen MenuItem bawah) */}
                <div className="space-y-1 grow">
                    <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menu Utama</div>
                    <MenuItem icon={<LayoutDashboard size={18} />} label="Dashboard" active />
                    <MenuItem icon={<FileText size={18} />} label="Usulan Agenda" hasChild />
                    <MenuItem icon={<Calendar size={18} />} label="Jadwal Rapat" />
                    <MenuItem icon={<Gavel size={18} />} label="Pelaksanaan" hasChild />
                    <MenuItem icon={<Activity size={18} />} label="Monitoring" />
                </div>

                {/* Bottom Menu */}
                <div className="space-y-1 mt-auto pt-6 border-t border-slate-100">
                    <MenuItem icon={<Settings size={18} />} label="Pengaturan" />
                    <MenuItem icon={<HelpCircle size={18} />} label="Bantuan" />
                </div>
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <main className="grow flex flex-col bg-white relative overflow-hidden">
                {/* Decorative background blob */}
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#f0f9fa] rounded-full blur-3xl pointer-events-none"></div>

                {/* Top Header */}
                <header className="h-20 px-8 flex items-center justify-between border-b border-slate-50 relative z-10">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold text-slate-800">Ringkasan</h1>
                        <p className="text-xs text-slate-400">Selamat datang kembali, Admin</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                            <Search size={16} />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 relative">
                            <Bell size={16} />
                            <div className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></div>
                        </div>
                        <div className="pl-4 border-l border-slate-100 flex items-center gap-3">
                            <div className="text-right hidden xl:block">
                                <div className="text-xs font-bold text-slate-700">Hadi Nurhakim</div>
                                <div className="text-[10px] text-slate-400">Administrator</div>
                            </div>
                            <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200">
                                <User size={16} />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Body */}
                <div className="p-8 flex flex-col gap-6 grow relative z-10">
                    {/* Top Row Grid (Cards) */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="h-32 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-5 flex flex-col justify-between group hover:border-[#006070]/20 transition-colors">
                            <div className="w-10 h-10 rounded-2xl bg-[#e0f2f4] flex items-center justify-center text-[#006070]">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-800">12</div>
                                <div className="text-xs text-slate-400 font-medium mt-1">Rapat Bulan Ini</div>
                            </div>
                        </div>
                        <div className="h-32 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-5 flex flex-col justify-between group hover:border-[#006070]/20 transition-colors">
                            <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                                <FileText size={20} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-800">28</div>
                                <div className="text-xs text-slate-400 font-medium mt-1">Dokumen Baru</div>
                            </div>
                        </div>
                        <div className="h-32 bg-[#006070] rounded-[1.5rem] shadow-lg shadow-teal-900/20 p-5 flex flex-col justify-between text-white relative overflow-hidden">
                            <div className="absolute -right-2.5 -top-2.5 opacity-10 transform rotate-12">
                                <Activity size={100} />
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <Activity size={20} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-2xl font-bold">98%</div>
                                <div className="text-xs text-teal-100 font-medium mt-1">Sistem Optimal</div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Content Area (Placeholder Chart/Table) */}
                    <div className="grow bg-slate-50/50 rounded-[2rem] border border-slate-100/50 flex flex-col p-6 gap-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="h-4 w-32 bg-slate-200 rounded-full opacity-50"></div>
                            <div className="h-8 w-24 bg-white border border-slate-200 rounded-lg"></div>
                        </div>
                        <div className="space-y-3">
                            <SkeletonRow width="100%" />
                            <SkeletonRow width="95%" />
                            <SkeletonRow width="98%" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// --- SUB COMPONENTS ---

function MenuItem({ icon, label, active, hasChild }: { icon: React.ReactNode; label: string; active?: boolean; hasChild?: boolean }) {
    // LOGIC MASKING: Tampilkan 4 huruf awal, sisanya bintang
    const maskedLabel = `${label.slice(0, 4)}****`;

    return (
        <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group ${active ? 'bg-white text-[#006070] shadow-sm font-semibold' : 'text-slate-500 hover:bg-white hover:text-[#006070] hover:shadow-sm'}`}>
            <div className="flex items-center gap-3">
                <span className={active ? 'text-[#006070]' : 'text-slate-400 group-hover:text-[#006070]'}>{icon}</span>
                {/* Teks Label yang sudah dimasking */}
                <span className="text-[13px] tracking-wide">{maskedLabel}</span>
            </div>
            {hasChild && <ChevronDown size={14} className="opacity-40" />}
        </div>
    );
}

function SkeletonRow({ width }: { width: string }) {
    return (
        <div className="h-14 w-full bg-white rounded-xl border border-slate-100 shadow-sm flex items-center px-4 gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-100"></div>
            <div className="h-3 bg-slate-100 rounded-full grow opacity-60" style={{ maxWidth: width }}></div>
            <div className="w-16 h-3 bg-slate-50 rounded-full ml-auto"></div>
        </div>
    );
}