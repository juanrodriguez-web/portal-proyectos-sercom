"use client";

import { useTransition } from "react";
import type { AppRole } from "@/lib/queries/team";

const ROLE_LABEL: Record<AppRole, string> = {
  ADMIN: "Admin",
  COORDINATOR: "Coordinador",
  OPERATIONS: "Operations",
  INSTALLER: "Instalador",
  VIEWER: "Viewer",
};

const ASSIGNABLE_ROLES: AppRole[] = ["COORDINATOR", "OPERATIONS", "INSTALLER", "VIEWER"];

export function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value: AppRole;
  onChange: (role: AppRole) => Promise<void>;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={value}
      disabled={disabled || isPending}
      onChange={(e) => startTransition(() => onChange(e.target.value as AppRole))}
      className="rounded-sm border px-2 py-1 text-xs"
      style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
    >
      {ASSIGNABLE_ROLES.map((role) => (
        <option key={role} value={role}>
          {ROLE_LABEL[role]}
        </option>
      ))}
    </select>
  );
}

export { ROLE_LABEL, ASSIGNABLE_ROLES };
