// src/db/migrate-rakordir.ts
import { config } from "dotenv";
config();

import postgres from "postgres";

async function main() {
    const connectionString = process.env.DATABASE_URL!;
    const sql = postgres(connectionString);

    try {
        console.log("Applying schema changes for RAKORDIR...");

        // Check if arahan_direksi column type is text and convert to jsonb
        const result = await sql`
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'agendas_rakordir' 
            AND column_name = 'arahan_direksi'
        `;

        if (result.length > 0 && result[0]?.data_type === 'text') {
            console.log("Converting arahan_direksi from text to jsonb...");
            await sql`ALTER TABLE agendas_rakordir ALTER COLUMN arahan_direksi SET DATA TYPE jsonb USING COALESCE(arahan_direksi::jsonb, '[]'::jsonb)`;
            await sql`ALTER TABLE agendas_rakordir ALTER COLUMN arahan_direksi SET DEFAULT '[]'::jsonb`;
            console.log("Successfully converted arahan_direksi to jsonb");
        } else if (result.length > 0 && result[0]?.data_type === 'jsonb') {
            console.log("arahan_direksi column is already jsonb");
        } else {
            console.log("arahan_direksi column does not exist or has unexpected type");
        }

        console.log("Migration complete!");
    } catch (error) {
        console.error("Migration error:", error);
    } finally {
        await sql.end();
    }
}

main();
