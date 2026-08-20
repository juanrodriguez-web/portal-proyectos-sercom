"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProjectAdmin } from "@/lib/authz";
import type { AppRole } from "@/lib/queries/team";

// Alta dinamica de tarea en una plantilla (spec 7). Alcance fijo por
// ahora: se instancia en todas las unidades ABIERTAS del proyecto
// (status distinto de OPERATIVE/CANCELLED) - nunca en unidades ya
// cerradas, que es el comportamiento por defecto que pide el spec.
// La plantilla en si es compartida a nivel de organizacion, pero el
// ADMIN gestiona esto desde un proyecto concreto.
export async function addTemplateTask(
  projectId: string,
  templatePhaseId: string,
  title: string,
  isMandatory: boolean,
  gate: string | null,
  requiresEvidence: boolean,
  relativeDayOffset: number | null,
  defaultAssigneeRole: AppRole | null
) {
  await requireProjectAdmin(projectId);
  const supabase = await createClient();

  const { data: templateTask, error: insertError } = await supabase
    .from("template_tasks")
    .insert({
      template_phase_id: templatePhaseId,
      title,
      is_mandatory: isMandatory,
      gate,
      requires_evidence: requiresEvidence,
      relative_day_offset: relativeDayOffset,
      default_assignee_role: defaultAssigneeRole,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  // Unidades abiertas del proyecto que ya tienen una fase instanciada
  // para esta template_phase (es decir, que vienen de esta misma
  // plantilla/version).
  const { data: openPhases, error: phasesError } = await supabase
    .from("work_unit_phases")
    .select("id, work_unit_id, work_units!inner(project_id, status, installation_planned_at)")
    .eq("template_phase_id", templatePhaseId)
    .eq("work_units.project_id", projectId)
    .not("work_units.status", "in", "(OPERATIVE,CANCELLED)");
  if (phasesError) throw phasesError;

  type OpenPhase = {
    id: string;
    work_unit_id: string;
    work_units: { installation_planned_at: string | null } | null;
  };

  const rows = ((openPhases ?? []) as unknown as OpenPhase[]).map((p) => {
    let dueAt: string | null = null;
    const plannedAt = p.work_units?.installation_planned_at;
    if (plannedAt && relativeDayOffset !== null) {
      const d = new Date(plannedAt);
      d.setDate(d.getDate() + relativeDayOffset);
      dueAt = d.toISOString().slice(0, 10);
    }
    return {
      work_unit_id: p.work_unit_id,
      work_unit_phase_id: p.id,
      template_task_id: templateTask.id,
      title,
      is_mandatory: isMandatory,
      gate,
      requires_evidence: requiresEvidence,
      due_at: dueAt,
    };
  });

  if (rows.length > 0) {
    const { error: tasksError } = await supabase.from("tasks").insert(rows);
    if (tasksError) throw tasksError;
  }

  revalidatePath(`/proyectos/${projectId}/plantillas`);
  revalidatePath(`/proyectos/${projectId}/unidades`);
  return { appliedTo: rows.length };
}
