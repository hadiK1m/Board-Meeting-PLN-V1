import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env' });

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL tidak ditemukan di .env. Pastikan file .env ada dan berisi DATABASE_URL.");
}

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
    schemaFilter: ["public"],
});
