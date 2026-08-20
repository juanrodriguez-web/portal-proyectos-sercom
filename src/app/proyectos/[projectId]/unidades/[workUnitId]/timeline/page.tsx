import { listTimeline } from "@/lib/queries/timeline";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function TimelinePage({
  params,
}: PageProps<"/proyectos/[projectId]/unidades/[workUnitId]/timeline">) {
  const { workUnitId } = await params;
  const entries = await listTimeline(workUnitId);

  return (
    <div className="rounded-md border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      {entries.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm" style={{ color: "var(--ink-faint)" }}>
          Sin actividad todavía.
        </div>
      ) : (
        <ul>
          {entries.map((e) => (
            <li key={e.id} className="border-t px-4 py-3 text-sm first:border-t-0" style={{ borderColor: "var(--border)" }}>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-mono text-[11px]" style={{ color: "var(--ink-faint)" }}>{formatDateTime(e.created_at)}</span>
                <span className="font-medium">{e.actor}</span>
                {e.kind === "comment" ? (
                  <span style={{ color: "var(--ink-soft)" }}>
                    comentó
                    {e.visibility !== "PARTICIPANTS" && ` (${e.visibility})`}:
                  </span>
                ) : (
                  <span style={{ color: "var(--ink-soft)" }}>{e.action} {e.entityType}</span>
                )}
                {e.change && <span className="font-mono text-xs" style={{ color: "var(--accent-ink)" }}>{e.change}</span>}
              </div>
              {e.kind === "comment" && (
                <p className="mt-1 whitespace-pre-wrap" style={{ color: "var(--ink-soft)" }}>{e.body}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
