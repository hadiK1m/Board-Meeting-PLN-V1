/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { loginSchema, type LoginInput } from "@/schemas/auth/login";
import { createClient } from "@/lib/supabase/server";
import { ActionState } from "@/types/actions";
import { check2FAEnabled } from "@/server/actions/two-factor-actions";
import { cookies } from "next/headers";
import { generateSecureToken, encrypt, decrypt } from "@/lib/crypto";

// Temporary session for 2FA verification (expires in 5 minutes)
const TWO_FA_SESSION_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function loginAction(
    data: LoginInput
): Promise<ActionState<LoginInput, { userId: string; requires2FA?: boolean }>> {
    // 1. Validasi Input (Server-Side)
    const validatedFields = loginSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            status: "VALIDATION_ERROR",
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Data yang dimasukkan tidak valid.",
        };
    }

    const { email, password } = validatedFields.data;
    const supabase = await createClient();

    try {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return {
                status: "ERROR",
                message: "Email atau password salah.",
            };
        }

        // Check if user has 2FA enabled
        const has2FA = await check2FAEnabled(authData.user.id);

        if (has2FA) {
            // Sign out immediately - user needs to complete 2FA first
            await supabase.auth.signOut();

            // Create a temporary 2FA session token
            const twoFAToken = generateSecureToken(32);

            // Encrypt the password for temporary storage (will be used for re-auth after 2FA)
            const encryptedCredentials = encrypt(JSON.stringify({ email, password }));

            const cookieStore = await cookies();

            // Store pending 2FA session data with encrypted credentials
            cookieStore.set("2fa_pending", JSON.stringify({
                token: twoFAToken,
                userId: authData.user.id,
                email: email,
                credentials: encryptedCredentials, // Encrypted!
                expiresAt: Date.now() + TWO_FA_SESSION_EXPIRY,
            }), {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 300, // 5 minutes
                path: "/",
            });

            return {
                status: "SUCCESS",
                data: { userId: authData.user.id, requires2FA: true },
                message: "Verifikasi 2FA diperlukan.",
            };
        }

        return {
            status: "SUCCESS",
            data: { userId: authData.user.id },
            message: "Login berhasil, mengalihkan...",
        };
    } catch (err: unknown) {
        return {
            status: "ERROR",
            message: "Terjadi kesalahan sistem internal.",
        };
    }
}

/**
 * Complete login after 2FA verification
 */
export async function completeLoginWith2FA(
    code: string
): Promise<ActionState<unknown, { userId: string }>> {
    const cookieStore = await cookies();
    const pendingSession = cookieStore.get("2fa_pending");

    if (!pendingSession) {
        return {
            status: "ERROR",
            message: "Sesi 2FA telah kedaluwarsa. Silakan login ulang.",
        };
    }

    try {
        const sessionData = JSON.parse(pendingSession.value) as {
            token: string;
            userId: string;
            email: string;
            credentials: string;
            expiresAt: number;
        };

        // Check if session expired
        if (Date.now() > sessionData.expiresAt) {
            cookieStore.delete("2fa_pending");
            return {
                status: "ERROR",
                message: "Sesi 2FA telah kedaluwarsa. Silakan login ulang.",
            };
        }

        // Verify 2FA code
        const { verify2FACode } = await import("@/server/actions/two-factor-actions");
        const verifyResult = await verify2FACode(sessionData.userId, code);

        if (!verifyResult.success) {
            if (verifyResult.lockedUntil) {
                // Clear session on lockout
                cookieStore.delete("2fa_pending");
                return {
                    status: "ERROR",
                    message: `Akun terkunci sementara. Coba lagi setelah ${new Date(verifyResult.lockedUntil).toLocaleTimeString()}.`,
                };
            }
            return {
                status: "ERROR",
                message: verifyResult.error || "Kode verifikasi salah.",
            };
        }

        // 2FA verified - now re-authenticate the user
        const decryptedCreds = decrypt(sessionData.credentials);
        const { email, password } = JSON.parse(decryptedCreds);

        const supabase = await createClient();
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        // Clear pending session immediately after use
        cookieStore.delete("2fa_pending");

        if (authError) {
            return {
                status: "ERROR",
                message: "Gagal melakukan autentikasi. Silakan login ulang.",
            };
        }

        return {
            status: "SUCCESS",
            data: { userId: authData.user.id },
            message: "Verifikasi berhasil.",
        };
    } catch (err) {
        console.error("Error completing 2FA login:", err);
        // Clear session on any error
        cookieStore.delete("2fa_pending");
        return {
            status: "ERROR",
            message: "Terjadi kesalahan saat verifikasi.",
        };
    }
}

/**
 * Get pending 2FA session info
 */
export async function get2FAPendingSession(): Promise<{
    exists: boolean;
    email?: string;
    expiresAt?: number;
}> {
    const cookieStore = await cookies();
    const pendingSession = cookieStore.get("2fa_pending");

    if (!pendingSession) {
        return { exists: false };
    }

    try {
        const sessionData = JSON.parse(pendingSession.value);

        if (Date.now() > sessionData.expiresAt) {
            cookieStore.delete("2fa_pending");
            return { exists: false };
        }

        return {
            exists: true,
            email: sessionData.email,
            expiresAt: sessionData.expiresAt,
        };
    } catch {
        return { exists: false };
    }
}

/**
 * Cancel pending 2FA session
 */
export async function cancel2FASession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete("2fa_pending");
}