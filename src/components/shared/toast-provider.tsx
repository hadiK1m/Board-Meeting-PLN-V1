"use client";

import Image from "next/image";
import { Toaster as SonnerToaster, toast } from "sonner";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CUSTOM TOAST PROVIDER - PT PLN (Persero)
 * Fitur: Warna adaptif, Logo-centric, Glassmorphism.
 */
export function ToastProvider() {
    return (
        <SonnerToaster
            position="bottom-right"
            toastOptions={{
                unstyled: true,
                classNames: {
                    toast: "w-full max-w-[380px] overflow-hidden",
                },
            }}
        />
    );
}

export const showNotify = (
    message: string,
    type: "success" | "error" | "info" = "info"
) => {
    toast.custom((t) => (
        <div
            className={cn(
                "flex items-center justify-between w-full p-4 rounded-xl border shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-right-5",
                // Kontrol warna berdasarkan tipe
                type === "success" && "bg-emerald-50/95 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
                type === "error" && "bg-red-50/95 border-red-200 dark:bg-red-950/30 dark:border-red-800",
                type === "info" && "bg-blue-50/95 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
            )}
        >
            <div className="flex items-center gap-4">
                {/* LOGO SECTION - Dibuat sangat menonjol */}
                <div className="relative shrink-0">
                    <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg border border-border shadow-sm overflow-hidden p-1.5">
                        <Image
                            src="/Logo_PLN.svg"
                            alt="PLN"
                            width={32}
                            height={32}
                            className="object-contain"
                        />
                    </div>
                    {/* Status Dot Mini */}
                    <div className={cn(
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-white",
                        type === "success" && "bg-emerald-500",
                        type === "error" && "bg-red-500",
                        type === "info" && "bg-blue-500"
                    )}>
                        {type === "success" && <CheckCircle2 size={10} />}
                        {type === "error" && <AlertCircle size={10} />}
                        {type === "info" && <Info size={10} />}
                    </div>
                </div>

                {/* CONTENT SECTION */}
                <div className="flex flex-col gap-0.5">
                    <p className={cn(
                        "text-sm font-bold tracking-tight",
                        type === "success" && "text-emerald-700 dark:text-emerald-400",
                        type === "error" && "text-red-700 dark:text-red-400",
                        type === "info" && "text-blue-700 dark:text-blue-400"
                    )}>
                        {type === "success" ? "Operasi Berhasil" : type === "error" ? "Terjadi Gagal" : "Informasi"}
                    </p>
                    <p className="text-[13px] leading-snug text-slate-600 dark:text-slate-300 font-medium">
                        {message}
                    </p>
                </div>
            </div>

            {/* CLOSE BUTTON */}
            <button
                onClick={() => toast.dismiss(t)}
                className="ml-4 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    ), {
        duration: 4000,
    });
};