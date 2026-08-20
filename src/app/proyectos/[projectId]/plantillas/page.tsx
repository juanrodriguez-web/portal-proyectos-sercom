import { getProject } from "@/lib/queries/projects";
import { listTemplates } from "@/lib/queries/templates";
import { getProjectRole } from "@/lib/dal";
import { addTemplateTask } from "@/lib/actions/templates";
import { ROLE_LABEL, ASSIGNABLE_ROLES } from "@/lib/roles";

const GATES = ["", "READY_FOR_INSTALL", "PENDING_VALIDATION", "OPERATIVE"] as const;

export default async function PlantillasPage({
  params,
}: PageProps<"/proyectos/[projectId]/plantillas">) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) return null;

  const [role, templates] = await Promise.all([
    getProjectRole(projectId),
    listTemplates(project.organization_id),
  ]);
  const isAdmin = role === "ADMIN";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Plantillas</h1>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          Una tarea nueva se aplica a la versión activa y se instancia automáticamente en
          las unidades <strong>abiertas</strong> del proyecto (no toca unidades ya operativas
          o canceladas — spec sección 7).
        </p>
      </div>

      {templates.length === 0 && (
        <div className="rounded-md border p-5 text-sm" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--ink-faint)" }}>
          No hay plantillas en esta organización todavía.
        </div>
      )}

      {templates.map((template) => {
        const activeVersion = template.template_versions.find((v) => v.is_active) ?? template.template_versions[0];
        if (!activeVersion) return null;

        return (
          <section key={template.id} className="rounded-md border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-sm font-semibold">
                {template.name} <span style={{ color: "var(--ink-faint)" }}>· {activeVersion.version_label}</span>
              </h2>
              {template.description && (
                <p className="mt-0.5 text-xs" style={{ color: "var(--ink-faint)" }}>{template.description}</p>
              )}
            </div>

            {activeVersion.template_phases
              .sort((a, b) => a.order_index - b.order_index)
              .map((phase) => (
                <div key={phase.id} className="border-t px-4 py-3" style={{ borderColor: "var(--border)" }}>
                  <h3 className="mb-2 text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--ink-faint)" }}>
                    {phase.name} · {phase.template_tasks.length} tareas
                  </h3>
                  <ul className="flex flex-col gap-1">
                    {phase.template_tasks.map((task) => (
                      <li key={task.id} className="flex items-center gap-2 text-sm">
                        <span style={{ color: task.is_mandatory ? "var(--ink)" : "var(--ink-faint)" }}>{task.title}</span>
                        {task.default_assignee_role && (
                          <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: "var(--surface-2)", color: "var(--ink-faint)" }}>
                            {ROLE_LABEL[task.default_assignee_role]}
                          </span>
                        )}
                        {task.requires_evidence && <span title="Requiere evidencia">📷</span>}
                        {task.gate && (
                          <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}>
                            {task.gate}
                          </span>
                        )}
                        {task.relative_day_offset !== null && (
                          <span className="font-mono text-[10.5px]" style={{ color: "var(--ink-faint)" }}>
                            T{task.relative_day_offset >= 0 ? "+" : ""}{task.relative_day_offset}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  {isAdmin && (
                    <form
                      action={async (formData: FormData) => {
                        "use server";
                        const title = String(formData.get("title") ?? "").trim();
                        if (!title) return;
                        const isMandatory = formData.get("is_mandatory") === "on";
                        const gate = String(formData.get("gate") ?? "") || null;
                        const requiresEvidence = formData.get("requires_evidence") === "on";
                        const offsetRaw = String(formData.get("relative_day_offset") ?? "");
                        const relativeDayOffset = offsetRaw === "" ? null : Number(offsetRaw);
                        const role = String(formData.get("default_assignee_role") ?? "") || null;
                        await addTemplateTask(
                          projectId,
                          phase.id,
                          title,
                          isMandatory,
                          gate,
                          requiresEvidence,
                          relativeDayOffset,
                          role as (typeof ASSIGNABLE_ROLES)[number] | null
                        );
                      }}
                      className="mt-3 flex flex-wrap items-end gap-2 border-t pt-3 text-xs"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <input
                        name="title"
                        required
                        placeholder="Nueva tarea…"
                        className="min-w-[180px] flex-1 rounded-sm border px-2 py-1"
                        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                      />
                      <select name="default_assignee_role" defaultValue="" className="rounded-sm border px-2 py-1" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                        <option value="">Rol por defecto…</option>
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                        ))}
                      </select>
                      <select name="gate" defaultValue="" className="rounded-sm border px-2 py-1" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                        {GATES.map((g) => (
                          <option key={g} value={g}>{g || "Sin gate"}</option>
                        ))}
                      </select>
                      <input
                        name="relative_day_offset"
                        type="number"
                        placeholder="T±días"
                        className="w-20 rounded-sm border px-2 py-1"
                        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                      />
                      <label className="flex items-center gap-1">
                        <input type="checkbox" name="is_mandatory" defaultChecked /> Obligatoria
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="checkbox" name="requires_evidence" /> Evidencia
                      </label>
                      <button type="submit" className="rounded-sm px-3 py-1 font-semibold text-white" style={{ background: "var(--brand)" }}>
                        Añadir
                      </button>
                    </form>
                  )}
                </div>
              ))}
          </section>
        );
      })}
    </div>
  );
}
