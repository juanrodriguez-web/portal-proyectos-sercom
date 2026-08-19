import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";

export type AppRole = "ADMIN" | "COORDINATOR" | "OPERATIONS" | "INSTALLER" | "VIEWER";
export type TeamKind = "INTERNAL" | "EXTERNAL_PROVIDER";

export type ProjectMember = {
  id: string;
  user_id: string;
  project_role: AppRole;
  profiles: { full_name: string | null; email: string } | null;
};

export async function listProjectMembers(projectId: string): Promise<ProjectMember[]> {
  await getSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_members")
    .select("id, user_id, project_role, profiles(full_name, email)")
    .eq("project_id", projectId)
    .order("project_role", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as ProjectMember[];
}

export type Team = {
  id: string;
  name: string;
  kind: TeamKind;
  is_management: boolean;
};

export async function listOrgTeams(organizationId: string): Promise<Team[]> {
  await getSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, kind, is_management")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export type TeamMember = {
  id: string;
  user_id: string;
  profiles: { full_name: string | null; email: string } | null;
};

export async function listTeamMembers(teamId: string): Promise<TeamMember[]> {
  await getSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("id, user_id, profiles(full_name, email)")
    .eq("team_id", teamId);

  if (error) throw error;
  return (data ?? []) as unknown as TeamMember[];
}

export type ProjectTeamAccess = {
  id: string;
  team_id: string;
  project_role: AppRole;
  teams: { name: string; kind: TeamKind } | null;
};

export async function listProjectTeamAccess(projectId: string): Promise<ProjectTeamAccess[]> {
  await getSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_team_access")
    .select("id, team_id, project_role, teams(name, kind)")
    .eq("project_id", projectId);

  if (error) throw error;
  return (data ?? []) as unknown as ProjectTeamAccess[];
}
