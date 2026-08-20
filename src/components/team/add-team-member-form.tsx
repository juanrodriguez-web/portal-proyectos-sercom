"use client";

import { useActionState } from "react";
import { addTeamMember } from "@/lib/actions/team";

type State = { error: string | null };

async function run(projectId: string, teamId: string, _prev: State, formData: FormData): Promise<State> {
  try {
    const email = String(formData.get("email") ?? "");
    await addTeamMember(projectId, teamId, email);
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export function AddTeamMemberForm({ projectId, teamId }: { projectId: string; teamId: string }) {
  const [state, action, pending] = useActionState(run.bind(null, projectId, teamId), { error: null });

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <form action={action} className="flex items-center gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="Añadir miembro por email"
          className="rounded-sm border px-2 py-1 text-xs"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        />
        <button type="submit" disabled={pending} className="text-xs disabled:opacity-50" style={{ color: "var(--accent-ink)" }}>
          {pending ? "Añadiendo…" : "Añadir"}
        </button>
      </form>
      {state.error && (
        <p className="rounded-sm px-2 py-1 text-[11px]" style={{ background: "var(--rk-crit-b)", color: "var(--rk-crit-i)" }}>
          {state.error}
        </p>
      )}
    </div>
  );
}
