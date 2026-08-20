"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";
import type { Visibility } from "@/lib/queries/comments";

// RLS (comments_insert) exige has_work_unit_access + author_id = auth.uid():
// nadie puede publicar un comentario en nombre de otro usuario aunque
// manipule el formulario.
export async function createComment(
  projectId: string,
  workUnitId: string,
  body: string,
  visibility: Visibility
) {
  const user = await getSession();
  if (!body.trim()) return;

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    project_id: projectId,
    work_unit_id: workUnitId,
    author_id: user.id,
    body: body.trim(),
    visibility,
  });
  if (error) throw error;

  revalidatePath(`/proyectos/${projectId}/unidades/${workUnitId}/comentarios`);
  revalidatePath(`/proyectos/${projectId}/unidades/${workUnitId}/timeline`);
}
