import { listIncidentsForWorkUnit } from "@/lib/queries/incidents";
import { createIncident, updateIncidentStatus } from "@/lib/actions/incidents";
import { INCIDENT_CATEGORIES, SEVERITY_LEVELS, SEVERITY_LABEL } from "@/lib/incident-options";
import { IncidentStatusChip, RiskChip } from "@/components/ui/status-chip";
import { IncidentStatusSelect } from "@/components/ui/incident-status-select";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }).toUpperCase();
}

export default async function UnitIncidenciasPage({
  params,
}: PageProps<"/proyectos/[projectId]/unidades/[workUnitId]/incidencias">) {
  const { projectId, workUnitId } = await params;
  const incidents = await listIncidentsForWorkUnit(workUnitId);

  return (
    <div className="flex flex-col gap-4">
      <form
        action={async (formData: FormData) => {
          "use server";
          const category = String(formData.get("category"));
          const severity = formData.get("severity") as (typeof SEVERITY_LEVELS)[number];
          const description = String(formData.get("description"));
          await createIncident(projectId, workUnitId, category, severity, description);
        }}
        className="flex flex-col gap-3 rounded-md border p-4"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <select name="category" defaultValue={INCIDENT_CATEGORIES[0]} className="rounded-sm border px-2.5 py-1.5 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            {INCIDENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select name="severity" defaultValue="MEDIUM" className="rounded-sm border px-2.5 py-1.5 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            {SEVERITY_LEVELS.map((s) => <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>)}
          </select>
        </div>
        <textarea name="description" required rows={2} placeholder="Describe la incidencia…" className="rounded-sm border px-2.5 py-1.5 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)" }} />
        <button type="submit" className="self-start rounded-sm px-3 py-1.5 text-sm font-semibold text-white" style={{ background: "var(--brand)" }}>
          Crear incidencia
        </button>
      </form>

      <div className="rounded-md border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        {incidents.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm" style={{ color: "var(--ink-faint)" }}>Sin incidencias en esta unidad.</div>
        ) : (
          <ul>
            {incidents.map((inc) => (
              <li key={inc.id} className="flex flex-wrap items-center gap-3 border-t px-4 py-3 text-sm first:border-t-0" style={{ borderColor: "var(--border)" }}>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{inc.category}</div>
                  <div className="mt-0.5 text-xs" style={{ color: "var(--ink-soft)" }}>{inc.description}</div>
                </div>
                <RiskChip risk={inc.severity} />
                <IncidentStatusChip status={inc.status} />
                <IncidentStatusSelect value={inc.status} onChange={updateIncidentStatus.bind(null, projectId, inc.id)} />
                <span className="font-mono text-[11px] whitespace-nowrap" style={{ color: "var(--ink-faint)" }}>{formatDate(inc.opened_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
