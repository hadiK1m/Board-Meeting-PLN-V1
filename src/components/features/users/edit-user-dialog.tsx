// src/components/features/users/edit-user-dialog.tsx
"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

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
import { updateUserAction, type UserData } from "@/server/actions/user-actions";

const editUserSchema = z.object({
    fullName: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Email tidak valid"),
    role: z.string().min(1, "Role harus dipilih"),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserDialogProps {
    user: UserData;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditUserDialog({
    user,
    open,
    onOpenChange,
    onSuccess,
}: EditUserDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<EditUserFormData>({
        resolver: zodResolver(editUserSchema),
        defaultValues: {
            fullName: user.fullName,
            email: user.email,
            role: user.role,
        },
    });

    const selectedRole = useWatch({ control, name: "role" });

    const onSubmit = async (data: EditUserFormData) => {
        setIsSubmitting(true);

        const result = await updateUserAction(user.id, data);

        if (result.success) {
            showNotify("User berhasil diperbarui", "success");
            onOpenChange(false);
            onSuccess();
        } else {
            showNotify(result.error || "Gagal memperbarui user", "error");
        }

        setIsSubmitting(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Perbarui informasi pengguna.
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
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Perubahan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
