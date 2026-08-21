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
// TEMPORAL para diagnostico: subido de 15000 a 45000 para ver si la
// llamada termina resolviendose sola (aunque tarde) o si Supabase tiene
// su propio limite interno alrededor de los ~35s independientemente del
// SMTP. Volver a bajarlo en cuanto se entienda la causa real.
const INVITE_TIMEOUT_MS = 45000;

const SMTP_TIMEOUT_MESSAGE =
  "El servidor SMTP configurado en Supabase no responde (tiempo de espera agotado). Revisa Authentication > Emails > SMTP Settings, o prueba esas credenciales SMTP desde un cliente de correo para descartar que el problema esté en Microsoft 365.";

function isAbortError(e: unknown): boolean {
  return e instanceof Error && (e.name === "AbortError" || e.message.toLowerCase().includes("abort"));
}

export type ActionResult = { ok: true } | { ok: false; error: string };

// Next.js oculta el mensaje real de cualquier error que se lance
// (throw) desde una Server Action en produccion, y solo deja pasar un
// "digest" opaco (spec de Next: evita filtrar detalles internos por
// error). Como aqui SI queremos que el ADMIN vea el motivo exacto
// (p.ej. que el SMTP no responde), estas acciones devuelven el error
// como valor (ActionResult) en vez de lanzarlo - throw se reserva para
// bugs de verdad inesperados, no para fallos externos previsibles
// (SMTP caido, RLS, etc).

// Busca un profile por email; si no existe, crea el auth.user via admin
// API (dispara el trigger que crea profiles) y le manda invitacion por
// correo. Usa service role SOLO para esto - el resto de la operacion
// (insertar en project_members/team_members) pasa por el cliente
// RLS-respetuoso.
async function resolveOrInviteProfile(email: string): Promise<{ userId: string } | { error: string }> {
  const admin = createServiceRoleClient();

  const { data: existing, error: lookupError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (lookupError) return { error: lookupError.message };
  if (existing) return { userId: existing.id };

  const authAdmin = createServiceRoleClient({ fetchTimeoutMs: INVITE_TIMEOUT_MS });

  try {
    const { data, error } = await authAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${APP_URL}/auth/callback`,
    });
    if (error) {
      // Log completo para depurar: el mensaje "traducido" que ve el
      // usuario no dice cual de estas condiciones se disparo de verdad.
      console.error("[resolveOrInviteProfile] inviteUserByEmail devolvio error:", {
        name: error.name,
        message: error.message,
        status: error.status,
        code: error.code,
      });
      // El AbortError puede llegar como excepcion (catch, abajo) o
      // devuelto aqui dentro de {error} segun como lo envuelva
      // supabase-js por dentro - hay que detectarlo en los dos sitios.
      if (
        error.status === 504 ||
        error.message?.toLowerCase().includes("gateway timeout") ||
        isAbortError(error)
      ) {
        return { error: SMTP_TIMEOUT_MESSAGE };
      }
      return { error: error.message };
    }
    return { userId: data.user.id };
  } catch (e) {
    console.error(
      "[resolveOrInviteProfile] inviteUserByEmail lanzo una excepcion:",
      e instanceof Error ? { name: e.name, message: e.message, stack: e.stack } : e
    );
    if (isAbortError(e)) return { error: SMTP_TIMEOUT_MESSAGE };
    return { error: e instanceof Error ? e.message : "Error desconocido invitando al usuario." };
  }
}

export async function inviteProjectMember(projectId: string, email: string, role: AppRole): Promise<ActionResult> {
  await requireProjectAdmin(projectId);
  const resolved = await resolveOrInviteProfile(email.trim().toLowerCase());
  if ("error" in resolved) return { ok: false, error: resolved.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_members")
    .upsert({ project_id: projectId, user_id: resolved.userId, project_role: role }, { onConflict: "project_id,user_id" });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/proyectos/${projectId}/equipo`);
  return { ok: true };
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

export async function addTeamMember(projectId: string, teamId: string, email: string): Promise<ActionResult> {
  await requireProjectAdmin(projectId);
  const resolved = await resolveOrInviteProfile(email.trim().toLowerCase());
  if ("error" in resolved) return { ok: false, error: resolved.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("team_members")
    .upsert({ team_id: teamId, user_id: resolved.userId }, { onConflict: "team_id,user_id" });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/proyectos/${projectId}/equipo`);
  return { ok: true };
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
