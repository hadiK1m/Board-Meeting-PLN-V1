// src/db/migrate.ts
import "dotenv/config"; // Load env vars sebelum file lain di-import
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "@/lib/db";

async function main() {
    console.log("⏳ Memulai proses migrasi...");

    // Menjalankan migrasi menggunakan folder 'drizzle' 
    // (Folder ini akan dibuat oleh perintah 'drizzle-kit generate')
    await migrate(db, { migrationsFolder: "drizzle" });

    console.log("✅ Migrasi selesai!");
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Terjadi kesalahan saat migrasi:", err);
    process.exit(1);
});
