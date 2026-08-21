"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { requireProjectAdmin } from "@/lib/authz";
import type { AppRole, TeamKind } from "@/lib/queries/team";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// GoTrue puede tardar ~35s en devolver el 504 cuando el SMTP configurado
// no responde. Dejar correr eso arriesga chocar con el limite de
// duracion de la funcion serverless, que mata el proceso a medio
// responder y el cliente ve un crash de React en vez de un mensaje de
// error normal. Por eso el cliente que hace esta llamada concreta
// aborta la peticion HTTP de verdad (AbortController, no un
// Promise.race que solo "deja de esperar" pero no cancela nada) a los
// 15s.
const INVITE_TIMEOUT_MS = 15000;

const SMTP_TIMEOUT_MESSAGE =
  "El servidor SMTP configurado en Supabase no responde (tiempo de espera agotado). Revisa Authentication > Emails > SMTP Settings, o prueba esas credenciales SMTP desde un cliente de correo para descartar que el problema esté en Microsoft 365.";

function isAbortError(e: unknown): boolean {
  return e instanceof Error && (e.name === "AbortError" || e.message.toLowerCase().includes("abort"));
}

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

  const authAdmin = createServiceRoleClient({ fetchTimeoutMs: INVITE_TIMEOUT_MS });

  let invited;
  try {
    const { data, error } = await authAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${APP_URL}/auth/callback`,
    });
    if (error) {
      if (error.status === 504 || error.message?.toLowerCase().includes("gateway timeout")) {
        throw new Error(SMTP_TIMEOUT_MESSAGE);
      }
      throw error;
    }
    invited = data;
  } catch (e) {
    if (isAbortError(e)) throw new Error(SMTP_TIMEOUT_MESSAGE);
    throw e;
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
