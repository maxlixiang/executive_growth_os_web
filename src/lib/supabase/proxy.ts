import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const env = getSupabaseEnv();
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  const isLogin = request.nextUrl.pathname === "/login";
  if (!data?.claims && !isLogin) {
    const url = request.nextUrl.clone(); url.pathname = "/login"; return NextResponse.redirect(url);
  }
  if (data?.claims && isLogin) {
    const url = request.nextUrl.clone(); url.pathname = "/"; return NextResponse.redirect(url);
  }
  return response;
}
