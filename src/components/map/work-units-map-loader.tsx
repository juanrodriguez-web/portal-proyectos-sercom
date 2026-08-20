"use client";

import dynamic from "next/dynamic";
import type { WorkUnit } from "@/lib/queries/work-units";

// Leaflet accede a `window`, asi que el mapa solo puede renderizarse en
// cliente. `ssr:false` con next/dynamic solo se permite dentro de un
// Client Component (Next 16), de ahi este wrapper.
const WorkUnitsMap = dynamic(
  () => import("@/components/map/work-units-map").then((m) => m.WorkUnitsMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-[560px] items-center justify-center rounded-md border text-sm"
        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--ink-faint)" }}
      >
        Cargando mapa…
      </div>
    ),
  }
);

export function WorkUnitsMapLoader({ units, projectId }: { units: WorkUnit[]; projectId: string }) {
  return <WorkUnitsMap units={units} projectId={projectId} />;
}
