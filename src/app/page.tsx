import { getCurrentProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Placeholder minimo: confirma que proxy.ts + DAL + RLS estan
// conectados de extremo a extremo. El Dashboard / Control Tower real
// (spec seccion 14) es trabajo de UI pendiente.
export default async function Home() {
  const profile = await getCurrentProfile();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4 text-center">
      <h1 className="text-2xl font-semibold">
        Hola, {profile.full_name ?? profile.email}
      </h1>
      <p className="max-w-md text-sm text-ink-soft">
        Sesion activa. Sin organizacion asignada todavia no veras ningun
        proyecto (acceso cero por defecto, spec 4.1) hasta que un ADMIN te
        incluya en <code className="mono">organization_members</code>.
      </p>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-sm border border-border px-3 py-2 text-sm"
        >
          Cerrar sesion
        </button>
      </form>
    </main>
  );
}
