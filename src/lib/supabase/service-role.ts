import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Cliente con service role: SALTA el RLS por completo.
// Solo para operaciones server-side que ya han pasado su propia
// comprobacion de autorizacion (p.ej. registrar metadatos de un
// adjunto tras subirlo a Google Drive, bootstrap del primer ADMIN
// de una organizacion). Nunca importar desde codigo que se ejecute
// en el cliente ni exponer esta clave via NEXT_PUBLIC_*.
export function createServiceRoleClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
