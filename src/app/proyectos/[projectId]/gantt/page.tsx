import Link from "next/link";
import { listWorkUnits } from "@/lib/queries/work-units";

const STATUS_COLOR: Record<string, string> = {
  OPERATIVE: "var(--st-op-i)",
  READY_FOR_INSTALL: "var(--st-ready-i)",
  INSTALLING: "var(--st-install-i)",
  PENDING_VALIDATION: "var(--st-pending-i)",
  PLANIFICADO: "var(--st-planned-i)",
  EN_PREPARACION: "var(--st-prep-i)",
  BLOCKED: "var(--rk-crit-i)",
  CANCELLED: "var(--ink-faint)",
  ON_HOLD: "var(--ink-faint)",
};

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function pct(date: Date, rangeStart: Date, rangeEnd: Date) {
  const total = rangeEnd.getTime() - rangeStart.getTime();
  return ((date.getTime() - rangeStart.getTime()) / total) * 100;
}

export default async function GanttPage({
  params,
}: PageProps<"/proyectos/[projectId]/gantt">) {
  const { projectId } = await params;
  const units = await listWorkUnits(projectId);

  const planned = units
    .filter((u) => u.installation_planned_at !== null)
    .map((u) => ({ unit: u, install: new Date(u.installation_planned_at as string) }));
  const unplanned = units.filter((u) => u.installation_planned_at === null);

  if (planned.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Gantt</h1>
        <div
          className="rounded-md border p-5 text-sm"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--ink-faint)" }}
        >
          Ninguna de las {units.length} unidades tiene fecha de instalación prevista todavía
          — el Gantt necesita al menos una fecha ancla por unidad para dibujar la línea de tiempo.
        </div>
      </div>
    );
  }

  const rangeStart = addDays(new Date(Math.min(...planned.map((p) => p.install.getTime()))), -20);
  const rangeEnd = addDays(new Date(Math.max(...planned.map((p) => p.install.getTime()))), 3);
  const today = new Date();
  const todayPct = Math.min(100, Math.max(0, pct(today, rangeStart, rangeEnd)));

  const dateFmt = (d: Date) => d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }).toUpperCase();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Gantt</h1>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          {planned.length} de {units.length} unidades con fecha de instalación
          {unplanned.length > 0 && ` · ${unplanned.length} sin fecha (no aparecen aquí)`}.
        </p>
      </div>

      <div className="rounded-md border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between border-b px-4 py-2 font-mono text-[11px]" style={{ borderColor: "var(--border)", color: "var(--ink-faint)" }}>
          <span>{dateFmt(rangeStart)}</span>
          <span style={{ color: "var(--accent-ink)" }}>Hoy {dateFmt(today)}</span>
          <span>{dateFmt(rangeEnd)}</span>
        </div>

        <div className="relative">
          {/* Linea de "hoy" vertical, atraviesa todas las filas */}
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-px"
            style={{ left: `${todayPct}%`, background: "var(--accent)", opacity: 0.6 }}
          />

          {planned
            .sort((a, b) => a.install.getTime() - b.install.getTime())
            .map(({ unit, install }) => {
              const barStart = addDays(install, -20);
              const barEnd = addDays(install, 2);
              const left = Math.max(0, pct(barStart, rangeStart, rangeEnd));
              const right = Math.min(100, pct(barEnd, rangeStart, rangeEnd));
              const installLeft = pct(install, rangeStart, rangeEnd);

              return (
                <div key={unit.id} className="flex items-center gap-3 border-t px-4 py-2" style={{ borderColor: "var(--border)" }}>
                  <Link
                    href={`/proyectos/${projectId}/unidades/${unit.id}`}
                    className="w-40 shrink-0 truncate text-xs font-medium hover:underline"
                    title={unit.name}
                  >
                    {unit.name}
                  </Link>
                  <div className="relative h-4 flex-1">
                    <div
                      className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full"
                      style={{
                        left: `${left}%`,
                        width: `${Math.max(1, right - left)}%`,
                        background: STATUS_COLOR[unit.status] ?? "var(--ink-faint)",
                        opacity: 0.85,
                      }}
                    />
                    <div
                      className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2"
                      style={{ left: `${installLeft}%`, background: "var(--ink)" }}
                      title={`Instalación: ${dateFmt(install)}`}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {unplanned.length > 0 && (
        <details className="rounded-md border p-4 text-sm" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--ink-soft)" }}>
          <summary className="cursor-pointer font-medium">{unplanned.length} unidades sin fecha de instalación</summary>
          <ul className="mt-2 flex flex-wrap gap-2">
            {unplanned.map((u) => (
              <li key={u.id}>
                <Link href={`/proyectos/${projectId}/unidades/${u.id}`} className="rounded-full px-2.5 py-1 text-xs" style={{ background: "var(--surface-2)" }}>
                  {u.name}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
