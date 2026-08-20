import { listWorkUnits } from "@/lib/queries/work-units";
import { WorkUnitsMapLoader } from "@/components/map/work-units-map-loader";

export default async function MapaPage({
  params,
}: PageProps<"/proyectos/[projectId]/mapa">) {
  const { projectId } = await params;
  const units = await listWorkUnits(projectId);
  const geocoded = units.filter((u) => u.lat !== null && u.lng !== null);
  const ungeocoded = units.filter((u) => u.lat === null || u.lng === null);

  const byProvince: Record<string, number> = {};
  for (const u of ungeocoded) {
    const key = u.province ?? "Sin provincia";
    byProvince[key] = (byProvince[key] ?? 0) + 1;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Mapa</h1>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          {geocoded.length} de {units.length} unidades con coordenadas.
        </p>
      </div>

      {ungeocoded.length > 0 && (
        <div
          className="rounded-md border px-4 py-3 text-sm"
          style={{ background: "var(--st-pending-b)", borderColor: "var(--border)", color: "var(--st-pending-i)" }}
        >
          {ungeocoded.length} unidades no tienen latitud/longitud todavía (el listado original
          no las traía) y no aparecen en el mapa. Repartidas por provincia:{" "}
          {Object.entries(byProvince)
            .map(([prov, n]) => `${prov} (${n})`)
            .join(", ")}
          .
        </div>
      )}

      <WorkUnitsMapLoader units={units} projectId={projectId} />
    </div>
  );
}
