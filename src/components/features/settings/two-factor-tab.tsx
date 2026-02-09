// src/components/features/settings/two-factor-tab.tsx
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
import { Badge } from "@/components/ui/badge";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import { ShieldCheck, Smartphone, QrCode, Copy, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

type TwoFactorStatus = "not_setup" | "pending" | "enabled";

export function TwoFactorTab() {
    const [status, setStatus] = useState<TwoFactorStatus>("not_setup");
    const [isLoading, setIsLoading] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [secretKey, setSecretKey] = useState("");

    const handleSetup2FA = async () => {
        setIsLoading(true);
        // Simulasi API call untuk generate secret
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Ini adalah contoh - nanti akan diganti dengan API yang sebenarnya
        const mockSecret = "JBSWY3DPEHPK3PXP";
        const mockQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/PLN%20Board%20Meeting:user@pln.co.id?secret=${mockSecret}&issuer=PLN%20Board%20Meeting`;

        setSecretKey(mockSecret);
        setQrCodeUrl(mockQrUrl);
        setStatus("pending");
        setIsLoading(false);
    };

    const handleVerify = async () => {
        if (verificationCode.length !== 6) {
            toast.error("Kode verifikasi harus 6 digit");
            return;
        }

        setIsLoading(true);
        // Simulasi verifikasi
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Untuk demo, kita terima semua kode
        setStatus("enabled");
        setIsLoading(false);
        toast.success("2FA berhasil diaktifkan!");
    };

    const handleDisable2FA = async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        setStatus("not_setup");
        setSecretKey("");
        setQrCodeUrl("");
        setVerificationCode("");
        setIsLoading(false);
        toast.success("2FA berhasil dinonaktifkan");
    };

    const copySecretKey = () => {
        navigator.clipboard.writeText(secretKey);
        toast.success("Secret key berhasil disalin");
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#125d72]/10 rounded-lg">
                        <ShieldCheck className="h-5 w-5 text-[#125d72]" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <CardTitle>Autentikasi Dua Faktor (2FA)</CardTitle>
                            {status === "enabled" && (
                                <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Aktif
                                </Badge>
                            )}
                        </div>
                        <CardDescription>
                            Tingkatkan keamanan akun Anda dengan Google Authenticator.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Status: Not Setup */}
                {status === "not_setup" && (
                    <div className="space-y-6">
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>2FA Belum Aktif</AlertTitle>
                            <AlertDescription>
                                Akun Anda belum dilindungi dengan autentikasi dua faktor.
                                Aktifkan 2FA untuk keamanan tambahan.
                            </AlertDescription>
                        </Alert>

                        <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Smartphone className="h-5 w-5" />
                                Cara Mengaktifkan 2FA
                            </h3>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                <li>Install aplikasi Google Authenticator di smartphone Anda</li>
                                <li>Klik tombol &ldquo;Aktifkan 2FA&rdquo; di bawah</li>
                                <li>Scan QR Code yang muncul dengan Google Authenticator</li>
                                <li>Masukkan kode 6 digit dari aplikasi untuk verifikasi</li>
                            </ol>
                        </div>

                        <Button
                            onClick={handleSetup2FA}
                            disabled={isLoading}
                            className="w-full sm:w-auto bg-[#125d72] hover:bg-[#0e4a5c]"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <ShieldCheck className="h-4 w-4 mr-2" />
                            )}
                            Aktifkan 2FA
                        </Button>
                    </div>
                )}

                {/* Status: Pending Setup */}
                {status === "pending" && (
                    <div className="space-y-6">
                        <Alert className="border-blue-200 bg-blue-50">
                            <QrCode className="h-4 w-4 text-blue-600" />
                            <AlertTitle className="text-blue-800">Scan QR Code</AlertTitle>
                            <AlertDescription className="text-blue-700">
                                Scan QR Code di bawah dengan aplikasi Google Authenticator Anda.
                            </AlertDescription>
                        </Alert>

                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* QR Code Section */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 bg-white rounded-xl shadow-md border">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={qrCodeUrl}
                                        alt="QR Code for 2FA"
                                        width={200}
                                        height={200}
                                        className="rounded"
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground text-center">
                                    Scan dengan Google Authenticator
                                </p>
                            </div>

                            {/* Manual Entry & Verification */}
                            <div className="flex-1 space-y-6">
                                {/* Secret Key for manual entry */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        Atau masukkan kode ini secara manual:
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 px-3 py-2 bg-slate-100 rounded-md font-mono text-sm tracking-widest">
                                            {secretKey}
                                        </code>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={copySecretKey}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Verification Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="verification-code">
                                        Masukkan kode 6 digit dari Google Authenticator
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="verification-code"
                                            placeholder="000000"
                                            maxLength={6}
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                                            className="font-mono text-lg tracking-widest max-w-37.5"
                                        />
                                        <Button
                                            onClick={handleVerify}
                                            disabled={isLoading || verificationCode.length !== 6}
                                            className="bg-[#125d72] hover:bg-[#0e4a5c]"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                            )}
                                            Verifikasi
                                        </Button>
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setStatus("not_setup");
                                        setSecretKey("");
                                        setQrCodeUrl("");
                                    }}
                                    className="text-muted-foreground"
                                >
                                    Batal
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status: Enabled */}
                {status === "enabled" && (
                    <div className="space-y-6">
                        <Alert className="border-green-200 bg-green-50">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">2FA Aktif</AlertTitle>
                            <AlertDescription className="text-green-700">
                                Akun Anda dilindungi dengan autentikasi dua faktor.
                                Anda akan diminta memasukkan kode dari Google Authenticator setiap kali login.
                            </AlertDescription>
                        </Alert>

                        <div className="bg-slate-50 rounded-lg p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-green-100 rounded-full">
                                    <Smartphone className="h-6 w-6 text-green-700" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold">Google Authenticator</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Terhubung dan aktif
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="font-semibold text-red-600 mb-2">Zona Bahaya</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Menonaktifkan 2FA akan mengurangi keamanan akun Anda.
                                Pastikan Anda memahami risikonya.
                            </p>
                            <Button
                                variant="destructive"
                                onClick={handleDisable2FA}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                )}
                                Nonaktifkan 2FA
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
