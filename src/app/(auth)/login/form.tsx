"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2 } from "lucide-react"; // Import Icon dari referensi
import { loginSchema, type LoginInput } from "@/schemas/auth/login";
import { loginAction } from "@/actions/auth/login";
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

export default function LoginForm() {
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const form = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: LoginInput) {
        startTransition(async () => {
            const result = await loginAction(values);

            if (result.status === "SUCCESS") {
                showNotify("Login berhasil. Mengalihkan...", "success");
                router.refresh();
                router.push("/dashboard");
            } else {
                if (result.status === "VALIDATION_ERROR" && result.errors) {
                    showNotify("Data input tidak valid.", "error");
                } else {
                    showNotify(result.message || "Gagal masuk.", "error");
                }
            }
        });
    }

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

                    {/* --- EMAIL FIELD (Style Referensi) --- */}
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

                    {/* --- PASSWORD FIELD (Style Referensi) --- */}
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

                    {/* --- SUBMIT BUTTON (Style Referensi) --- */}
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