import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    // 1. Inisialisasi Response awal
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    // --- FIX: Hapus 'options' di sini karena tidak dipakai ---
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );

                    response = NextResponse.next({
                        request,
                    });

                    // --- Di sini 'options' TETAP DIPAKAI untuk browser ---
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // 2. Security Check (getUser)
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 3. Proteksi Rute
    const path = request.nextUrl.pathname;

    // A. Belum Login -> Akses Dashboard -> Redirect Login
    if (!user && path.startsWith("/dashboard")) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", path);
        return NextResponse.redirect(url);
    }

    // B. Sudah Login -> Akses Login -> Redirect Dashboard
    if (user && (path === "/login" || path === "/")) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    return response;
}