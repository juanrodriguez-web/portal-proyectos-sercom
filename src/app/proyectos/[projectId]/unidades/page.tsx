import Link from "next/link";
import { listWorkUnits } from "@/lib/queries/work-units";
import { getChecklistProgressByProject } from "@/lib/queries/tasks";
import { StatusChip, RiskChip } from "@/components/ui/status-chip";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }).toUpperCase();
}

export default async function WorkUnitsPage({
  params,
}: PageProps<"/proyectos/[projectId]/unidades">) {
  const { projectId } = await params;
  const [units, progressByUnit] = await Promise.all([
    listWorkUnits(projectId),
    getChecklistProgressByProject(projectId),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Unidades de trabajo</h1>
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            {units.length} PDV en este proyecto.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs" style={{ color: "var(--ink-faint)" }}>
              <Th>PDV / Unidad</Th>
              <Th>Ciudad</Th>
              <Th>Provincia</Th>
              <Th>Estado</Th>
              <Th>Riesgo</Th>
              <Th>Progreso</Th>
              <Th>Instalación prevista</Th>
              <Th>Contacto</Th>
            </tr>
          </thead>
          <tbody>
            {units.map((u) => {
              const progress = progressByUnit[u.id];
              const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : null;
              return (
                <tr key={u.id} className="border-t hover:bg-[var(--surface-2)]" style={{ borderColor: "var(--border)" }}>
                  <Td>
                    <Link href={`/proyectos/${projectId}/unidades/${u.id}`} className="block">
                      <span className="block font-medium" style={{ color: "var(--ink)" }}>{u.name}</span>
                      <span className="font-mono text-[11px]" style={{ color: "var(--ink-faint)" }}>{u.code}</span>
                    </Link>
                  </Td>
                  <Td>{u.city ?? "—"}</Td>
                  <Td>{u.province ?? "—"}</Td>
                  <Td><StatusChip status={u.status} /></Td>
                  <Td><RiskChip risk={u.risk_level} /></Td>
                  <Td>
                    {pct === null ? (
                      <span style={{ color: "var(--ink-faint)" }}>—</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                          <div className="h-full" style={{ width: `${pct}%`, background: "var(--accent)" }} />
                        </div>
                        <span className="font-mono text-[11px]" style={{ color: "var(--ink-faint)" }}>{pct}%</span>
                      </div>
                    )}
                  </Td>
                  <Td className="font-mono">{formatDate(u.installation_planned_at)}</Td>
                  <Td>{u.contact_name ?? "—"}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2 font-normal whitespace-nowrap">{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2.5 whitespace-nowrap ${className ?? ""}`}>{children}</td>;
}
