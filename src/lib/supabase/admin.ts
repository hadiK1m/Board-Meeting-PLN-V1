// src/lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with the service role key for admin operations
export function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}
