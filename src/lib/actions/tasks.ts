"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";

// La autorizacion real la hace RLS (tasks_update: ADMIN/COORDINATOR/
// OPERATIONS de la unidad, o el INSTALLER asignado a esa tarea
// concreta). Este Server Action no comprueba rol por su cuenta: si el
// usuario no tiene permiso, Supabase actualiza 0 filas y lo reportamos.
export async function toggleTaskDone(
  taskId: string,
  projectId: string,
  workUnitId: string,
  done: boolean
) {
  await getSession();
  const supabase = await createClient();

  const { error, count } = await supabase
    .from("tasks")
    .update(
      {
        status: done ? "DONE" : "NOT_STARTED",
        completed_at: done ? new Date().toISOString() : null,
      },
      { count: "exact" }
    )
    .eq("id", taskId);

  if (error) throw error;
  if (!count) throw new Error("No autorizado para completar esta tarea.");

  revalidatePath(`/proyectos/${projectId}/unidades/${workUnitId}/checklist`);
  revalidatePath(`/proyectos/${projectId}/unidades`);
  revalidatePath(`/proyectos/${projectId}`);
}
