"use client";

import { useActionState } from "react";
import { importWorkUnitsCsv, type ImportSummary } from "@/lib/actions/import";

type State = { summary: ImportSummary | null; error: string | null };

async function runImport(projectId: string, _prev: State, formData: FormData): Promise<State> {
  try {
    const summary = await importWorkUnitsCsv(projectId, formData);
    return { summary, error: null };
  } catch (e) {
    return { summary: null, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export function ImportForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(runImport.bind(null, projectId), {
    summary: null,
    error: null,
  });

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-3 rounded-md border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <label className="text-sm font-medium">Archivo CSV</label>
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-sm px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--brand)" }}
        >
          {pending ? "Importando…" : "Importar"}
        </button>
      </form>

      {state.error && (
        <div className="rounded-md border px-4 py-3 text-sm" style={{ background: "var(--rk-crit-b)", borderColor: "var(--border)", color: "var(--rk-crit-i)" }}>
          {state.error}
        </div>
      )}

      {state.summary && (
        <div className="rounded-md border px-4 py-3 text-sm" style={{ background: "var(--st-op-b)", borderColor: "var(--border)", color: "var(--st-op-i)" }}>
          <p>
            {state.summary.imported} unidades creadas/actualizadas · plantilla aplicada a{" "}
            {state.summary.templateApplied} unidades nuevas.
          </p>
          {state.summary.skipped.length > 0 && (
            <p className="mt-1" style={{ color: "var(--rk-high-i)" }}>
              {state.summary.skipped.length} filas ignoradas: {state.summary.skipped.map((s) => `línea ${s.line} (${s.reason})`).join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
