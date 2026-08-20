import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";
import type { TaskStatus } from "@/lib/queries/tasks";

export type MyTask = {
  id: string;
  title: string;
  status: TaskStatus;
  gate: string | null;
  due_at: string | null;
  work_unit_id: string;
  work_units: {
    name: string;
    code: string;
    project_id: string;
    projects: { name: string } | null;
  } | null;
  work_unit_phases: { name: string } | null;
};

// RLS filtra por has_work_unit_access ademas del assignee_id: aunque
// alguien fuese asignado por error a una tarea de una unidad a la que
// ya no tiene acceso, no aparece aqui.
export async function listMyTasks(): Promise<MyTask[]> {
  const user = await getSession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, title, status, gate, due_at, work_unit_id, work_unit_phases(name), work_units(name, code, project_id, projects(name))"
    )
    .eq("assignee_id", user.id)
    .neq("status", "DONE")
    .neq("status", "CANCELLED")
    .order("due_at", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data ?? []) as unknown as MyTask[];
}
