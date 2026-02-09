// src/db/reset.ts
import "dotenv/config";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function reset() {
    console.log("🗑️  Sedang mengosongkan database...");

    // Hapus tabel secara berurutan (Child dulu baru Parent) untuk menghindari error Foreign Key
    await db.execute(sql`DROP TABLE IF EXISTS "agendas_radir" CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS "agendas_rakordir" CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS "agendas_kepdir_sirkuler" CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS "agendas" CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS "users" CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS "organizational_units" CASCADE`);

    // Hapus history migrasi agar bersih
    await db.execute(sql`DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE`);

    console.log("✅ Database berhasil dikosongkan.");
    process.exit(0);
}

reset().catch((e) => {
    console.error("❌ Gagal reset database:", e);
    process.exit(1);
});
