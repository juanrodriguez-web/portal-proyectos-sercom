import Link from "next/link";
import { getProject } from "@/lib/queries/projects";
import { listWorkUnits, summarizeWorkUnits } from "@/lib/queries/work-units";
import { StatusChip, RiskChip } from "@/components/ui/status-chip";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }).toUpperCase();
}

export default async function ProjectDashboardPage({
  params,
}: PageProps<"/proyectos/[projectId]">) {
  const { projectId } = await params;
  const [project, units] = await Promise.all([
    getProject(projectId),
    listWorkUnits(projectId),
  ]);

  const summary = summarizeWorkUnits(units);

  // Próximas instalaciones sin fecha confirmada aun no cuentan como
  // "orden de urgencia" real; mostramos las que sí tienen fecha, en orden.
  const upcoming = units
    .filter((u) => u.installation_planned_at && u.status !== "OPERATIVE")
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Control Tower</h1>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          {project
            ? `Objetivo ${summary.objetivo} kioscos operativos${
                project.deadline_at ? ` antes del ${formatDate(project.deadline_at)}` : ""
              }.`
            : ""}
        </p>
      </div>

      <div
        className="grid gap-3 rounded-md border p-5 sm:grid-cols-2"
        style={{ background: "var(--surface)", borderColor: "var(--border)", borderLeft: "3px solid var(--accent)" }}
      >
        <div>
          <div className="mb-1 font-mono text-xs tracking-wide uppercase" style={{ color: "var(--ink-faint)" }}>
            Progreso hacia el objetivo
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-semibold tabular-nums">{summary.operativos}</span>
            <span className="text-sm" style={{ color: "var(--ink-faint)" }}>/ {summary.objetivo} operativos</span>
          </div>
          <div className="mt-2 text-sm" style={{ color: "var(--ink-soft)" }}>
            {summary.pctCompletado}% completado
          </div>
        </div>
        <div>
          <div className="mb-1 font-mono text-xs tracking-wide uppercase" style={{ color: "var(--ink-faint)" }}>
            Forecast al deadline
          </div>
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            {project?.deadline_at
              ? "Motor de forecast pendiente de implementar (spec sección 15)."
              : "Este proyecto no tiene fecha límite definida todavía — sin deadline no hay forecast que calcular."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Objetivo" value={summary.objetivo} />
        <Kpi label="Operativos" value={summary.operativos} color="var(--st-op-i)" />
        <Kpi label="Ready" value={summary.readyForInstall} color="var(--st-ready-i)" />
        <Kpi label="Not Ready" value={summary.notReady} />
        <Kpi label="Riesgo alto/crítico" value={summary.highOrCriticalRisk} color="var(--rk-crit-i)" />
        <Kpi label="Incidencias abiertas" value={0} />
      </div>

      <div className="rounded-md border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold">Próximas instalaciones</h2>
          <Link href={`/proyectos/${projectId}/unidades`} className="text-xs" style={{ color: "var(--accent-ink)" }}>
            Ver todas las unidades →
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs" style={{ color: "var(--ink-faint)" }}>
              <Th>PDV</Th>
              <Th>Estado</Th>
              <Th>Riesgo</Th>
              <Th>Instalación</Th>
            </tr>
          </thead>
          <tbody>
            {upcoming.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm" style={{ color: "var(--ink-faint)" }}>
                  No hay unidades con fecha de instalación prevista todavía.
                </td>
              </tr>
            )}
            {upcoming.map((u) => (
              <tr key={u.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                <Td>
                  <Link href={`/proyectos/${projectId}/unidades/${u.id}`} className="font-medium" style={{ color: "var(--ink)" }}>
                    {u.name}
                  </Link>
                </Td>
                <Td><StatusChip status={u.status} /></Td>
                <Td><RiskChip risk={u.risk_level} /></Td>
                <Td className="font-mono">{formatDate(u.installation_planned_at)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-sm border p-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="font-mono text-xl font-semibold tabular-nums" style={color ? { color } : undefined}>
        {value}
      </div>
      <div className="mt-0.5 text-[10.5px] tracking-wide uppercase" style={{ color: "var(--ink-faint)" }}>
        {label}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2 font-normal">{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2.5 ${className ?? ""}`}>{children}</td>;
}
