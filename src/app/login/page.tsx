import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function signInWithEmail(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  redirect(`/login?sent=${encodeURIComponent(email)}`);
}

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { sent } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-md border border-border bg-surface p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold">Gestor de Proyectos</h1>
        <p className="mb-6 text-sm text-ink-soft">SERCOM · Vodafone</p>

        {sent ? (
          <p className="text-sm text-ink-soft">
            Te hemos enviado un enlace de acceso a <strong>{sent}</strong>.
            Revisa tu correo.
          </p>
        ) : (
          <form action={signInWithEmail} className="flex flex-col gap-3">
            <label className="text-sm text-ink-soft" htmlFor="email">
              Correo corporativo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="nombre@empresa.com"
              className="rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="mt-2 rounded-sm bg-brand px-3 py-2 text-sm font-semibold text-white"
            >
              Enviar enlace de acceso
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
