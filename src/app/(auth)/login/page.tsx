import { Metadata } from "next";
import LoginForm from "./form";
import { PreviewSection } from "@/components/auth/preview-section"; // IMPORT KOMPONEN BARU
import Image from "next/image";

export const metadata: Metadata = {
    title: "Login - Board Meeting PLN",
    description: "Portal Rapat Direksi PT PLN (Persero)",
};

export default function LoginPage() {
    return (
        <div className="min-h-screen w-full flex flex-col relative overflow-hidden bg-white">
            <BackgroundDecorations />

            <main className="grow flex z-10">
                <div className="w-full grid grid-cols-1 lg:grid-cols-[70%_30%] min-h-screen">

                    {/* --- KIRI: PREVIEW SECTION (Updated) --- */}
                    <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-[#f0f7f8] relative overflow-hidden border-r border-slate-100">
                        <div className="absolute inset-0 animate-moving-lines pointer-events-none opacity-50"></div>

                        {/* Component baru PreviewSection */}
                        <div className="relative z-10 w-full max-w-6xl transform scale-[0.85] xl:scale-95 hover:scale-[0.86] xl:hover:scale-[0.96] transition-transform duration-700 origin-center">
                            <PreviewSection />
                        </div>

                        <div className="absolute bottom-10 left-12">
                            <div className="flex items-center gap-3 opacity-60">
                                <Image src="/Logo_PLN.svg" alt="PLN" width={24} height={24} className="grayscale" />
                                <span className="text-[#006070] font-bold text-sm tracking-widest uppercase">
                                    PLN Board Management System v2.0
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* --- KANAN: LOGIN FORM (Sama seperti sebelumnya) --- */}
                    <div className="flex flex-col justify-center items-center p-6 md:p-12 bg-white relative shadow-2xl shadow-slate-200/50 z-20">
                        <div className="w-full max-w-sm">
                            <div className="mb-10 flex justify-center lg:justify-start animate-in fade-in slide-in-from-top-4 duration-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#006070] rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-900/20">
                                        <Image src="/Logo_PLN.svg" alt="PLN" width={24} height={24} className="brightness-0 invert" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-[#006070] leading-none">Portal Rapat</h2>
                                        <p className="text-[10px] text-slate-400 font-medium tracking-wide">PT PLN (PERSERO)</p>
                                    </div>
                                </div>
                            </div>

                            <LoginForm />

                            <div className="mt-12 text-center lg:text-left">
                                <p className="text-slate-400 text-[10px] font-medium tracking-wide">
                                    &copy; {new Date().getFullYear()} PT PLN (Persero). All rights reserved.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}

// BackgroundDecorations (Tetap sama)
function BackgroundDecorations() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.05)_0%,transparent_70%)]"></div>
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-teal-500/5 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse delay-700"></div>
        </div>
    );
}