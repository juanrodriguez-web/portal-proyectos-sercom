"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { requireProjectAdmin } from "@/lib/authz";
import type { AppRole, TeamKind } from "@/lib/queries/team";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Busca un profile por email; si no existe, crea el auth.user via admin
// API (dispara el trigger que crea profiles) y le manda invitacion por
// correo. Usa service role SOLO para esto - el resto de la operacion
// (insertar en project_members/team_members) pasa por el cliente
// RLS-respetuoso.
async function resolveOrInviteProfile(email: string): Promise<string> {
  const admin = createServiceRoleClient();

  const { data: existing, error: lookupError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return existing.id;

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${APP_URL}/auth/callback`,
  });
  if (inviteError) {
    // GoTrue devuelve status 504/AuthRetryableFetchError cuando el envio
    // por SMTP (custom SMTP en este caso) no responde a tiempo. Sin este
    // mensaje explicito, el usuario solo ve "Error interno del servidor".
    if (inviteError.status === 504 || inviteError.message?.toLowerCase().includes("gateway timeout")) {
      throw new Error(
        "Supabase no ha podido enviar el email de invitacion (tiempo de espera agotado contactando el servidor SMTP). Revisa la configuracion de SMTP en Authentication > Emails."
      );
    }
    throw inviteError;
  }
  return invited.user.id;
}

export async function inviteProjectMember(projectId: string, email: string, role: AppRole) {
  await requireProjectAdmin(projectId);
  const userId = await resolveOrInviteProfile(email.trim().toLowerCase());

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_members")
    .upsert({ project_id: projectId, user_id: userId, project_role: role }, { onConflict: "project_id,user_id" });
  if (error) throw error;

  revalidatePath(`/proyectos/${projectId}/equipo`);
}

export async function updateProjectMemberRole(projectId: string, memberId: string, role: AppRole) {
  await requireProjectAdmin(projectId);
  const supabase = await createClient();
  const { error } = await supabase.from("project_members").update({ project_role: role }).eq("id", memberId);
  if (error) throw error;
  revalidatePath(`/proyectos/${projectId}/equipo`);
}

export async function removeProjectMember(projectId: string, memberId: string) {
  await requireProjectAdmin(projectId);
  const supabase = await createClient();
  const { error } = await supabase.from("project_members").delete().eq("id", memberId);
  if (error) throw error;
  revalidatePath(`/proyectos/${projectId}/equipo`);
}

export async function createTeam(
  projectId: string,
  organizationId: string,
  name: string,
  kind: TeamKind,
  isManagement: boolean
) {
  await requireProjectAdmin(projectId);
  const supabase = await createClient();
  const { error } = await supabase
    .from("teams")
    .insert({ organization_id: organizationId, name, kind, is_management: isManagement });
  if (error) throw error;
  revalidatePath(`/proyectos/${projectId}/equipo`);
}

export async function addTeamMember(projectId: string, teamId: string, email: string) {
  await requireProjectAdmin(projectId);
  const userId = await resolveOrInviteProfile(email.trim().toLowerCase());

  const supabase = await createClient();
  const { error } = await supabase
    .from("team_members")
    .upsert({ team_id: teamId, user_id: userId }, { onConflict: "team_id,user_id" });
  if (error) throw error;
  revalidatePath(`/proyectos/${projectId}/equipo`);
}

export async function grantProjectTeamAccess(projectId: string, teamId: string, role: AppRole) {
  await requireProjectAdmin(projectId);
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_team_access")
    .upsert({ project_id: projectId, team_id: teamId, project_role: role }, { onConflict: "project_id,team_id" });
  if (error) throw error;
  revalidatePath(`/proyectos/${projectId}/equipo`);
}

export async function revokeProjectTeamAccess(projectId: string, accessId: string) {
  await requireProjectAdmin(projectId);
  const supabase = await createClient();
  const { error } = await supabase.from("project_team_access").delete().eq("id", accessId);
  if (error) throw error;
  revalidatePath(`/proyectos/${projectId}/equipo`);
}
