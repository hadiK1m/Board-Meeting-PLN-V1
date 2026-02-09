/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { loginSchema, type LoginInput } from "@/schemas/auth/login";
import { createClient } from "@/lib/supabase/server";
import { ActionState } from "@/types/actions";

export async function loginAction(
    data: LoginInput
): Promise<ActionState<LoginInput, { userId: string }>> {
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