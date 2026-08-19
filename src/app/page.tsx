import { redirect } from "next/navigation";
import Link from "next/link";
import { listAccessibleProjects } from "@/lib/queries/projects";
import { getCurrentProfile } from "@/lib/dal";
import { signOut } from "@/lib/actions/auth";

export default async function Home() {
  const [projects, profile] = await Promise.all([
    listAccessibleProjects(),
    getCurrentProfile(),
  ]);

  if (projects.length === 1) {
    redirect(`/proyectos/${projects[0].id}`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-16" style={{ background: "var(--paper)" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Proyectos</h1>
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            Hola, {profile.full_name ?? profile.email}
          </p>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-xs" style={{ color: "var(--ink-faint)" }}>
            Salir
          </button>
        </form>
      </div>

      {projects.length === 0 ? (
        <p className="rounded-md border p-4 text-sm" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--ink-soft)" }}>
          No tienes acceso a ningún proyecto todavía (acceso cero por
          defecto). Pide a un ADMIN que te incluya en un proyecto.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/proyectos/${p.id}`}
                className="block rounded-md border p-4 hover:bg-[var(--surface-2)]"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="font-semibold">{p.name}</div>
                {p.description && (
                  <div className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>{p.description}</div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
