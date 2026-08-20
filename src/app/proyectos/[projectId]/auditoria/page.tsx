import { listAuditEvents, summarizeChange } from "@/lib/queries/audit";
import { getProjectRole } from "@/lib/dal";

const ENTITY_LABEL: Record<string, string> = {
  work_units: "Unidad",
  tasks: "Tarea",
  incidents: "Incidencia",
  attachments: "Evidencia",
};

const ACTION_LABEL: Record<string, string> = {
  INSERT: "Creado",
  UPDATE: "Actualizado",
  DELETE: "Eliminado",
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AuditoriaPage({
  params,
}: PageProps<"/proyectos/[projectId]/auditoria">) {
  const { projectId } = await params;
  const role = await getProjectRole(projectId);

  if (role !== "ADMIN") {
    return (
      <div className="rounded-md border p-5 text-sm" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--ink-faint)" }}>
        Solo un ADMIN puede consultar la auditoría completa (spec 4.1).
      </div>
    );
  }

  const events = await listAuditEvents(projectId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Auditoría</h1>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          Registro append-only, generado por triggers de servidor — no depende del frontend.
        </p>
      </div>

      <div className="rounded-md border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        {events.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm" style={{ color: "var(--ink-faint)" }}>
            Todavía no hay eventos de auditoría en este proyecto.
          </div>
        ) : (
          <ul>
            {events.map((e) => {
              const change = summarizeChange(e);
              return (
                <li
                  key={e.id}
                  className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t px-4 py-2.5 text-sm first:border-t-0"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span className="font-mono text-[11px]" style={{ color: "var(--ink-faint)" }}>
                    {formatDateTime(e.created_at)}
                  </span>
                  <span className="font-medium">{e.actor_name_snapshot ?? e.actor_email_snapshot ?? "Sistema"}</span>
                  <span style={{ color: "var(--ink-soft)" }}>
                    {ACTION_LABEL[e.action] ?? e.action} {ENTITY_LABEL[e.entity_type] ?? e.entity_type}
                  </span>
                  {change && (
                    <span className="font-mono text-xs" style={{ color: "var(--accent-ink)" }}>
                      {change}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
