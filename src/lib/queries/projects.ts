import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";

export type ProjectSummary = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  deadline_at: string | null;
};

// RLS ya filtra por acceso (has_project_access): esta query solo puede
// devolver proyectos a los que el usuario realmente tiene acceso, sea
// como ADMIN, por project_members o por equipo.
export async function listAccessibleProjects(): Promise<ProjectSummary[]> {
  await getSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, organization_id, name, description, deadline_at")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getProject(projectId: string): Promise<ProjectSummary | null> {
  await getSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, organization_id, name, description, deadline_at")
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
