import type { RiskLevel, WorkUnitStatus } from "@/lib/queries/work-units";

const STATUS_LABEL: Record<WorkUnitStatus, string> = {
  PLANIFICADO: "Planificado",
  EN_PREPARACION: "En preparación",
  READY_FOR_INSTALL: "Ready for Install",
  INSTALLING: "Instalando",
  PENDING_VALIDATION: "Pending Validation",
  OPERATIVE: "Operativo",
  BLOCKED: "Bloqueado",
  CANCELLED: "Cancelado",
  ON_HOLD: "En espera",
};

// Cada status mapea a un par de tokens --st-*-i (texto) / --st-*-b (fondo)
// definido en globals.css, copiado del design system publicado.
const STATUS_TOKEN: Record<WorkUnitStatus, string> = {
  PLANIFICADO: "planned",
  EN_PREPARACION: "prep",
  READY_FOR_INSTALL: "ready",
  INSTALLING: "install",
  PENDING_VALIDATION: "pending",
  OPERATIVE: "op",
  BLOCKED: "planned",
  CANCELLED: "planned",
  ON_HOLD: "planned",
};

export function StatusChip({ status }: { status: WorkUnitStatus }) {
  const token = STATUS_TOKEN[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap before:h-1.5 before:w-1.5 before:rounded-sm before:content-['']"
      style={{
        background: `var(--st-${token}-b)`,
        color: `var(--st-${token}-i)`,
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

const RISK_LABEL: Record<RiskLevel, string> = {
  LOW: "Bajo",
  MEDIUM: "Medio",
  HIGH: "Alto",
  CRITICAL: "Crítico",
};

const RISK_TOKEN: Record<RiskLevel, string> = {
  LOW: "low",
  MEDIUM: "med",
  HIGH: "high",
  CRITICAL: "crit",
};

export function RiskChip({ risk }: { risk: RiskLevel }) {
  const token = RISK_TOKEN[risk];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap before:h-1.5 before:w-1.5 before:rounded-full before:content-['']"
      style={{
        background: `var(--rk-${token}-b)`,
        color: `var(--rk-${token}-i)`,
      }}
    >
      {RISK_LABEL[risk]}
    </span>
  );
}
