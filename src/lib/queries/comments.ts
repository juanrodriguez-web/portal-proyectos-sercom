import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";

export type Visibility = "PARTICIPANTS" | "INTERNAL" | "MANAGEMENT";

export type Comment = {
  id: string;
  body: string;
  visibility: Visibility;
  created_at: string;
  author_id: string;
  profiles: { full_name: string | null; email: string } | null;
};

// RLS (comments_select) ya filtra por has_work_unit_access +
// can_see_visibility: un INSTALLER nunca vera un comentario INTERNAL,
// aunque tenga acceso a la unidad.
export async function listComments(workUnitId: string): Promise<Comment[]> {
  await getSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("id, body, visibility, created_at, author_id, profiles(full_name, email)")
    .eq("work_unit_id", workUnitId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Comment[];
}
