import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Branded Type untuk Session / User ID
export type UserId = string & { readonly __brand: "UserId" };