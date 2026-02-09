import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

// 1. Ambil Connection String dari .env
const connectionString = process.env.DATABASE_URL;

// 2. Validasi agar tidak error senyap
if (!connectionString) {
    throw new Error("❌ DATABASE_URL tidak ditemukan. Pastikan file .env sudah diisi.");
}

// 3. Singleton Pattern untuk Development
// Ini mencegah Next.js membuat koneksi baru setiap kali file di-save
const globalForDb = globalThis as unknown as {
    conn: postgres.Sql | undefined;
};

// Gunakan koneksi yang sudah ada (jika ada), atau buat baru
const conn = globalForDb.conn ?? postgres(connectionString, {
    prepare: false // Optimasi untuk kompatibilitas Supabase Transaction Mode
});

if (process.env.NODE_ENV !== "production") {
    globalForDb.conn = conn;
}

// 4. Export instance Drizzle yang sudah include Schema
// (Agar kita bisa pakai db.query.users.findMany...)
export const db = drizzle(conn, { schema });