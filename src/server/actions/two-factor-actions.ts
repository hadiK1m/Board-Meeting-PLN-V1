// src/server/actions/two-factor-actions.ts
"use server";

import { db } from "@/db";
import { twoFactorAuth, twoFactorAuditLog, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import * as OTPAuth from "otpauth";
import * as QRCode from "qrcode";
import { encrypt, decrypt, hashBackupCode, generateBackupCodes } from "@/lib/crypto";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import crypto from "crypto";

const APP_NAME = "PLN Board Meeting";
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const TOTP_PERIOD = 30; // seconds
const TOTP_WINDOW = 1; // allow 1 period before/after for clock drift

interface TwoFactorSetupResult {
    success: boolean;
    error?: string;
    qrCodeUrl?: string;
    secretKey?: string;
    backupCodes?: string[];
}

interface TwoFactorVerifyResult {
    success: boolean;
    error?: string;
    remainingAttempts?: number;
    lockedUntil?: Date;
}

interface TwoFactorStatusResult {
    isEnabled: boolean;
    isVerified: boolean;
    lastUsedAt: Date | null;
    createdAt: Date | null;
}

/**
 * Generate a random base32 secret for TOTP
 */
function generateTOTPSecret(): string {
    // Generate 20 bytes (160 bits) of random data and convert to base32
    const buffer = crypto.randomBytes(20);
    const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let secret = "";
    for (let i = 0; i < buffer.length; i++) {
        secret += base32chars[buffer[i]! % 32];
    }
    return secret;
}

/**
 * Create a TOTP instance with the given secret
 */
function createTOTP(secret: string, email: string): OTPAuth.TOTP {
    return new OTPAuth.TOTP({
        issuer: APP_NAME,
        label: email,
        algorithm: "SHA1",
        digits: 6,
        period: TOTP_PERIOD,
        secret: OTPAuth.Secret.fromBase32(secret),
    });
}

/**
 * Verify a TOTP token
 */
function verifyTOTPToken(secret: string, token: string, email: string = ""): boolean {
    const totp = createTOTP(secret, email);
    const delta = totp.validate({ token, window: TOTP_WINDOW });
    return delta !== null;
}

/**
 * Get current user ID from Supabase session
 */
async function getCurrentUserId(): Promise<string | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
}

/**
 * Get client info for audit logging
 */
async function getClientInfo() {
    const headersList = await headers();
    return {
        ipAddress: headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown",
        userAgent: headersList.get("user-agent") || "unknown",
    };
}

/**
 * Log 2FA action for audit trail
 */
async function logAuditAction(
    userId: string,
    action: string,
    metadata: Record<string, unknown> = {}
) {
    const clientInfo = await getClientInfo();

    await db.insert(twoFactorAuditLog).values({
        userId,
        action,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        metadata,
    });
}

/**
 * Get 2FA status for current user
 */
export async function get2FAStatus(): Promise<TwoFactorStatusResult | null> {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const [record] = await db
        .select()
        .from(twoFactorAuth)
        .where(eq(twoFactorAuth.userId, userId))
        .limit(1);

    if (!record) {
        return {
            isEnabled: false,
            isVerified: false,
            lastUsedAt: null,
            createdAt: null,
        };
    }

    return {
        isEnabled: record.isEnabled,
        isVerified: record.isVerified,
        lastUsedAt: record.lastUsedAt,
        createdAt: record.createdAt,
    };
}

/**
 * Initiate 2FA setup - generates secret and QR code
 */
export async function initiate2FASetup(): Promise<TwoFactorSetupResult> {
    const userId = await getCurrentUserId();
    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // Get user email for QR code
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!user) {
            return { success: false, error: "User not found" };
        }

        // Check if already has 2FA enabled
        const [existing] = await db
            .select()
            .from(twoFactorAuth)
            .where(eq(twoFactorAuth.userId, userId))
            .limit(1);

        if (existing?.isEnabled && existing?.isVerified) {
            return { success: false, error: "2FA already enabled" };
        }

        // Generate new TOTP secret
        const secret = generateTOTPSecret();

        // Encrypt secret before storing
        const encryptedSecret = encrypt(secret);

        // Generate backup codes
        const backupCodes = generateBackupCodes(10);
        const hashedBackupCodes = backupCodes.map(code => ({
            hash: hashBackupCode(code.replace("-", "")),
            used: false,
        }));

        // Generate QR code URL using OTPAuth
        const totp = createTOTP(secret, user.email);
        const otpauthUrl = totp.toString();
        const qrCodeUrl = await QRCode.toDataURL(otpauthUrl, {
            width: 256,
            margin: 2,
            color: {
                dark: "#000000",
                light: "#FFFFFF",
            },
        });

        // Store or update 2FA record
        if (existing) {
            await db
                .update(twoFactorAuth)
                .set({
                    encryptedSecret,
                    backupCodes: hashedBackupCodes,
                    isEnabled: false,
                    isVerified: false,
                    failedAttempts: 0,
                    lockedUntil: null,
                    updatedAt: new Date(),
                })
                .where(eq(twoFactorAuth.userId, userId));
        } else {
            await db.insert(twoFactorAuth).values({
                userId,
                encryptedSecret,
                backupCodes: hashedBackupCodes,
                isEnabled: false,
                isVerified: false,
            });
        }

        await logAuditAction(userId, "setup_initiated");

        return {
            success: true,
            qrCodeUrl,
            secretKey: secret, // Return plain secret for manual entry
            backupCodes, // Return plain backup codes (only shown once!)
        };
    } catch (error) {
        console.error("Error initiating 2FA setup:", error);
        return { success: false, error: "Failed to initiate 2FA setup" };
    }
}

/**
 * Complete 2FA setup by verifying the first TOTP code
 */
export async function complete2FASetup(code: string): Promise<TwoFactorVerifyResult> {
    const userId = await getCurrentUserId();
    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const [record] = await db
            .select()
            .from(twoFactorAuth)
            .where(eq(twoFactorAuth.userId, userId))
            .limit(1);

        if (!record) {
            return { success: false, error: "2FA not initiated" };
        }

        if (record.isEnabled && record.isVerified) {
            return { success: false, error: "2FA already enabled" };
        }

        // Check if locked out
        if (record.lockedUntil && record.lockedUntil > new Date()) {
            return {
                success: false,
                error: "Too many failed attempts. Please try again later.",
                lockedUntil: record.lockedUntil,
            };
        }

        // Decrypt secret
        const secret = decrypt(record.encryptedSecret);

        // Verify TOTP code
        const cleanCode = code.replace(/\s/g, "");
        const isValid = verifyTOTPToken(secret, cleanCode);

        if (!isValid) {
            // Increment failed attempts
            const newFailedAttempts = (record.failedAttempts || 0) + 1;
            const updates: Record<string, unknown> = {
                failedAttempts: newFailedAttempts,
                updatedAt: new Date(),
            };

            // Lock account if too many failures
            if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
                const lockUntil = new Date();
                lockUntil.setMinutes(lockUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
                updates.lockedUntil = lockUntil;
                await logAuditAction(userId, "locked", { reason: "too_many_failed_attempts" });
            }

            await db
                .update(twoFactorAuth)
                .set(updates)
                .where(eq(twoFactorAuth.userId, userId));

            await logAuditAction(userId, "verification_failed", { stage: "setup" });

            return {
                success: false,
                error: "Invalid verification code",
                remainingAttempts: MAX_FAILED_ATTEMPTS - newFailedAttempts,
            };
        }

        // Enable 2FA
        await db
            .update(twoFactorAuth)
            .set({
                isEnabled: true,
                isVerified: true,
                failedAttempts: 0,
                lockedUntil: null,
                lastUsedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(twoFactorAuth.userId, userId));

        await logAuditAction(userId, "setup_completed");

        return { success: true };
    } catch (error) {
        console.error("Error completing 2FA setup:", error);
        return { success: false, error: "Failed to verify code" };
    }
}

/**
 * Verify TOTP code during login
 */
export async function verify2FACode(
    userId: string,
    code: string
): Promise<TwoFactorVerifyResult> {
    try {
        const [record] = await db
            .select()
            .from(twoFactorAuth)
            .where(and(
                eq(twoFactorAuth.userId, userId),
                eq(twoFactorAuth.isEnabled, true)
            ))
            .limit(1);

        if (!record) {
            return { success: false, error: "2FA not enabled" };
        }

        // Check if locked out
        if (record.lockedUntil && record.lockedUntil > new Date()) {
            return {
                success: false,
                error: "Account temporarily locked. Please try again later.",
                lockedUntil: record.lockedUntil,
            };
        }

        const cleanCode = code.replace(/[\s-]/g, "");

        // First, try TOTP verification
        const secret = decrypt(record.encryptedSecret);
        const isValidTotp = verifyTOTPToken(secret, cleanCode);

        if (isValidTotp) {
            // Reset failed attempts and update last used
            await db
                .update(twoFactorAuth)
                .set({
                    failedAttempts: 0,
                    lockedUntil: null,
                    lastUsedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(twoFactorAuth.userId, userId));

            await logAuditAction(userId, "verification_success", { method: "totp" });
            return { success: true };
        }

        // If TOTP failed, try backup codes
        const backupCodes = record.backupCodes as Array<{ hash: string; used: boolean }>;
        const hashedInput = hashBackupCode(cleanCode);
        const matchingCodeIndex = backupCodes.findIndex(
            (bc) => bc.hash === hashedInput && !bc.used
        );

        if (matchingCodeIndex !== -1) {
            // Mark backup code as used
            const codeToMark = backupCodes[matchingCodeIndex];
            if (codeToMark) codeToMark.used = true;

            await db
                .update(twoFactorAuth)
                .set({
                    backupCodes,
                    failedAttempts: 0,
                    lockedUntil: null,
                    lastUsedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(twoFactorAuth.userId, userId));

            await logAuditAction(userId, "backup_code_used", {
                remainingCodes: backupCodes.filter((bc) => !bc.used).length,
            });

            return { success: true };
        }

        // Both TOTP and backup code failed
        const newFailedAttempts = (record.failedAttempts || 0) + 1;
        const updates: Record<string, unknown> = {
            failedAttempts: newFailedAttempts,
            updatedAt: new Date(),
        };

        if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
            const lockUntil = new Date();
            lockUntil.setMinutes(lockUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
            updates.lockedUntil = lockUntil;
            await logAuditAction(userId, "locked", { reason: "too_many_failed_attempts" });
        }

        await db
            .update(twoFactorAuth)
            .set(updates)
            .where(eq(twoFactorAuth.userId, userId));

        await logAuditAction(userId, "verification_failed", { method: "login" });

        return {
            success: false,
            error: "Invalid verification code",
            remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - newFailedAttempts),
        };
    } catch (error) {
        console.error("Error verifying 2FA code:", error);
        return { success: false, error: "Verification failed" };
    }
}

/**
 * Check if user has 2FA enabled
 */
export async function check2FAEnabled(userId: string): Promise<boolean> {
    const [record] = await db
        .select({ isEnabled: twoFactorAuth.isEnabled })
        .from(twoFactorAuth)
        .where(and(
            eq(twoFactorAuth.userId, userId),
            eq(twoFactorAuth.isEnabled, true),
            eq(twoFactorAuth.isVerified, true)
        ))
        .limit(1);

    return !!record?.isEnabled;
}

/**
 * Disable 2FA for current user
 */
export async function disable2FA(verificationCode: string): Promise<TwoFactorVerifyResult> {
    const userId = await getCurrentUserId();
    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const [record] = await db
            .select()
            .from(twoFactorAuth)
            .where(eq(twoFactorAuth.userId, userId))
            .limit(1);

        if (!record || !record.isEnabled) {
            return { success: false, error: "2FA not enabled" };
        }

        // Verify code before disabling
        const secret = decrypt(record.encryptedSecret);
        const cleanCode = verificationCode.replace(/\s/g, "");
        const isValid = verifyTOTPToken(secret, cleanCode);

        if (!isValid) {
            await logAuditAction(userId, "disable_failed", { reason: "invalid_code" });
            return { success: false, error: "Invalid verification code" };
        }

        // Delete 2FA record
        await db
            .delete(twoFactorAuth)
            .where(eq(twoFactorAuth.userId, userId));

        await logAuditAction(userId, "disabled");

        return { success: true };
    } catch (error) {
        console.error("Error disabling 2FA:", error);
        return { success: false, error: "Failed to disable 2FA" };
    }
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(
    verificationCode: string
): Promise<{ success: boolean; error?: string; backupCodes?: string[] }> {
    const userId = await getCurrentUserId();
    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const [record] = await db
            .select()
            .from(twoFactorAuth)
            .where(eq(twoFactorAuth.userId, userId))
            .limit(1);

        if (!record || !record.isEnabled) {
            return { success: false, error: "2FA not enabled" };
        }

        // Verify code before regenerating
        const secret = decrypt(record.encryptedSecret);
        const cleanCode = verificationCode.replace(/\s/g, "");
        const isValid = verifyTOTPToken(secret, cleanCode);

        if (!isValid) {
            return { success: false, error: "Invalid verification code" };
        }

        // Generate new backup codes
        const backupCodes = generateBackupCodes(10);
        const hashedBackupCodes = backupCodes.map(code => ({
            hash: hashBackupCode(code.replace("-", "")),
            used: false,
        }));

        await db
            .update(twoFactorAuth)
            .set({
                backupCodes: hashedBackupCodes,
                updatedAt: new Date(),
            })
            .where(eq(twoFactorAuth.userId, userId));

        await logAuditAction(userId, "backup_codes_regenerated");

        return { success: true, backupCodes };
    } catch (error) {
        console.error("Error regenerating backup codes:", error);
        return { success: false, error: "Failed to regenerate backup codes" };
    }
}

/**
 * Get remaining backup codes count
 */
export async function getRemainingBackupCodesCount(): Promise<number> {
    const userId = await getCurrentUserId();
    if (!userId) return 0;

    const [record] = await db
        .select({ backupCodes: twoFactorAuth.backupCodes })
        .from(twoFactorAuth)
        .where(eq(twoFactorAuth.userId, userId))
        .limit(1);

    if (!record) return 0;

    const codes = record.backupCodes as Array<{ hash: string; used: boolean }>;
    return codes.filter((c) => !c.used).length;
}
