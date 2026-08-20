import { listIncidents } from "@/lib/queries/incidents";
import { listWorkUnits } from "@/lib/queries/work-units";
import { createIncident, updateIncidentStatus } from "@/lib/actions/incidents";
import { INCIDENT_CATEGORIES, SEVERITY_LEVELS, SEVERITY_LABEL } from "@/lib/incident-options";
import { IncidentStatusChip, RiskChip } from "@/components/ui/status-chip";
import { IncidentStatusSelect } from "@/components/ui/incident-status-select";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }).toUpperCase();
}

export default async function IncidenciasPage({
  params,
}: PageProps<"/proyectos/[projectId]/incidencias">) {
  const { projectId } = await params;
  const [incidents, units] = await Promise.all([listIncidents(projectId), listWorkUnits(projectId)]);

  const openCount = incidents.filter((i) => i.status === "OPEN" || i.status === "IN_PROGRESS").length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Incidencias</h1>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          {openCount} abiertas de {incidents.length} en total.
        </p>
      </div>

      <section className="rounded-md border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold">Nueva incidencia</h2>
        </div>
        <form
          action={async (formData: FormData) => {
            "use server";
            const workUnitId = String(formData.get("work_unit_id"));
            const category = String(formData.get("category"));
            const severity = formData.get("severity") as (typeof SEVERITY_LEVELS)[number];
            const description = String(formData.get("description"));
            await createIncident(projectId, workUnitId, category, severity, description);
          }}
          className="flex flex-col gap-3 p-4"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              name="work_unit_id"
              required
              className="rounded-sm border px-2.5 py-1.5 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <option value="">PDV…</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
              ))}
            </select>
            <select
              name="category"
              defaultValue={INCIDENT_CATEGORIES[0]}
              className="rounded-sm border px-2.5 py-1.5 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              {INCIDENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              name="severity"
              defaultValue="MEDIUM"
              className="rounded-sm border px-2.5 py-1.5 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              {SEVERITY_LEVELS.map((s) => (
                <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <textarea
            name="description"
            required
            rows={2}
            placeholder="Describe la incidencia…"
            className="rounded-sm border px-2.5 py-1.5 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          />
          <button
            type="submit"
            className="self-start rounded-sm px-3 py-1.5 text-sm font-semibold text-white"
            style={{ background: "var(--brand)" }}
          >
            Crear incidencia
          </button>
        </form>
      </section>

      <section className="rounded-md border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        {incidents.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm" style={{ color: "var(--ink-faint)" }}>
            No hay incidencias registradas todavía.
          </div>
        ) : (
          <ul>
            {incidents.map((inc) => (
              <li
                key={inc.id}
                className="flex flex-wrap items-center gap-3 border-t px-4 py-3 text-sm first:border-t-0"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {inc.work_units?.name} ({inc.work_units?.code}) · {inc.category}
                  </div>
                  <div className="mt-0.5 text-xs" style={{ color: "var(--ink-soft)" }}>{inc.description}</div>
                </div>
                <RiskChip risk={inc.severity} />
                <IncidentStatusChip status={inc.status} />
                <IncidentStatusSelect value={inc.status} onChange={updateIncidentStatus.bind(null, projectId, inc.id)} />
                <span className="font-mono text-[11px] whitespace-nowrap" style={{ color: "var(--ink-faint)" }}>
                  {formatDate(inc.opened_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
