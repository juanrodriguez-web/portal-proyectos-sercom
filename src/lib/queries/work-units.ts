import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";

export type WorkUnitStatus =
  | "PLANIFICADO"
  | "EN_PREPARACION"
  | "READY_FOR_INSTALL"
  | "INSTALLING"
  | "PENDING_VALIDATION"
  | "OPERATIVE"
  | "BLOCKED"
  | "CANCELLED"
  | "ON_HOLD";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type WorkUnit = {
  id: string;
  project_id: string;
  code: string;
  name: string;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  province: string | null;
  contact_name: string | null;
  status: WorkUnitStatus;
  risk_level: RiskLevel;
  risk_score: number;
  installation_planned_at: string | null;
  operative_at: string | null;
  notes: string | null;
};

// RLS (has_work_unit_access) hace el filtrado real: un COORDINATOR/ADMIN
// del proyecto ve todas las unidades, un INSTALLER solo las suyas.
export async function listWorkUnits(projectId: string): Promise<WorkUnit[]> {
  await getSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_units")
    .select(
      "id, project_id, code, name, address, postal_code, city, province, contact_name, status, risk_level, risk_score, installation_planned_at, operative_at, notes"
    )
    .eq("project_id", projectId)
    .order("installation_planned_at", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
}

export async function getWorkUnit(workUnitId: string): Promise<WorkUnit | null> {
  await getSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_units")
    .select(
      "id, project_id, code, name, address, postal_code, city, province, contact_name, status, risk_level, risk_score, installation_planned_at, operative_at, notes"
    )
    .eq("id", workUnitId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function summarizeWorkUnits(units: WorkUnit[]) {
  const objetivo = units.length;
  const operativos = units.filter((u) => u.status === "OPERATIVE").length;
  const readyForInstall = units.filter((u) => u.status === "READY_FOR_INSTALL").length;
  const notReady = units.filter(
    (u) => !["OPERATIVE", "READY_FOR_INSTALL", "CANCELLED"].includes(u.status)
  ).length;
  const highOrCriticalRisk = units.filter(
    (u) => u.risk_level === "HIGH" || u.risk_level === "CRITICAL"
  ).length;
  const pctCompletado = objetivo === 0 ? 0 : Math.round((operativos / objetivo) * 100);

  return { objetivo, operativos, readyForInstall, notReady, highOrCriticalRisk, pctCompletado };
}
