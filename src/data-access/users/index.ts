// src/data-access/user/index.ts
import { db } from "@/db"; // Asumsi koneksi db ada di sini
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Fungsi untuk mengambil user berdasarkan ID
export async function getUserById(userId: string) {
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return result[0] || null;
}

// Fungsi untuk mengambil user berdasarkan Email
export async function getUserByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
}
