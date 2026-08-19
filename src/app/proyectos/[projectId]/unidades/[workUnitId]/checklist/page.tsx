import { listChecklist } from "@/lib/queries/tasks";
import { TaskCheckbox } from "@/components/ui/task-checkbox";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }).toUpperCase();
}

export default async function ChecklistPage({
  params,
}: PageProps<"/proyectos/[projectId]/unidades/[workUnitId]/checklist">) {
  const { projectId, workUnitId } = await params;
  const phases = await listChecklist(workUnitId);

  const totalTasks = phases.reduce((acc, p) => acc + p.tasks.length, 0);
  const doneTasks = phases.reduce((acc, p) => acc + p.tasks.filter((t) => t.status === "DONE").length, 0);

  if (totalTasks === 0) {
    return (
      <div className="rounded-md border p-5 text-sm" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--ink-faint)" }}>
        Esta unidad todavía no tiene ninguna plantilla aplicada — no hay checklist que mostrar.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm" style={{ color: "var(--ink-soft)" }}>
        {doneTasks} / {totalTasks} tareas completadas
      </div>

      {phases.map((phase) => (
        <div key={phase.id} className="rounded-md border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="border-b px-4 py-2.5 text-sm font-semibold" style={{ borderColor: "var(--border)" }}>
            {phase.name}
          </div>
          <ul>
            {phase.tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 border-t px-4 py-2.5 text-sm first:border-t-0"
                style={{ borderColor: "var(--border)" }}
              >
                <TaskCheckbox
                  taskId={task.id}
                  projectId={projectId}
                  workUnitId={workUnitId}
                  done={task.status === "DONE"}
                />
                <span
                  className="flex-1"
                  style={task.status === "DONE" ? { color: "var(--ink-faint)", textDecoration: "line-through" } : { color: "var(--ink)" }}
                >
                  {task.title}
                </span>
                {task.requires_evidence && (
                  <span className="text-[10.5px]" style={{ color: "var(--accent-ink)" }} title="Requiere evidencia">
                    📷
                  </span>
                )}
                {task.gate && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                    style={{ background: "var(--surface-2)", color: "var(--ink-faint)" }}
                    title={`Bloquea el gate ${task.gate}`}
                  >
                    {task.gate}
                  </span>
                )}
                <span className="font-mono text-[11px] whitespace-nowrap" style={{ color: "var(--ink-faint)" }}>
                  {formatDate(task.due_at)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
