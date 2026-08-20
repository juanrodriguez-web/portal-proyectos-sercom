import Link from "next/link";
import { listMyTasks } from "@/lib/queries/my-tasks";
import { getCurrentProfile } from "@/lib/dal";
import { SimpleHeader } from "@/components/nav/simple-header";

type Filter = "hoy" | "vencidas" | "semana" | "bloqueadas" | "todas";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function inNextDays(dateISO: string, days: number) {
  const target = new Date(dateISO);
  const now = new Date();
  const limit = new Date(now);
  limit.setDate(limit.getDate() + days);
  return target >= new Date(now.toDateString()) && target <= limit;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }).toUpperCase();
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "hoy", label: "Hoy" },
  { key: "vencidas", label: "Vencidas" },
  { key: "semana", label: "Esta semana" },
  { key: "bloqueadas", label: "Bloqueadas" },
];

export default async function MisTareasPage({
  searchParams,
}: PageProps<"/mis-tareas">) {
  const { filter: filterParam } = await searchParams;
  const filter = (Array.isArray(filterParam) ? filterParam[0] : filterParam) as Filter | undefined;
  const activeFilter: Filter = filter && FILTERS.some((f) => f.key === filter) ? filter : "todas";

  const [profile, tasks] = await Promise.all([getCurrentProfile(), listMyTasks()]);
  const today = todayISO();

  const filtered = tasks.filter((t) => {
    switch (activeFilter) {
      case "hoy":
        return t.due_at === today;
      case "vencidas":
        return t.due_at !== null && t.due_at < today;
      case "semana":
        return t.due_at !== null && inNextDays(t.due_at, 7);
      case "bloqueadas":
        return t.status === "BLOCKED";
      default:
        return true;
    }
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--paper)" }}>
      <SimpleHeader userLabel={profile.full_name ?? profile.email} />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Mis tareas</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
          Solo tareas que tienes asignadas a ti, en unidades a las que tienes acceso.
        </p>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.key === "todas" ? "/mis-tareas" : `/mis-tareas?filter=${f.key}`}
              className="rounded-full px-3 py-1.5 text-xs font-medium"
              style={
                activeFilter === f.key
                  ? { background: "var(--accent)", color: "var(--brand-ink)" }
                  : { background: "var(--surface-2)", color: "var(--ink-soft)" }
              }
            >
              {f.label}
            </Link>
          ))}
        </div>

        <div className="mt-4 rounded-md border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm" style={{ color: "var(--ink-faint)" }}>
              No tienes tareas pendientes en este filtro.
            </div>
          ) : (
            <ul>
              {filtered.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 border-t px-4 py-3 text-sm first:border-t-0"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/proyectos/${t.work_units?.project_id}/unidades/${t.work_unit_id}/checklist`}
                      className="font-medium hover:underline"
                    >
                      {t.title}
                    </Link>
                    <div className="mt-0.5 text-xs" style={{ color: "var(--ink-faint)" }}>
                      {t.work_units?.projects?.name} · {t.work_units?.name} ({t.work_units?.code}) · {t.work_unit_phases?.name}
                    </div>
                  </div>
                  {t.gate && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                      style={{ background: "var(--surface-2)", color: "var(--ink-faint)" }}
                    >
                      {t.gate}
                    </span>
                  )}
                  <span
                    className="font-mono text-[11px] whitespace-nowrap"
                    style={
                      t.due_at && t.due_at < today
                        ? { color: "var(--red)", fontWeight: 600 }
                        : { color: "var(--ink-faint)" }
                    }
                  >
                    {formatDate(t.due_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
