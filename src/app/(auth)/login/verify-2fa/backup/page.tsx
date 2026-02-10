"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Key, Loader2, ArrowLeft, AlertTriangle, Clock, ShieldAlert } from "lucide-react";
import {
    completeLoginWith2FA,
    get2FAPendingSession,
    cancel2FASession
} from "@/actions/auth/login";
import { showNotify } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function BackupCodePage() {
    const [isPending, startTransition] = useTransition();
    const [backupCode, setBackupCode] = useState("");
    const [email, setEmail] = useState<string>("");
    const [timeRemaining, setTimeRemaining] = useState<number>(300);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionValid, setSessionValid] = useState(false);
    const router = useRouter();

    // Check for valid 2FA session
    useEffect(() => {
        let cancelled = false;

        async function checkSession() {
            const session = await get2FAPendingSession();

            if (cancelled) return;

            if (!session.exists) {
                showNotify("Sesi 2FA tidak ditemukan atau telah kedaluwarsa.", "error");
                router.push("/login");
                return;
            }

            setEmail(session.email || "");
            setSessionValid(true);

            if (session.expiresAt) {
                const remaining = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
                setTimeRemaining(remaining);
            }

            setIsLoading(false);
        }

        checkSession();

        return () => {
            cancelled = true;
        };
    }, [router]);

    // Countdown timer
    useEffect(() => {
        if (!sessionValid || timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    showNotify("Sesi 2FA telah kedaluwarsa.", "error");
                    router.push("/login");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [sessionValid, timeRemaining, router]);

    // Format time remaining
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // Format backup code input (add dash after 4 characters)
    const handleBackupCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");

        // Limit to 8 characters (without dash)
        if (value.length > 8) {
            value = value.slice(0, 8);
        }

        // Add dash after 4 characters
        if (value.length > 4) {
            value = value.slice(0, 4) + "-" + value.slice(4);
        }

        setBackupCode(value);
    };

    // Submit verification
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Remove dash for verification
        const cleanCode = backupCode.replace("-", "");

        if (cleanCode.length !== 8) {
            showNotify("Masukkan kode cadangan yang valid (8 karakter).", "error");
            return;
        }

        startTransition(async () => {
            const result = await completeLoginWith2FA(cleanCode);

            if (result.status === "SUCCESS") {
                showNotify("Verifikasi berhasil. Mengalihkan...", "success");
                router.refresh();
                router.push("/dashboard");
            } else {
                showNotify(result.message || "Kode cadangan tidak valid.", "error");
                setBackupCode("");
            }
        });
    };

    // Handle cancel
    const handleCancel = async () => {
        await cancel2FASession();
        router.push("/login");
    };

    if (isLoading) {
        return (
            <div className="w-full flex items-center justify-center min-h-100">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-[#006070]" size={40} />
                    <p className="text-slate-500 text-sm">Memvalidasi sesi...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Back button */}
            <Link
                href="/login/verify-2fa"
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-8 group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Kembali ke Verifikasi OTP</span>
            </Link>

            {/* Header */}
            <div className="mb-8 space-y-3">
                <div className="w-14 h-14 bg-linear-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-900/20 mb-4">
                    <Key className="text-white" size={28} />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Kode Cadangan
                </h1>
                <p className="text-slate-500 text-sm leading-relaxed">
                    Masukkan salah satu kode cadangan yang Anda simpan saat mengaktifkan 2FA
                </p>
                {email && (
                    <p className="text-xs text-slate-400">
                        untuk akun <span className="font-medium text-slate-600">{email}</span>
                    </p>
                )}
            </div>

            {/* Warning Alert */}
            <Alert className="mb-6 border-amber-200 bg-linear-to-r from-amber-50 to-orange-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 font-semibold">Perhatian</AlertTitle>
                <AlertDescription className="text-amber-700 text-sm">
                    Setiap kode cadangan hanya dapat digunakan satu kali. Setelah digunakan, kode tersebut tidak akan berfungsi lagi.
                </AlertDescription>
            </Alert>

            {/* Timer Card */}
            <Card className="mb-6 border-slate-200 bg-slate-50/50">
                <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-600">
                            <Clock size={16} />
                            <span className="text-sm font-medium">Sesi berakhir dalam</span>
                        </div>
                        <span className={`text-lg font-bold tabular-nums ${timeRemaining <= 60 ? "text-red-600 animate-pulse" : "text-slate-700"}`}>
                            {formatTime(timeRemaining)}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Backup Code Input Card */}
            <Card className="mb-6 border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-slate-700">Kode Cadangan</CardTitle>
                    <CardDescription>
                        Masukkan kode 8 karakter dalam format XXXX-XXXX
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <Key size={18} />
                            </div>
                            <Input
                                type="text"
                                value={backupCode}
                                onChange={handleBackupCodeChange}
                                disabled={isPending}
                                placeholder="XXXX-XXXX"
                                autoComplete="off"
                                autoFocus
                                className="pl-12 py-6 text-center text-xl font-mono font-bold tracking-[0.3em] bg-slate-50 border-slate-200 rounded-2xl placeholder:text-slate-400 placeholder:tracking-[0.3em] focus:ring-4 focus:ring-teal-500/10 focus:border-[#006070] uppercase"
                            />
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isPending || backupCode.replace("-", "").length !== 8}
                            className="w-full flex items-center justify-center gap-3 bg-[#006070] hover:bg-[#004d5a] text-white font-bold py-6 rounded-2xl shadow-xl shadow-teal-900/10 active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
                        >
                            {isPending ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <Key size={20} />
                            )}
                            {isPending ? "Memverifikasi..." : "Gunakan Kode Cadangan"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="border-slate-200 bg-slate-50/50">
                <CardContent className="py-4 px-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <ShieldAlert size={16} className="text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-700">Kehilangan semua akses?</p>
                                <p className="text-xs text-slate-500">Hubungi administrator untuk bantuan</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                            className="text-slate-600 border-slate-300 hover:bg-slate-100"
                        >
                            Hubungi Admin
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
