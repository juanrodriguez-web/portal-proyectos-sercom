import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Intercambia el codigo del magic link por una sesion (cookies httpOnly
// gestionadas por @supabase/ssr). Ver spec 23: "Autenticacion por email".
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    // Sin log aqui antes fallaba en silencio: no habia forma de saber si
    // el fallo era "codigo ya usado" (link pre-visitado por el escaner
    // de un cliente de correo), "codigo caducado" u otra cosa.
    console.error("[auth/callback] exchangeCodeForSession failed:", error.code, error.message);
    return NextResponse.redirect(`${origin}/login?auth_error=${encodeURIComponent(error.code ?? error.message)}`);
  }

  if (searchParams.get("error")) {
    console.error(
      "[auth/callback] Supabase redirected with an error:",
      searchParams.get("error"),
      searchParams.get("error_description")
    );
  }

  return NextResponse.redirect(`${origin}/login`);
}
