"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { divIcon } from "leaflet";
import Link from "next/link";
import type { WorkUnit } from "@/lib/queries/work-units";

// Colores por estado, tomados de los mismos tokens que StatusChip
// (spec 13: verde operativo, azul ready, rojo not ready, naranja riesgo).
const STATUS_COLOR: Record<string, string> = {
  OPERATIVE: "#1e7a4c",
  READY_FOR_INSTALL: "#21578e",
  INSTALLING: "#0e7c86",
  PENDING_VALIDATION: "#916012",
  PLANIFICADO: "#56636e",
  EN_PREPARACION: "#3e6e93",
  BLOCKED: "#b23a22",
  CANCELLED: "#6c7780",
  ON_HOLD: "#6c7780",
};

function markerIcon(color: string) {
  return divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export function WorkUnitsMap({
  units,
  projectId,
}: {
  units: WorkUnit[];
  projectId: string;
}) {
  const geocoded = units.filter((u) => u.lat !== null && u.lng !== null);

  return (
    <MapContainer
      center={[40.2, -3.7]}
      zoom={6}
      scrollWheelZoom
      style={{ height: "560px", width: "100%", borderRadius: "8px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {geocoded.map((u) => (
        <Marker key={u.id} position={[u.lat as number, u.lng as number]} icon={markerIcon(STATUS_COLOR[u.status] ?? "#6c7780")}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">{u.name}</div>
              <div className="text-xs text-gray-500">{u.code} · {u.city}</div>
              <Link href={`/proyectos/${projectId}/unidades/${u.id}`} className="text-xs text-blue-600 underline">
                Abrir unidad
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
