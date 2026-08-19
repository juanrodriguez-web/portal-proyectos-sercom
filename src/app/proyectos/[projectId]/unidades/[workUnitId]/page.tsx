import { getWorkUnit } from "@/lib/queries/work-units";

export default async function WorkUnitSummaryPage({
  params,
}: PageProps<"/proyectos/[projectId]/unidades/[workUnitId]">) {
  const { workUnitId } = await params;
  const unit = await getWorkUnit(workUnitId);

  return (
    <div className="rounded-md border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <h2 className="mb-3 text-sm font-semibold">Notas de importación</h2>
      {unit?.notes ? (
        <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--ink-soft)" }}>{unit.notes}</p>
      ) : (
        <p className="text-sm" style={{ color: "var(--ink-faint)" }}>Sin notas.</p>
      )}
    </div>
  );
}
