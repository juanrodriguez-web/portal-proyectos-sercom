import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Data Access Layer: punto unico de verdad para "quien es el usuario
// actual y que puede hacer". Los Server Components/Actions/Route
// Handlers deben pasar por aqui en vez de leer cookies/sesion sueltos,
// para que ningun endpoint se olvide de comprobar autorizacion.
// Ver spec seccion 4.8: el frontend nunca es la unica linea de defensa,
// pero centralizar aqui evita duplicar (y desincronizar) la logica.

export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
});

export const getCurrentProfile = cache(async () => {
  const user = await getSession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .eq("id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return data;
});

// Rol efectivo para un proyecto (null si no tiene acceso).
// Refleja exactamente lo que dice el RLS: si esto devuelve null,
// cualquier query a `projects`/`work_units` de ese proyecto tambien
// devolvera vacio, nunca un error revelador de que el recurso existe.
export async function getProjectRole(projectId: string) {
  await getSession();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("project_role", {
    p_project_id: projectId,
  });

  if (error) {
    throw error;
  }

  return data as
    | "ADMIN"
    | "COORDINATOR"
    | "OPERATIONS"
    | "INSTALLER"
    | "VIEWER"
    | null;
}

export async function getWorkUnitRole(workUnitId: string) {
  await getSession();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("work_unit_role", {
    p_work_unit_id: workUnitId,
  });

  if (error) {
    throw error;
  }

  return data as
    | "ADMIN"
    | "COORDINATOR"
    | "OPERATIONS"
    | "INSTALLER"
    | "VIEWER"
    | null;
}

export async function requireProjectRole(
  projectId: string,
  allowed: Array<"ADMIN" | "COORDINATOR" | "OPERATIONS" | "INSTALLER" | "VIEWER">
) {
  const role = await getProjectRole(projectId);
  if (!role || !allowed.includes(role)) {
    redirect("/");
  }
  return role;
}
