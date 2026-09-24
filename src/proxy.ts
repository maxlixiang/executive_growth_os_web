import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // W1 can render the visual shell before the independent Supabase project exists.
  // Production always fails closed: missing auth configuration never exposes the app.
  if (!hasSupabaseEnv()) {
    if (process.env.NODE_ENV === "development" || request.nextUrl.pathname === "/login") return;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
