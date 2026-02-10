"use client";

import { useTransition, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    LogIn,
    Loader2,
    ShieldCheck,
    ArrowLeft,
    Clock,
    KeyRound
} from "lucide-react";
import { loginSchema, type LoginInput } from "@/schemas/auth/login";
import { loginAction, completeLoginWith2FA, cancel2FASession } from "@/actions/auth/login";
import { showNotify } from "@/components/shared/toast-provider";
import Link from "next/link";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from "@/components/ui/input-otp";

type LoginStep = "credentials" | "2fa" | "backup";

export default function LoginForm() {
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState<LoginStep>("credentials");
    const [otpCode, setOtpCode] = useState("");
    const [backupCode, setBackupCode] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [timeRemaining, setTimeRemaining] = useState<number>(300); // 5 minutes
    const router = useRouter();

    const form = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    // Cancel 2FA and go back to login
    const resetTo2FAStep = () => {
        cancel2FASession();
        setStep("credentials");
        setOtpCode("");
        setBackupCode("");
        setUserEmail("");
        setTimeRemaining(300);
    };

    // Countdown timer for 2FA session
    useEffect(() => {
        if (step !== "2fa" && step !== "backup") return;
        if (timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    showNotify("Sesi 2FA telah kedaluwarsa. Silakan login ulang.", "error");
                    resetTo2FAStep();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [step, timeRemaining]);

    // Format time remaining
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    async function onSubmit(values: LoginInput) {
        startTransition(async () => {
            const result = await loginAction(values);

            if (result.status === "SUCCESS") {
                // Check if 2FA is required
                if (result.data?.requires2FA) {
                    setUserEmail(values.email);
                    setTimeRemaining(300); // Reset timer to 5 minutes
                    setStep("2fa");
                    showNotify("Verifikasi 2FA diperlukan.", "info");
                } else {
                    showNotify("Login berhasil. Mengalihkan...", "success");
                    router.refresh();
                    router.push("/dashboard");
                }
            } else {
                if (result.status === "VALIDATION_ERROR" && result.errors) {
                    showNotify("Data input tidak valid.", "error");
                } else {
                    showNotify(result.message || "Gagal masuk.", "error");
                }
            }
        });
    }

    // Handle OTP change with auto-submit
    const handleOTPChange = (value: string) => {
        setOtpCode(value);
        if (value.length === 6) {
            handleVerify2FA(value);
        }
    };

    // Verify 2FA code
    const handleVerify2FA = (code?: string) => {
        const finalCode = code || otpCode;

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
                showNotify(result.message || "Kode verifikasi salah.", "error");
                setOtpCode("");
            }
        });
    };

    // Format backup code input (add dash after 4 characters)
    const handleBackupCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");

        if (value.length > 8) {
            value = value.slice(0, 8);
        }

        if (value.length > 4) {
            value = value.slice(0, 4) + "-" + value.slice(4);
        }

        setBackupCode(value);
    };

    // Verify backup code
    const handleVerifyBackup = (e: React.FormEvent) => {
        e.preventDefault();
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

    // Render Login Form (Step 1)
    if (step === "credentials") {
        return (
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="mb-8 space-y-2">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Login Akun</h1>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Selamat datang! Silakan masuk untuk mengelola jadwal rapat dan agenda perusahaan.
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* --- EMAIL FIELD --- */}
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <label className="text-[13px] font-bold text-slate-600 uppercase tracking-wide ml-1">Email Kantor</label>
                                    <FormControl>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#006070] transition-colors">
                                                <Mail size={18} />
                                            </div>
                                            <input
                                                {...field}
                                                disabled={isPending}
                                                placeholder="user@pln.co.id"
                                                className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-teal-500/10 focus:border-[#006070] outline-none transition-all duration-300 disabled:opacity-50"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* --- PASSWORD FIELD --- */}
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-[13px] font-bold text-slate-600 uppercase tracking-wide">Kata Sandi</label>
                                        <Link
                                            href="#"
                                            className="text-[12px] font-semibold text-[#006070] hover:text-teal-700 transition-colors"
                                            tabIndex={-1}
                                        >
                                            Lupa Password?
                                        </Link>
                                    </div>
                                    <FormControl>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#006070] transition-colors">
                                                <Lock size={18} />
                                            </div>
                                            <input
                                                {...field}
                                                type={showPassword ? "text" : "password"}
                                                disabled={isPending}
                                                placeholder="••••••••"
                                                className="block w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-teal-500/10 focus:border-[#006070] outline-none transition-all duration-300 disabled:opacity-50"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                disabled={isPending}
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer focus:outline-none"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* --- SUBMIT BUTTON --- */}
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full flex items-center justify-center gap-3 bg-[#006070] hover:bg-[#004d5a] text-white font-bold py-6 rounded-2xl shadow-xl shadow-teal-900/10 active:scale-[0.98] transition-all duration-300 mt-4"
                        >
                            {isPending ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <LogIn size={20} />
                            )}
                            {isPending ? "Memproses..." : "Masuk Sekarang"}
                        </Button>

                    </form>
                </Form>
            </div>
        );
    }

    // Render 2FA OTP Form (Step 2)
    if (step === "2fa") {
        return (
            <div className="w-full animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Back button */}
                <button
                    onClick={resetTo2FAStep}
                    disabled={isPending}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-6 group disabled:opacity-50"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Kembali ke Login</span>
                </button>

                {/* Header */}
                <div className="mb-6 space-y-2">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-linear-to-br from-teal-500 to-[#006070] rounded-2xl flex items-center justify-center shadow-lg shadow-teal-900/20">
                            <ShieldCheck className="text-white" size={24} />
                        </div>
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        Verifikasi 2FA
                    </h1>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Masukkan kode 6 digit dari aplikasi autentikator
                    </p>
                    {userEmail && (
                        <p className="text-xs text-slate-400">
                            untuk <span className="font-medium text-slate-600">{userEmail}</span>
                        </p>
                    )}
                </div>

                {/* Timer */}
                <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl mb-6">
                    <div className="flex items-center gap-2 text-amber-700">
                        <Clock size={16} />
                        <span className="text-sm font-medium">Sesi berakhir dalam</span>
                    </div>
                    <span className={`text-base font-bold tabular-nums ${timeRemaining <= 60 ? "text-red-600 animate-pulse" : "text-amber-700"}`}>
                        {formatTime(timeRemaining)}
                    </span>
                </div>

                {/* OTP Input */}
                <div className="space-y-2 mb-6">
                    <label className="text-[13px] font-bold text-slate-600 uppercase tracking-wide ml-1">
                        Kode Verifikasi
                    </label>
                    <div className="flex justify-center py-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        <InputOTP
                            maxLength={6}
                            value={otpCode}
                            onChange={handleOTPChange}
                            disabled={isPending}
                            autoFocus
                        >
                            <InputOTPGroup>
                                <InputOTPSlot index={0} className="w-11 h-13 text-xl font-bold border-slate-300" />
                                <InputOTPSlot index={1} className="w-11 h-13 text-xl font-bold border-slate-300" />
                                <InputOTPSlot index={2} className="w-11 h-13 text-xl font-bold border-slate-300" />
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                                <InputOTPSlot index={3} className="w-11 h-13 text-xl font-bold border-slate-300" />
                                <InputOTPSlot index={4} className="w-11 h-13 text-xl font-bold border-slate-300" />
                                <InputOTPSlot index={5} className="w-11 h-13 text-xl font-bold border-slate-300" />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>
                </div>

                {/* Submit Button */}
                <Button
                    type="button"
                    onClick={() => handleVerify2FA()}
                    disabled={isPending || otpCode.length !== 6}
                    className="w-full flex items-center justify-center gap-3 bg-[#006070] hover:bg-[#004d5a] text-white font-bold py-6 rounded-2xl shadow-xl shadow-teal-900/10 active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
                >
                    {isPending ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <ShieldCheck size={20} />
                    )}
                    {isPending ? "Memverifikasi..." : "Verifikasi"}
                </Button>

                {/* Backup Code Link */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                    <button
                        onClick={() => setStep("backup")}
                        disabled={isPending}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group disabled:opacity-50"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-200 rounded-lg group-hover:bg-slate-300 transition-colors">
                                <KeyRound size={16} className="text-slate-600" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-medium text-slate-700">Tidak bisa akses aplikasi?</p>
                                <p className="text-xs text-slate-500">Gunakan kode cadangan</p>
                            </div>
                        </div>
                        <ArrowLeft size={16} className="text-slate-400 rotate-180" />
                    </button>
                </div>
            </div>
        );
    }

    // Render Backup Code Form (Step 3)
    if (step === "backup") {
        return (
            <div className="w-full animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Back button */}
                <button
                    onClick={() => setStep("2fa")}
                    disabled={isPending}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-6 group disabled:opacity-50"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Kembali ke OTP</span>
                </button>

                {/* Header */}
                <div className="mb-6 space-y-2">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-linear-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-900/20">
                            <KeyRound className="text-white" size={24} />
                        </div>
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        Kode Cadangan
                    </h1>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Masukkan salah satu kode cadangan 8 karakter
                    </p>
                </div>

                {/* Timer */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl mb-6">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Clock size={16} />
                        <span className="text-sm font-medium">Sesi berakhir dalam</span>
                    </div>
                    <span className={`text-base font-bold tabular-nums ${timeRemaining <= 60 ? "text-red-600 animate-pulse" : "text-slate-700"}`}>
                        {formatTime(timeRemaining)}
                    </span>
                </div>

                {/* Backup Code Input */}
                <form onSubmit={handleVerifyBackup} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-slate-600 uppercase tracking-wide ml-1">
                            Kode Cadangan
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#006070] transition-colors">
                                <KeyRound size={18} />
                            </div>
                            <input
                                type="text"
                                value={backupCode}
                                onChange={handleBackupCodeChange}
                                disabled={isPending}
                                placeholder="XXXX-XXXX"
                                autoComplete="off"
                                autoFocus
                                className="block w-full pl-12 pr-4 py-4 text-center text-xl font-mono font-bold tracking-[0.2em] bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder:text-slate-400 placeholder:tracking-[0.2em] focus:ring-4 focus:ring-teal-500/10 focus:border-[#006070] outline-none transition-all duration-300 disabled:opacity-50 uppercase"
                            />
                        </div>
                        <p className="text-xs text-slate-500 ml-1">
                            Setiap kode cadangan hanya dapat digunakan satu kali
                        </p>
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
                            <KeyRound size={20} />
                        )}
                        {isPending ? "Memverifikasi..." : "Gunakan Kode Cadangan"}
                    </Button>
                </form>

                {/* Help text */}
                <div className="mt-6 pt-6 border-t border-slate-200 text-center">
                    <p className="text-sm text-slate-500">
                        Kehilangan semua akses?{" "}
                        <button
                            onClick={resetTo2FAStep}
                            className="text-[#006070] hover:text-teal-700 font-medium transition-colors"
                        >
                            Hubungi Administrator
                        </button>
                    </p>
                </div>
            </div>
        );
    }

    return null;
}
