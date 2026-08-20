import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";

export type TimelineEntry = {
  id: string;
  kind: "comment" | "event";
  created_at: string;
  actor: string;
  // comment
  body?: string;
  visibility?: string;
  // event
  entityType?: string;
  action?: string;
  change?: string | null;
};

const ENTITY_LABEL: Record<string, string> = {
  work_units: "la unidad",
  tasks: "una tarea",
  incidents: "una incidencia",
  attachments: "una evidencia",
};

const ACTION_LABEL: Record<string, string> = { INSERT: "creó", UPDATE: "actualizó", DELETE: "eliminó" };

const TRACKED_FIELDS = ["status", "risk_level", "assignee_id", "gate", "severity", "installation_planned_at"];

function summarizeChange(oldValue: Record<string, unknown> | null, newValue: Record<string, unknown> | null): string | null {
  if (!oldValue || !newValue) return null;
  for (const field of TRACKED_FIELDS) {
    if (oldValue[field] !== newValue[field]) {
      return `${field}: ${String(oldValue[field])} → ${String(newValue[field])}`;
    }
  }
  return null;
}

// Combina comentarios + audit_events de la unidad (spec 19). RLS filtra
// ambos independientemente: comments por visibility, audit_events por
// has_work_unit_access (ver migracion 0007) - aqui solo se ordenan y
// se unifica el formato.
export async function listTimeline(workUnitId: string): Promise<TimelineEntry[]> {
  await getSession();
  const supabase = await createClient();

  const [{ data: comments, error: commentsError }, { data: events, error: eventsError }] = await Promise.all([
    supabase
      .from("comments")
      .select("id, body, visibility, created_at, profiles(full_name, email)")
      .eq("work_unit_id", workUnitId),
    supabase
      .from("audit_events")
      .select("id, entity_type, action, actor_name_snapshot, actor_email_snapshot, old_value, new_value, created_at")
      .eq("work_unit_id", workUnitId),
  ]);
  if (commentsError) throw commentsError;
  if (eventsError) throw eventsError;

  const commentEntries: TimelineEntry[] = (comments ?? []).map((c) => {
    const author = c.profiles as unknown as { full_name: string | null; email: string } | null;
    return {
      id: `c-${c.id}`,
      kind: "comment",
      created_at: c.created_at,
      actor: author?.full_name || author?.email || "?",
      body: c.body,
      visibility: c.visibility,
    };
  });

  const eventEntries: TimelineEntry[] = (events ?? []).map((e) => ({
    id: `e-${e.id}`,
    kind: "event",
    created_at: e.created_at,
    actor: e.actor_name_snapshot ?? e.actor_email_snapshot ?? "Sistema",
    entityType: ENTITY_LABEL[e.entity_type] ?? e.entity_type,
    action: ACTION_LABEL[e.action] ?? e.action,
    change: summarizeChange(e.old_value as Record<string, unknown> | null, e.new_value as Record<string, unknown> | null),
  }));

  return [...commentEntries, ...eventEntries].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
