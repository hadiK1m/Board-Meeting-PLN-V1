"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, ArrowLeft, Clock, KeyRound } from "lucide-react";
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
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from "@/components/ui/input-otp";
import Link from "next/link";

export default function Verify2FAPage() {
    const [isPending, startTransition] = useTransition();
    const [code, setCode] = useState("");
    const [email, setEmail] = useState<string>("");
    const [timeRemaining, setTimeRemaining] = useState<number>(300); // 5 minutes
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

    // Submit verification
    const handleSubmit = (codeString?: string) => {
        const finalCode = codeString || code;

        if (finalCode.length !== 6) {
            showNotify("Masukkan 6 digit kode verifikasi.", "error");
            return;
        }

        startTransition(async () => {
            const result = await completeLoginWith2FA(finalCode);

            if (result.status === "SUCCESS") {
                showNotify("Verifikasi berhasil. Mengalihkan...", "success");
                router.refresh();
                router.push("/dashboard");
            } else {
                showNotify(result.message || "Verifikasi gagal.", "error");
                // Clear code on error
                setCode("");
            }
        });
    };

    // Handle OTP change with auto-submit
    const handleOTPChange = (value: string) => {
        setCode(value);
        if (value.length === 6) {
            handleSubmit(value);
        }
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
            <button
                onClick={handleCancel}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-8 group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Kembali ke Login</span>
            </button>

            {/* Header */}
            <div className="mb-8 space-y-3">
                <div className="w-14 h-14 bg-linear-to-br from-teal-500 to-[#006070] rounded-2xl flex items-center justify-center shadow-lg shadow-teal-900/20 mb-4">
                    <ShieldCheck className="text-white" size={28} />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Verifikasi 2FA
                </h1>
                <p className="text-slate-500 text-sm leading-relaxed">
                    Masukkan kode 6 digit dari aplikasi autentikator Anda
                </p>
                {email && (
                    <p className="text-xs text-slate-400">
                        untuk akun <span className="font-medium text-slate-600">{email}</span>
                    </p>
                )}
            </div>

            {/* Timer Card */}
            <Card className="mb-6 border-amber-200 bg-linear-to-r from-amber-50 to-orange-50">
                <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-700">
                            <Clock size={16} />
                            <span className="text-sm font-medium">Sesi berakhir dalam</span>
                        </div>
                        <span className={`text-lg font-bold tabular-nums ${timeRemaining <= 60 ? "text-red-600 animate-pulse" : "text-amber-700"}`}>
                            {formatTime(timeRemaining)}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* OTP Input Card */}
            <Card className="mb-6 border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-slate-700">Kode Verifikasi</CardTitle>
                    <CardDescription>
                        Buka aplikasi Google Authenticator dan masukkan kode yang ditampilkan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center mb-6">
                        <InputOTP
                            maxLength={6}
                            value={code}
                            onChange={handleOTPChange}
                            disabled={isPending}
                            autoFocus
                        >
                            <InputOTPGroup>
                                <InputOTPSlot index={0} className="w-12 h-14 text-xl font-bold" />
                                <InputOTPSlot index={1} className="w-12 h-14 text-xl font-bold" />
                                <InputOTPSlot index={2} className="w-12 h-14 text-xl font-bold" />
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                                <InputOTPSlot index={3} className="w-12 h-14 text-xl font-bold" />
                                <InputOTPSlot index={4} className="w-12 h-14 text-xl font-bold" />
                                <InputOTPSlot index={5} className="w-12 h-14 text-xl font-bold" />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="button"
                        onClick={() => handleSubmit()}
                        disabled={isPending || code.length !== 6}
                        className="w-full flex items-center justify-center gap-3 bg-[#006070] hover:bg-[#004d5a] text-white font-bold py-6 rounded-2xl shadow-xl shadow-teal-900/10 active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
                    >
                        {isPending ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <ShieldCheck size={20} />
                        )}
                        {isPending ? "Memverifikasi..." : "Verifikasi"}
                    </Button>
                </CardContent>
            </Card>

            {/* Backup Code Link */}
            <Card className="border-slate-200 bg-slate-50/50">
                <CardContent className="py-4 px-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-200 rounded-lg">
                                <KeyRound size={16} className="text-slate-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-700">Tidak bisa akses aplikasi?</p>
                                <p className="text-xs text-slate-500">Gunakan kode cadangan sebagai alternatif</p>
                            </div>
                        </div>
                        <Link href="/login/verify-2fa/backup">
                            <Button variant="outline" size="sm" className="text-[#006070] border-[#006070]/30 hover:bg-[#006070]/5">
                                Kode Cadangan
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
