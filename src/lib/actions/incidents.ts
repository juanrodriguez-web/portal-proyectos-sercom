"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";
import type { RiskLevel } from "@/lib/queries/work-units";
import type { IncidentStatus } from "@/lib/queries/incidents";

// La autorizacion real la hace RLS: incidents_insert requiere
// has_work_unit_access (cualquier rol con acceso a la unidad puede
// abrir una incidencia, incluido INSTALLER, spec 4). incidents_update
// (para cambiar estado) exige ADMIN/COORDINATOR/OPERATIONS.
export async function createIncident(
  projectId: string,
  workUnitId: string,
  category: string,
  severity: RiskLevel,
  description: string
) {
  const user = await getSession();
  const supabase = await createClient();
  const { error } = await supabase.from("incidents").insert({
    project_id: projectId,
    work_unit_id: workUnitId,
    category,
    severity,
    description,
    created_by: user.id,
  });
  if (error) throw error;
  revalidatePath(`/proyectos/${projectId}/incidencias`);
}

export async function updateIncidentStatus(
  projectId: string,
  incidentId: string,
  status: IncidentStatus
) {
  await getSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("incidents")
    .update({
      status,
      resolved_at: status === "RESOLVED" || status === "CLOSED" ? new Date().toISOString() : null,
    })
    .eq("id", incidentId);
  if (error) throw error;
  revalidatePath(`/proyectos/${projectId}/incidencias`);
}
