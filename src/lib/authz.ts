import "server-only";
import { getProjectRole } from "@/lib/dal";

// Comprobacion explicita en servidor, spec 4.8: "las funciones con
// privilegios elevados deberan ejecutarse exclusivamente en servidor y
// nunca confiar en atributos modificables desde el cliente". Se usa
// antes de cualquier Server Action que toque el service role o
// operaciones a nivel de proyecto/organizacion (MANAGE_USERS,
// MANAGE_TEMPLATE), que exceden lo que RLS por si solo puede acotar.
export async function requireProjectAdmin(projectId: string) {
  const role = await getProjectRole(projectId);
  if (role !== "ADMIN") {
    throw new Error("Solo un ADMIN puede realizar esta accion.");
  }
}
