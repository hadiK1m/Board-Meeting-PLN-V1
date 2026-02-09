/* eslint-disable react-hooks/incompatible-library */
// src/components/features/users/reset-password-dialog.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { showNotify } from "@/components/shared/toast-provider";
import { resetPasswordAction, type UserData } from "@/server/actions/user-actions";

const resetPasswordSchema = z
    .object({
        newPassword: z.string().min(6, "Password minimal 6 karakter"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Password tidak cocok",
        path: ["confirmPassword"],
    });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordDialogProps {
    user: UserData;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Generate random password
const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

export function ResetPasswordDialog({
    user,
    open,
    onOpenChange,
}: ResetPasswordDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            newPassword: "",
            confirmPassword: "",
        },
    });

    const newPassword = watch("newPassword");

    const onSubmit = async (data: ResetPasswordFormData) => {
        setIsSubmitting(true);

        const result = await resetPasswordAction(user.id, data.newPassword);

        if (result.success) {
            showNotify("Password berhasil direset", "success");
            reset();
            onOpenChange(false);
        } else {
            showNotify(result.error || "Gagal mereset password", "error");
        }

        setIsSubmitting(false);
    };

    const handleGeneratePassword = () => {
        const password = generatePassword();
        setValue("newPassword", password);
        setValue("confirmPassword", password);
    };

    const handleCopyPassword = async () => {
        if (newPassword) {
            await navigator.clipboard.writeText(newPassword);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            showNotify("Password disalin ke clipboard", "success");
        }
    };

    const handleClose = () => {
        reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                        Reset password untuk <strong>{user.fullName}</strong> ({user.email})
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="newPassword">Password Baru</Label>
                            <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs"
                                onClick={handleGeneratePassword}
                            >
                                Generate Password
                            </Button>
                        </div>
                        <div className="relative">
                            <Input
                                id="newPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="Minimal 6 karakter"
                                {...register("newPassword")}
                            />
                            <div className="absolute right-0 top-0 flex h-full">
                                {newPassword && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-full px-2"
                                        onClick={handleCopyPassword}
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-full px-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        {errors.newPassword && (
                            <p className="text-sm text-red-500">{errors.newPassword.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                        <Input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="Ulangi password"
                            {...register("confirmPassword")}
                        />
                        {errors.confirmPassword && (
                            <p className="text-sm text-red-500">
                                {errors.confirmPassword.message}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reset Password
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
