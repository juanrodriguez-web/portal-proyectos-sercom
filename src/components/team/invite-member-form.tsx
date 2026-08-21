"use client";

import { useActionState } from "react";
import { inviteProjectMember } from "@/lib/actions/team";
import { ASSIGNABLE_ROLES, ROLE_LABEL } from "@/lib/roles";

type State = { error: string | null };

async function run(projectId: string, _prev: State, formData: FormData): Promise<State> {
  const email = String(formData.get("email") ?? "");
  const role = formData.get("role") as (typeof ASSIGNABLE_ROLES)[number];
  const result = await inviteProjectMember(projectId, email, role);
  return result.ok ? { error: null } : { error: result.error };
}

export function InviteMemberForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(run.bind(null, projectId), { error: null });

  return (
    <div className="flex flex-col gap-2 border-t px-4 py-3" style={{ borderColor: "var(--border)" }}>
      <form action={action} className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-[10.5px] tracking-wide uppercase" style={{ color: "var(--ink-faint)" }}>
            Invitar por email
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="nombre@proveedor.com"
            className="w-full rounded-sm border px-2.5 py-1.5 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          />
        </div>
        <select
          name="role"
          defaultValue="INSTALLER"
          className="rounded-sm border px-2.5 py-1.5 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--brand)" }}
        >
          {pending ? "Invitando…" : "Invitar"}
        </button>
      </form>
      {state.error && (
        <p className="rounded-sm px-2.5 py-1.5 text-xs" style={{ background: "var(--rk-crit-b)", color: "var(--rk-crit-i)" }}>
          {state.error}
        </p>
      )}
    </div>
  );
}
