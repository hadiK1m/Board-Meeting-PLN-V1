// src/components/features/settings/profile-tab.tsx
"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    User,
    Mail,
    Phone,
    Building2,
    Camera,
    Loader2,
    Save,
    KeyRound,
} from "lucide-react";
import { toast } from "sonner";

// Mock user data - will be replaced with actual user data from auth
const mockUser = {
    id: "1",
    fullName: "John Doe",
    email: "john.doe@pln.co.id",
    phone: "081234567890",
    department: "Divisi Hukum Korporat",
    role: "Admin",
    avatar: "",
};

export function ProfileTab() {
    const [isLoading, setIsLoading] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [profile, setProfile] = useState(mockUser);
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleSaveProfile = async () => {
        setIsLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsLoading(false);
        toast.success("Profil berhasil diperbarui");
    };

    const handleChangePassword = async () => {
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error("Password baru tidak cocok");
            return;
        }

        if (passwords.newPassword.length < 8) {
            toast.error("Password minimal 8 karakter");
            return;
        }

        setIsChangingPassword(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsChangingPassword(false);
        setPasswords({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
        toast.success("Password berhasil diubah");
    };

    return (
        <div className="space-y-6">
            {/* Profile Info Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#125d72]/10 rounded-lg">
                            <User className="h-5 w-5 text-[#125d72]" />
                        </div>
                        <div>
                            <CardTitle>Informasi Profil</CardTitle>
                            <CardDescription>
                                Kelola informasi profil dan data pribadi Anda.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={profile.avatar} alt={profile.fullName} />
                                <AvatarFallback className="text-2xl bg-[#125d72] text-white">
                                    {getInitials(profile.fullName)}
                                </AvatarFallback>
                            </Avatar>
                            <Button
                                size="icon"
                                variant="secondary"
                                className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
                            >
                                <Camera className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-semibold">{profile.fullName}</h3>
                            <p className="text-muted-foreground">{profile.email}</p>
                            <Badge variant="secondary" className="mt-1">
                                {profile.role}
                            </Badge>
                        </div>
                    </div>

                    <Separator />

                    {/* Form Fields */}
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                Nama Lengkap
                            </Label>
                            <Input
                                id="fullName"
                                value={profile.fullName}
                                onChange={(e) =>
                                    setProfile({ ...profile, fullName: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={profile.email}
                                onChange={(e) =>
                                    setProfile({ ...profile, email: e.target.value })
                                }
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                Email tidak dapat diubah
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                Nomor Telepon
                            </Label>
                            <Input
                                id="phone"
                                value={profile.phone}
                                onChange={(e) =>
                                    setProfile({ ...profile, phone: e.target.value })
                                }
                                placeholder="08xxxxxxxxxx"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="department" className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                Unit Kerja
                            </Label>
                            <Input
                                id="department"
                                value={profile.department}
                                onChange={(e) =>
                                    setProfile({ ...profile, department: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleSaveProfile}
                            disabled={isLoading}
                            className="bg-[#125d72] hover:bg-[#0e4a5c]"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Simpan Perubahan
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#125d72]/10 rounded-lg">
                            <KeyRound className="h-5 w-5 text-[#125d72]" />
                        </div>
                        <div>
                            <CardTitle>Ubah Password</CardTitle>
                            <CardDescription>
                                Perbarui password Anda untuk menjaga keamanan akun.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 max-w-md">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Password Saat Ini</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={passwords.currentPassword}
                                onChange={(e) =>
                                    setPasswords({ ...passwords, currentPassword: e.target.value })
                                }
                                placeholder="Masukkan password saat ini"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Password Baru</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={passwords.newPassword}
                                onChange={(e) =>
                                    setPasswords({ ...passwords, newPassword: e.target.value })
                                }
                                placeholder="Masukkan password baru"
                            />
                            <p className="text-xs text-muted-foreground">
                                Minimal 8 karakter
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={passwords.confirmPassword}
                                onChange={(e) =>
                                    setPasswords({ ...passwords, confirmPassword: e.target.value })
                                }
                                placeholder="Ulangi password baru"
                            />
                        </div>
                    </div>

                    <div className="flex justify-start">
                        <Button
                            onClick={handleChangePassword}
                            disabled={
                                isChangingPassword ||
                                !passwords.currentPassword ||
                                !passwords.newPassword ||
                                !passwords.confirmPassword
                            }
                            variant="outline"
                        >
                            {isChangingPassword ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <KeyRound className="h-4 w-4 mr-2" />
                            )}
                            Ubah Password
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
