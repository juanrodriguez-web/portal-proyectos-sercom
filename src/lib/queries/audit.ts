import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";

export type AuditEvent = {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_name_snapshot: string | null;
  actor_email_snapshot: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
};

// RLS (audit_events_select) solo deja pasar a is_org_admin: si esto
// devuelve vacio para un usuario que no es ADMIN, es RLS filtrando, no
// un bug - no hay policy alguna que le de acceso a esta tabla.
export async function listAuditEvents(projectId: string, limit = 100): Promise<AuditEvent[]> {
  await getSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_events")
    .select("id, entity_type, entity_id, action, actor_name_snapshot, actor_email_snapshot, old_value, new_value, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

const TRACKED_FIELDS = ["status", "risk_level", "assignee_id", "gate", "severity"];

export function summarizeChange(event: AuditEvent): string | null {
  if (!event.old_value || !event.new_value) return null;
  for (const field of TRACKED_FIELDS) {
    const before = event.old_value[field];
    const after = event.new_value[field];
    if (before !== after) {
      return `${field}: ${String(before)} → ${String(after)}`;
    }
  }
  return null;
}
