"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function logoutAction() {
    const supabase = await createClient();

    // 1. Hapus sesi di server Supabase
    await supabase.auth.signOut();

    // 2. Redirect ke halaman login
    // (Next.js akan otomatis membersihkan cache rute yang terproteksi)
    redirect("/login");
}