import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";

export type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "CANCELLED";

export type Task = {
  id: string;
  work_unit_phase_id: string;
  title: string;
  status: TaskStatus;
  is_mandatory: boolean;
  gate: string | null;
  requires_evidence: boolean;
  due_at: string | null;
  assignee_id: string | null;
};

export type Phase = {
  id: string;
  name: string;
  order_index: number;
  tasks: Task[];
};

// RLS filtra tasks/work_unit_phases por has_work_unit_access igual que
// el resto de queries: sin acceso a la unidad, esto devuelve vacio.
export async function listChecklist(workUnitId: string): Promise<Phase[]> {
  await getSession();
  const supabase = await createClient();

  const { data: phases, error: phasesError } = await supabase
    .from("work_unit_phases")
    .select("id, name, order_index")
    .eq("work_unit_id", workUnitId)
    .order("order_index", { ascending: true });
  if (phasesError) throw phasesError;
  if (!phases || phases.length === 0) return [];

  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, work_unit_phase_id, title, status, is_mandatory, gate, requires_evidence, due_at, assignee_id")
    .eq("work_unit_id", workUnitId)
    .order("due_at", { ascending: true, nullsFirst: false });
  if (tasksError) throw tasksError;

  return phases.map((phase) => ({
    ...phase,
    tasks: (tasks ?? []).filter((t) => t.work_unit_phase_id === phase.id),
  }));
}

export type ChecklistProgress = { done: number; total: number };

// Progreso de checklist por unidad, para la columna "Progreso" del
// listado. Una sola query (via el join embebido de PostgREST) en vez de
// N+1 por unidad.
export async function getChecklistProgressByProject(
  projectId: string
): Promise<Record<string, ChecklistProgress>> {
  await getSession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("work_unit_id, status, work_units!inner(project_id)")
    .eq("work_units.project_id", projectId);
  if (error) throw error;

  const progress: Record<string, ChecklistProgress> = {};
  for (const row of data ?? []) {
    const key = row.work_unit_id as string;
    if (!progress[key]) progress[key] = { done: 0, total: 0 };
    progress[key].total += 1;
    if (row.status === "DONE") progress[key].done += 1;
  }
  return progress;
}
