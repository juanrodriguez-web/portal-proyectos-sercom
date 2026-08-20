import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";
import type { RiskLevel } from "@/lib/queries/work-units";

export type IncidentStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type Incident = {
  id: string;
  work_unit_id: string;
  category: string;
  severity: RiskLevel;
  description: string;
  status: IncidentStatus;
  opened_at: string;
  target_at: string | null;
  resolved_at: string | null;
  work_units: { name: string; code: string } | null;
};

export async function listIncidents(projectId: string): Promise<Incident[]> {
  await getSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incidents")
    .select("id, work_unit_id, category, severity, description, status, opened_at, target_at, resolved_at, work_units(name, code)")
    .eq("project_id", projectId)
    .order("opened_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Incident[];
}
