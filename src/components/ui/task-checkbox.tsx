"use client";

import { useTransition } from "react";
import { toggleTaskDone } from "@/lib/actions/tasks";

export function TaskCheckbox({
  taskId,
  projectId,
  workUnitId,
  done,
}: {
  taskId: string;
  projectId: string;
  workUnitId: string;
  done: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <input
      type="checkbox"
      defaultChecked={done}
      disabled={isPending}
      className="h-4 w-4 shrink-0 accent-[var(--accent)]"
      onChange={(e) => {
        const next = e.target.checked;
        startTransition(() => {
          toggleTaskDone(taskId, projectId, workUnitId, next).catch(() => {
            e.target.checked = !next;
          });
        });
      }}
    />
  );
}
