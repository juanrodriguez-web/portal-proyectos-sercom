import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Cliente con service role: SALTA el RLS por completo.
// Solo para operaciones server-side que ya han pasado su propia
// comprobacion de autorizacion (p.ej. registrar metadatos de un
// adjunto tras subirlo a Google Drive, bootstrap del primer ADMIN
// de una organizacion). Nunca importar desde codigo que se ejecute
// en el cliente ni exponer esta clave via NEXT_PUBLIC_*.
//
// fetchTimeoutMs: aborta de verdad la peticion HTTP subyacente pasado
// ese tiempo (via AbortController), no solo deja de esperarla. Sin
// esto, un Promise.race a nivel de aplicacion "abandona" la promesa
// pero el fetch sigue vivo en el servidor hasta su propio timeout
// (p.ej. GoTrue tarda ~35s en devolver 504 si el SMTP no responde),
// lo que puede chocar con el limite de duracion de la funcion
// serverless y cortar la respuesta a medias.
export function createServiceRoleClient(options?: { fetchTimeoutMs?: number }) {
  const fetchTimeoutMs = options?.fetchTimeoutMs;

  const timeoutFetch: typeof fetch | undefined = fetchTimeoutMs
    ? (input, init) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), fetchTimeoutMs);
        return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
      }
    : undefined;

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      ...(timeoutFetch ? { global: { fetch: timeoutFetch } } : {}),
    }
  );
}
