import type { Visibility } from "@/lib/queries/comments";

// Modulo de datos plano (sin "use client") - ver nota en src/lib/roles.ts.
export const VISIBILITY_LEVELS: Visibility[] = ["PARTICIPANTS", "INTERNAL", "MANAGEMENT"];

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  PARTICIPANTS: "Participantes",
  INTERNAL: "Interno",
  MANAGEMENT: "Management",
};

export const VISIBILITY_HINT: Record<Visibility, string> = {
  PARTICIPANTS: "Visible para cualquiera con acceso a esta unidad",
  INTERNAL: "Solo usuarios internos de la organización",
  MANAGEMENT: "Solo perfiles/equipos de management",
};
