"use client";

import { useTransition } from "react";
import type { IncidentStatus } from "@/lib/queries/incidents";
import { INCIDENT_STATUSES, INCIDENT_STATUS_LABEL } from "@/lib/incident-options";

export function IncidentStatusSelect({
  value,
  onChange,
}: {
  value: IncidentStatus;
  onChange: (status: IncidentStatus) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={value}
      disabled={isPending}
      onChange={(e) => startTransition(() => onChange(e.target.value as IncidentStatus))}
      className="rounded-sm border px-2 py-1 text-xs"
      style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
    >
      {INCIDENT_STATUSES.map((s) => (
        <option key={s} value={s}>
          {INCIDENT_STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
