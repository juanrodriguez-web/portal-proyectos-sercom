"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

// Consume el flujo "implicit" de Supabase (tokens en el fragmento de la
// URL: #access_token=...&refresh_token=...), que solo puede leerse en
// el navegador - un Route Handler nunca ve el fragmento, por eso
// /auth/callback (pensado para el flujo PKCE con ?code=... de los
// magic links normales) no sirve aqui.
//
// Se usa para los enlaces generados via supabase.auth.admin.generateLink()
// (login directo sin depender de que llegue un email, util para probar
// distintos roles) - GoTrue genera esos enlaces en formato implicit
// porque no hay un "cliente" que haya creado un code_verifier de PKCE
// de antemano.
export default function AuthTokenPage() {
  useEffect(() => {
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    const params = new URLSearchParams(hash);

    const authError = params.get("error_description") ?? params.get("error");
    if (authError) {
      window.location.replace(`/login?auth_error=${encodeURIComponent(authError)}`);
      return;
    }

    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token) {
      window.location.replace("/login?auth_error=" + encodeURIComponent("Enlace incompleto o ya usado. Pide uno nuevo."));
      return;
    }

    const supabase = createClient();
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error: setError }) => {
      window.location.replace(setError ? `/login?auth_error=${encodeURIComponent(setError.message)}` : "/");
    });
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-md border border-border bg-surface p-8 text-center shadow-sm">
        <p className="text-sm text-ink-soft">Entrando…</p>
      </div>
    </main>
  );
}
