// src/components/features/settings/two-factor-tab.tsx
"use client";

import { useState, useEffect } from "react";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ShieldCheck,
    Smartphone,
    QrCode,
    Copy,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Key,
    RefreshCw,
    ShieldOff,
    Download,
} from "lucide-react";
import { toast } from "sonner";
import {
    get2FAStatus,
    initiate2FASetup,
    complete2FASetup,
    disable2FA,
    regenerateBackupCodes,
    getRemainingBackupCodesCount,
} from "@/server/actions/two-factor-actions";

type TwoFactorStatus = "loading" | "not_setup" | "pending" | "enabled";

export function TwoFactorTab() {
    const [status, setStatus] = useState<TwoFactorStatus>("loading");
    const [isLoading, setIsLoading] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [secretKey, setSecretKey] = useState("");
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [showBackupCodes, setShowBackupCodes] = useState(false);
    const [remainingBackupCodes, setRemainingBackupCodes] = useState(0);
    const [disableDialogOpen, setDisableDialogOpen] = useState(false);
    const [disableCode, setDisableCode] = useState("");
    const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
    const [regenerateCode, setRegenerateCode] = useState("");
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

    // Load initial 2FA status
    useEffect(() => {
        let cancelled = false;

        const fetchStatus = async () => {
            try {
                const result = await get2FAStatus();
                if (cancelled) return;

                if (result) {
                    if (result.isEnabled && result.isVerified) {
                        setStatus("enabled");
                        const count = await getRemainingBackupCodesCount();
                        if (!cancelled) {
                            setRemainingBackupCodes(count);
                        }
                    } else {
                        setStatus("not_setup");
                    }
                } else {
                    setStatus("not_setup");
                }
            } catch (error) {
                if (cancelled) return;
                console.error("Error loading 2FA status:", error);
                setStatus("not_setup");
            }
        };

        fetchStatus();

        return () => {
            cancelled = true;
        };
    }, []);

    // Reload status function for use after actions
    const reloadStatus = async () => {
        try {
            const result = await get2FAStatus();
            if (result) {
                if (result.isEnabled && result.isVerified) {
                    setStatus("enabled");
                    const count = await getRemainingBackupCodesCount();
                    setRemainingBackupCodes(count);
                } else {
                    setStatus("not_setup");
                }
            } else {
                setStatus("not_setup");
            }
        } catch (error) {
            console.error("Error loading 2FA status:", error);
            setStatus("not_setup");
        }
    };

    const handleSetup2FA = async () => {
        setIsLoading(true);
        setRemainingAttempts(null);

        const result = await initiate2FASetup();

        if (result.success && result.qrCodeUrl && result.secretKey && result.backupCodes) {
            setSecretKey(result.secretKey);
            setQrCodeUrl(result.qrCodeUrl);
            setBackupCodes(result.backupCodes);
            setShowBackupCodes(true);
            setStatus("pending");
        } else {
            toast.error(result.error || "Gagal memulai setup 2FA");
        }

        setIsLoading(false);
    };

    const handleVerify = async () => {
        if (verificationCode.length !== 6) {
            toast.error("Kode verifikasi harus 6 digit");
            return;
        }

        setIsLoading(true);

        const result = await complete2FASetup(verificationCode);

        if (result.success) {
            setStatus("enabled");
            setSecretKey("");
            setQrCodeUrl("");
            setVerificationCode("");
            setShowBackupCodes(false);
            setRemainingAttempts(null);
            toast.success("2FA berhasil diaktifkan!");
            reloadStatus();
        } else {
            if (result.remainingAttempts !== undefined) {
                setRemainingAttempts(result.remainingAttempts);
            }
            if (result.lockedUntil) {
                toast.error(`Akun terkunci sementara. Coba lagi setelah ${new Date(result.lockedUntil).toLocaleTimeString()}`);
            } else {
                toast.error(result.error || "Kode verifikasi salah");
            }
        }

        setIsLoading(false);
    };

    const handleDisable2FA = async () => {
        if (disableCode.length !== 6) {
            toast.error("Masukkan kode 6 digit dari aplikasi");
            return;
        }

        setIsLoading(true);

        const result = await disable2FA(disableCode);

        if (result.success) {
            setStatus("not_setup");
            setSecretKey("");
            setQrCodeUrl("");
            setVerificationCode("");
            setDisableCode("");
            setDisableDialogOpen(false);
            toast.success("2FA berhasil dinonaktifkan");
        } else {
            toast.error(result.error || "Gagal menonaktifkan 2FA");
        }

        setIsLoading(false);
    };

    const handleRegenerateBackupCodes = async () => {
        if (regenerateCode.length !== 6) {
            toast.error("Masukkan kode 6 digit dari aplikasi");
            return;
        }

        setIsLoading(true);

        const result = await regenerateBackupCodes(regenerateCode);

        if (result.success && result.backupCodes) {
            setBackupCodes(result.backupCodes);
            setShowBackupCodes(true);
            setRegenerateCode("");
            setRegenerateDialogOpen(false);
            setRemainingBackupCodes(10);
            toast.success("Backup codes berhasil diperbarui!");
        } else {
            toast.error(result.error || "Gagal regenerate backup codes");
        }

        setIsLoading(false);
    };

    const copySecretKey = () => {
        navigator.clipboard.writeText(secretKey);
        toast.success("Secret key berhasil disalin");
    };

    const downloadBackupCodes = () => {
        const content = `PLN Board Meeting - Backup Codes\n${"=".repeat(40)}\n\nSimpan kode-kode ini di tempat yang aman.\nSetiap kode hanya dapat digunakan satu kali.\n\n${backupCodes.map((code, i) => `${i + 1}. ${code}`).join("\n")}\n\n${"=".repeat(40)}\nDibuat pada: ${new Date().toLocaleString("id-ID")}`;

        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "pln-board-meeting-backup-codes.txt";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Backup codes berhasil diunduh");
    };

    const copyBackupCodes = () => {
        navigator.clipboard.writeText(backupCodes.join("\n"));
        toast.success("Backup codes berhasil disalin");
    };

    if (status === "loading") {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <>
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
                                    <li>Simpan backup codes di tempat yang aman</li>
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
                            {/* Backup Codes Warning */}
                            {showBackupCodes && backupCodes.length > 0 && (
                                <Alert className="border-amber-200 bg-amber-50">
                                    <Key className="h-4 w-4 text-amber-600" />
                                    <AlertTitle className="text-amber-800">Simpan Backup Codes!</AlertTitle>
                                    <AlertDescription className="text-amber-700">
                                        <p className="mb-3">
                                            Simpan kode-kode ini di tempat yang aman. Anda akan membutuhkannya
                                            jika kehilangan akses ke Google Authenticator.
                                        </p>
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                                            {backupCodes.map((code, index) => (
                                                <code
                                                    key={index}
                                                    className="px-2 py-1 bg-white rounded border border-amber-200 text-center font-mono text-sm"
                                                >
                                                    {code}
                                                </code>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={downloadBackupCodes}
                                                className="border-amber-300 hover:bg-amber-100"
                                            >
                                                <Download className="h-4 w-4 mr-1" />
                                                Download
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={copyBackupCodes}
                                                className="border-amber-300 hover:bg-amber-100"
                                            >
                                                <Copy className="h-4 w-4 mr-1" />
                                                Salin Semua
                                            </Button>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}

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
                                        {qrCodeUrl && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={qrCodeUrl}
                                                alt="QR Code for 2FA"
                                                width={200}
                                                height={200}
                                                className="rounded"
                                            />
                                        )}
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
                                            <code className="flex-1 px-3 py-2 bg-slate-100 rounded-md font-mono text-sm tracking-widest break-all">
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
                                        {remainingAttempts !== null && remainingAttempts > 0 && (
                                            <p className="text-sm text-amber-600">
                                                Sisa percobaan: {remainingAttempts}
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setStatus("not_setup");
                                            setSecretKey("");
                                            setQrCodeUrl("");
                                            setBackupCodes([]);
                                            setShowBackupCodes(false);
                                            setRemainingAttempts(null);
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
                            {/* Show backup codes if just regenerated */}
                            {showBackupCodes && backupCodes.length > 0 && (
                                <Alert className="border-amber-200 bg-amber-50">
                                    <Key className="h-4 w-4 text-amber-600" />
                                    <AlertTitle className="text-amber-800">Backup Codes Baru!</AlertTitle>
                                    <AlertDescription className="text-amber-700">
                                        <p className="mb-3">
                                            Simpan kode-kode ini di tempat yang aman. Kode lama sudah tidak berlaku.
                                        </p>
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                                            {backupCodes.map((code, index) => (
                                                <code
                                                    key={index}
                                                    className="px-2 py-1 bg-white rounded border border-amber-200 text-center font-mono text-sm"
                                                >
                                                    {code}
                                                </code>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={downloadBackupCodes}
                                                className="border-amber-300 hover:bg-amber-100"
                                            >
                                                <Download className="h-4 w-4 mr-1" />
                                                Download
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={copyBackupCodes}
                                                className="border-amber-300 hover:bg-amber-100"
                                            >
                                                <Copy className="h-4 w-4 mr-1" />
                                                Salin Semua
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setShowBackupCodes(false);
                                                    setBackupCodes([]);
                                                }}
                                                className="border-amber-300 hover:bg-amber-100"
                                            >
                                                Tutup
                                            </Button>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Alert className="border-green-200 bg-green-50">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertTitle className="text-green-800">2FA Aktif</AlertTitle>
                                <AlertDescription className="text-green-700">
                                    Akun Anda dilindungi dengan autentikasi dua faktor.
                                    Anda akan diminta memasukkan kode dari Google Authenticator setiap kali login.
                                </AlertDescription>
                            </Alert>

                            <div className="bg-slate-50 rounded-lg p-6">
                                <div className="flex items-start justify-between">
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
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Backup codes tersisa</p>
                                        <p className={`font-semibold ${remainingBackupCodes <= 3 ? "text-red-600" : "text-green-600"}`}>
                                            {remainingBackupCodes} / 10
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Regenerate Backup Codes */}
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <h4 className="font-medium">Backup Codes</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Regenerate backup codes jika hampir habis atau terekspos
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setRegenerateDialogOpen(true)}
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Regenerate
                                </Button>
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="font-semibold text-red-600 mb-2">Zona Bahaya</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Menonaktifkan 2FA akan mengurangi keamanan akun Anda.
                                    Pastikan Anda memahami risikonya.
                                </p>
                                <Button
                                    variant="destructive"
                                    onClick={() => setDisableDialogOpen(true)}
                                >
                                    <ShieldOff className="h-4 w-4 mr-2" />
                                    Nonaktifkan 2FA
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Disable 2FA Dialog */}
            <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Nonaktifkan 2FA</DialogTitle>
                        <DialogDescription>
                            Untuk keamanan, masukkan kode 6 digit dari Google Authenticator untuk mengonfirmasi.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Kode Verifikasi</Label>
                            <Input
                                placeholder="000000"
                                maxLength={6}
                                value={disableCode}
                                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
                                className="font-mono text-lg tracking-widest"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDisableDialogOpen(false);
                                setDisableCode("");
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDisable2FA}
                            disabled={isLoading || disableCode.length !== 6}
                        >
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Nonaktifkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Regenerate Backup Codes Dialog */}
            <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Regenerate Backup Codes</DialogTitle>
                        <DialogDescription>
                            Kode backup lama akan dihapus. Masukkan kode 6 digit dari Google Authenticator untuk mengonfirmasi.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Kode Verifikasi</Label>
                            <Input
                                placeholder="000000"
                                maxLength={6}
                                value={regenerateCode}
                                onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, ""))}
                                className="font-mono text-lg tracking-widest"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRegenerateDialogOpen(false);
                                setRegenerateCode("");
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleRegenerateBackupCodes}
                            disabled={isLoading || regenerateCode.length !== 6}
                            className="bg-[#125d72] hover:bg-[#0e4a5c]"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Regenerate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
