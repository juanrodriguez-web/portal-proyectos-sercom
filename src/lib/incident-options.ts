import type { IncidentStatus } from "@/lib/queries/incidents";
import type { RiskLevel } from "@/lib/queries/work-units";

// Modulo de datos plano (sin "use client") - ver nota en src/lib/roles.ts
// sobre por que estas constantes no pueden vivir en un archivo cliente.

export const INCIDENT_CATEGORIES = [
  "Material",
  "PDV no preparado",
  "Electricidad",
  "Conectividad",
  "Instalador",
  "Acceso",
  "Hardware",
  "Software",
  "Logística",
  "Otros",
] as const;

export const INCIDENT_STATUSES: IncidentStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En curso",
  RESOLVED: "Resuelta",
  CLOSED: "Cerrada",
};

export const SEVERITY_LEVELS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const SEVERITY_LABEL: Record<RiskLevel, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};
