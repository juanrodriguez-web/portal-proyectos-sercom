import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/types";

// Cliente Supabase autenticado como el usuario de la request (respeta RLS).
// Usar en Server Components, Server Actions y Route Handlers.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Puede fallar si se llama desde un Server Component sin
          // proxy.ts refrescando la sesion; es seguro ignorarlo aqui
          // porque el refresco real ocurre en proxy.ts.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // no-op
          }
        },
      },
    }
  );
}
