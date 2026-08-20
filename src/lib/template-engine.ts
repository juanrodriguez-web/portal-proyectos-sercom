import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Aplica la version activa de la plantilla de la organizacion a un
// conjunto de work_units recien creadas: genera work_unit_phases,
// tasks (con due_at calculado si hay installation_planned_at),
// evidence_requirements y milestones. Es la misma logica que
// supabase/migrations/20260819100400_template_instalacion_kiosco.sql
// pero reutilizable desde la app (p.ej. tras una importacion CSV).
//
// Idempotente por unidad: si una work_unit ya tiene fases, se salta.
export async function applyTemplateToWorkUnits(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  organizationId: string,
  workUnitIds: string[]
): Promise<{ applied: number; skipped: number }> {
  if (workUnitIds.length === 0) return { applied: 0, skipped: 0 };

  const { data: version, error: versionError } = await supabase
    .from("template_versions")
    .select("id, project_templates!inner(organization_id)")
    .eq("project_templates.organization_id", organizationId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (versionError) throw versionError;
  if (!version) return { applied: 0, skipped: workUnitIds.length };

  const { data: existingPhases, error: existingError } = await supabase
    .from("work_unit_phases")
    .select("work_unit_id")
    .in("work_unit_id", workUnitIds);
  if (existingError) throw existingError;
  const alreadyApplied = new Set((existingPhases ?? []).map((p) => p.work_unit_id));
  const targetIds = workUnitIds.filter((id) => !alreadyApplied.has(id));
  if (targetIds.length === 0) return { applied: 0, skipped: workUnitIds.length };

  const { data: units, error: unitsError } = await supabase
    .from("work_units")
    .select("id, installation_planned_at")
    .in("id", targetIds);
  if (unitsError) throw unitsError;

  const { data: phases, error: phasesError } = await supabase
    .from("template_phases")
    .select("id, name, order_index")
    .eq("template_version_id", version.id)
    .order("order_index", { ascending: true });
  if (phasesError) throw phasesError;
  if (!phases || phases.length === 0) return { applied: 0, skipped: workUnitIds.length };

  const { data: templateTasks, error: tasksError } = await supabase
    .from("template_tasks")
    .select("id, template_phase_id, title, is_mandatory, gate, requires_evidence, relative_day_offset")
    .in("template_phase_id", phases.map((p) => p.id));
  if (tasksError) throw tasksError;

  const { data: evidenceReqs, error: evidenceError } = await supabase
    .from("template_evidence_requirements")
    .select("template_task_id, category, min_count, instructions");
  if (evidenceError) throw evidenceError;

  // 1) Fases por unidad
  const phaseRows = (units ?? []).flatMap((u) =>
    phases.map((p) => ({ work_unit_id: u.id, template_phase_id: p.id, name: p.name, order_index: p.order_index }))
  );
  const { data: insertedPhases, error: insertPhasesError } = await supabase
    .from("work_unit_phases")
    .insert(phaseRows)
    .select("id, work_unit_id, template_phase_id");
  if (insertPhasesError) throw insertPhasesError;

  const phaseIdByUnitAndTemplate = new Map<string, string>();
  for (const p of insertedPhases ?? []) {
    phaseIdByUnitAndTemplate.set(`${p.work_unit_id}:${p.template_phase_id}`, p.id);
  }
  const plannedByUnit = new Map((units ?? []).map((u) => [u.id, u.installation_planned_at as string | null]));

  // 2) Tareas por unidad
  const taskRows = (units ?? []).flatMap((u) =>
    (templateTasks ?? []).map((tt) => {
      const phaseId = phaseIdByUnitAndTemplate.get(`${u.id}:${tt.template_phase_id}`);
      const planned = plannedByUnit.get(u.id);
      let dueAt: string | null = null;
      if (planned && tt.relative_day_offset !== null) {
        const d = new Date(planned);
        d.setDate(d.getDate() + tt.relative_day_offset);
        dueAt = d.toISOString().slice(0, 10);
      }
      return {
        work_unit_id: u.id,
        work_unit_phase_id: phaseId,
        template_task_id: tt.id,
        title: tt.title,
        is_mandatory: tt.is_mandatory,
        gate: tt.gate,
        requires_evidence: tt.requires_evidence,
        due_at: dueAt,
      };
    })
  );
  const { data: insertedTasks, error: insertTasksError } = await supabase
    .from("tasks")
    .insert(taskRows)
    .select("id, work_unit_id, template_task_id");
  if (insertTasksError) throw insertTasksError;

  // 3) Requisitos de evidencia, copiados de la plantilla a cada tarea instanciada
  if (evidenceReqs && evidenceReqs.length > 0 && insertedTasks) {
    const evidenceRows = insertedTasks.flatMap((t) =>
      evidenceReqs
        .filter((er) => er.template_task_id === t.template_task_id)
        .map((er) => ({ task_id: t.id, category: er.category, min_count: er.min_count, instructions: er.instructions }))
    );
    if (evidenceRows.length > 0) {
      const { error: evidenceInsertError } = await supabase.from("evidence_requirements").insert(evidenceRows);
      if (evidenceInsertError) throw evidenceInsertError;
    }
  }

  // 4) Hitos de Gantt, solo para unidades con fecha ancla
  const milestoneRows = (units ?? [])
    .filter((u) => u.installation_planned_at)
    .flatMap((u) => {
      const base = new Date(u.installation_planned_at as string);
      const withOffset = (days: number) => {
        const d = new Date(base);
        d.setDate(d.getDate() + days);
        return d.toISOString().slice(0, 10);
      };
      return [
        { work_unit_id: u.id, kind: "READY_FOR_INSTALL", planned_at: withOffset(-3) },
        { work_unit_id: u.id, kind: "INSTALLATION", planned_at: withOffset(0) },
        { work_unit_id: u.id, kind: "VALIDATION", planned_at: withOffset(1) },
        { work_unit_id: u.id, kind: "OPERATIVE", planned_at: withOffset(2) },
      ];
    });
  if (milestoneRows.length > 0) {
    const { error: milestoneError } = await supabase.from("milestones").upsert(milestoneRows, { onConflict: "work_unit_id,kind" });
    if (milestoneError) throw milestoneError;
  }

  return { applied: targetIds.length, skipped: workUnitIds.length - targetIds.length };
}
