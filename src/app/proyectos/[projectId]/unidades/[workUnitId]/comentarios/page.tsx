import { listComments } from "@/lib/queries/comments";
import { createComment } from "@/lib/actions/comments";
import { VISIBILITY_LEVELS, VISIBILITY_LABEL, VISIBILITY_HINT } from "@/lib/visibility-options";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function ComentariosPage({
  params,
}: PageProps<"/proyectos/[projectId]/unidades/[workUnitId]/comentarios">) {
  const { projectId, workUnitId } = await params;
  const comments = await listComments(workUnitId);

  return (
    <div className="flex flex-col gap-4">
      <form
        action={async (formData: FormData) => {
          "use server";
          const body = String(formData.get("body") ?? "");
          const visibility = formData.get("visibility") as (typeof VISIBILITY_LEVELS)[number];
          await createComment(projectId, workUnitId, body, visibility);
        }}
        className="flex flex-col gap-2 rounded-md border p-4"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <textarea
          name="body"
          required
          rows={3}
          placeholder="Escribe un comentario…"
          className="rounded-sm border px-2.5 py-1.5 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        />
        <div className="flex items-center gap-2">
          <select
            name="visibility"
            defaultValue="PARTICIPANTS"
            className="rounded-sm border px-2 py-1 text-xs"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            {VISIBILITY_LEVELS.map((v) => (
              <option key={v} value={v} title={VISIBILITY_HINT[v]}>{VISIBILITY_LABEL[v]}</option>
            ))}
          </select>
          <button type="submit" className="rounded-sm px-3 py-1.5 text-sm font-semibold text-white" style={{ background: "var(--brand)" }}>
            Comentar
          </button>
        </div>
      </form>

      <div className="rounded-md border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        {comments.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm" style={{ color: "var(--ink-faint)" }}>
            Sin comentarios todavía.
          </div>
        ) : (
          <ul>
            {comments.map((c) => (
              <li key={c.id} className="border-t px-4 py-3 text-sm first:border-t-0" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.profiles?.full_name || c.profiles?.email}</span>
                  <span className="font-mono text-[11px]" style={{ color: "var(--ink-faint)" }}>{formatDateTime(c.created_at)}</span>
                  {c.visibility !== "PARTICIPANTS" && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}
                    >
                      {VISIBILITY_LABEL[c.visibility]}
                    </span>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap" style={{ color: "var(--ink-soft)" }}>{c.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
