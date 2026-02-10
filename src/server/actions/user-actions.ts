// src/server/actions/user-actions.ts
"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UserData {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isActive: boolean;
    createdAt: Date | null;
    lastSignIn?: string | null;
}

export interface CurrentUserData {
    id: string;
    fullName: string;
    email: string;
    role: string;
    initials: string;
}

/**
 * Get current authenticated user data from database
 */
export async function getCurrentUser(): Promise<CurrentUserData | null> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return null;
        }

        // Get user data from database
        const [userData] = await db
            .select({
                id: users.id,
                fullName: users.fullName,
                email: users.email,
                role: users.role,
            })
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);

        if (!userData) {
            return null;
        }

        // Generate initials from full name
        const initials = userData.fullName
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

        return {
            ...userData,
            role: userData.role || 'User',
            initials,
        };
    } catch (error) {
        console.error('Error fetching current user:', error);
        return null;
    }
}

// Get all users (combine Supabase Auth + local DB)
export async function getAllUsers(): Promise<UserData[]> {
    try {
        const supabaseAdmin = createAdminClient();

        // Get users from Supabase Auth
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

        if (authError) {
            console.error("Error fetching auth users:", authError);
            throw new Error("Gagal mengambil data users dari auth");
        }

        // Get users from local DB
        const dbUsers = await db.select().from(users);
        const dbUserMap = new Map(dbUsers.map((u) => [u.id, u]));

        // Merge data
        const mergedUsers: UserData[] = authUsers.users.map((authUser) => {
            const dbUser = dbUserMap.get(authUser.id);
            return {
                id: authUser.id,
                email: authUser.email || "",
                fullName: dbUser?.fullName || authUser.user_metadata?.full_name || "Unknown",
                role: dbUser?.role || "user",
                isActive: dbUser?.isActive ?? true,
                createdAt: dbUser?.createdAt || new Date(authUser.created_at),
                lastSignIn: authUser.last_sign_in_at || null,
            };
        });

        return mergedUsers;
    } catch (error) {
        console.error("Error getAllUsers:", error);
        throw error;
    }
}

// Create a new user
export async function createUserAction(data: {
    email: string;
    password: string;
    fullName: string;
    role: string;
}): Promise<{ success: boolean; error?: string; userId?: string }> {
    try {
        const supabaseAdmin = createAdminClient();

        // 1. Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: data.fullName,
            },
        });

        if (authError) {
            console.error("Error creating auth user:", authError);
            return { success: false, error: authError.message };
        }

        if (!authData.user) {
            return { success: false, error: "Gagal membuat user" };
        }

        // 2. Create user in local DB
        await db.insert(users).values({
            id: authData.user.id,
            email: data.email,
            fullName: data.fullName,
            role: data.role,
            isActive: true,
        });

        revalidatePath("/dashboard/users");
        return { success: true, userId: authData.user.id };
    } catch (error) {
        console.error("Error createUserAction:", error);
        return { success: false, error: "Terjadi kesalahan saat membuat user" };
    }
}

// Update user
export async function updateUserAction(
    userId: string,
    data: {
        fullName?: string;
        email?: string;
        role?: string;
        isActive?: boolean;
        password?: string; // Optional: update password
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabaseAdmin = createAdminClient();

        // 1. Update Supabase Auth if email or password changed
        const authUpdates: {
            email?: string;
            password?: string;
            user_metadata?: { full_name?: string };
        } = {};

        if (data.email) authUpdates.email = data.email;
        if (data.password) authUpdates.password = data.password;
        if (data.fullName) authUpdates.user_metadata = { full_name: data.fullName };

        if (Object.keys(authUpdates).length > 0) {
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                authUpdates
            );

            if (authError) {
                console.error("Error updating auth user:", authError);
                return { success: false, error: authError.message };
            }
        }

        // 2. Update local DB
        const dbUpdates: Partial<{
            fullName: string;
            email: string;
            role: string;
            isActive: boolean;
        }> = {};

        if (data.fullName) dbUpdates.fullName = data.fullName;
        if (data.email) dbUpdates.email = data.email;
        if (data.role) dbUpdates.role = data.role;
        if (data.isActive !== undefined) dbUpdates.isActive = data.isActive;

        if (Object.keys(dbUpdates).length > 0) {
            await db.update(users).set(dbUpdates).where(eq(users.id, userId));
        }

        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error) {
        console.error("Error updateUserAction:", error);
        return { success: false, error: "Terjadi kesalahan saat update user" };
    }
}

// Delete user
export async function deleteUserAction(
    userId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabaseAdmin = createAdminClient();

        // 1. Delete from Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
            console.error("Error deleting auth user:", authError);
            return { success: false, error: authError.message };
        }

        // 2. Delete from local DB
        await db.delete(users).where(eq(users.id, userId));

        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error) {
        console.error("Error deleteUserAction:", error);
        return { success: false, error: "Terjadi kesalahan saat menghapus user" };
    }
}

// Toggle user active status
export async function toggleUserStatusAction(
    userId: string,
    isActive: boolean
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabaseAdmin = createAdminClient();

        // Ban/unban user in Supabase Auth
        if (isActive) {
            // Unban
            const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                ban_duration: "none",
            });
            if (error) {
                return { success: false, error: error.message };
            }
        } else {
            // Ban indefinitely
            const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                ban_duration: "876600h", // ~100 years
            });
            if (error) {
                return { success: false, error: error.message };
            }
        }

        // Update local DB
        await db.update(users).set({ isActive }).where(eq(users.id, userId));

        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error) {
        console.error("Error toggleUserStatusAction:", error);
        return { success: false, error: "Terjadi kesalahan" };
    }
}

// Reset user password
export async function resetPasswordAction(
    userId: string,
    newPassword: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabaseAdmin = createAdminClient();

        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: newPassword,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error("Error resetPasswordAction:", error);
        return { success: false, error: "Terjadi kesalahan" };
    }
}
