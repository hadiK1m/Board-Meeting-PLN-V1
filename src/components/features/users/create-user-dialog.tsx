// src/components/features/users/create-user-dialog.tsx
"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { showNotify } from "@/components/shared/toast-provider";
import { createUserAction } from "@/server/actions/user-actions";

const createUserSchema = z.object({
    fullName: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    role: z.string().min(1, "Role harus dipilih"),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateUserDialog({
    open,
    onOpenChange,
    onSuccess,
}: CreateUserDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        control,
        formState: { errors },
    } = useForm<CreateUserFormData>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            role: "",
        },
    });

    const selectedRole = useWatch({ control, name: "role" });

    const onSubmit = async (data: CreateUserFormData) => {
        setIsSubmitting(true);

        const result = await createUserAction(data);

        if (result.success) {
            showNotify("User berhasil ditambahkan", "success");
            reset();
            onOpenChange(false);
            onSuccess();
        } else {
            showNotify(result.error || "Gagal menambahkan user", "error");
        }

        setIsSubmitting(false);
    };

    const handleClose = () => {
        reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle>Tambah User Baru</DialogTitle>
                    <DialogDescription>
                        Buat akun pengguna baru untuk sistem Board Meeting.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Nama Lengkap</Label>
                        <Input
                            id="fullName"
                            placeholder="Masukkan nama lengkap"
                            {...register("fullName")}
                        />
                        {errors.fullName && (
                            <p className="text-sm text-red-500">{errors.fullName.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="email@example.com"
                            {...register("email")}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Minimal 6 karakter"
                                {...register("password")}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                            value={selectedRole}
                            onValueChange={(value) => setValue("role", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="sekretaris">Sekretaris</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.role && (
                            <p className="text-sm text-red-500">{errors.role.message}</p>
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
                            Tambah User
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
