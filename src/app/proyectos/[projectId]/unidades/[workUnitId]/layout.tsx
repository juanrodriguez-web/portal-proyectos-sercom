import { notFound } from "next/navigation";
import { getWorkUnit } from "@/lib/queries/work-units";
import { StatusChip, RiskChip } from "@/components/ui/status-chip";
import { UnitTabs } from "@/components/nav/unit-tabs";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function WorkUnitLayout({
  children,
  params,
}: LayoutProps<"/proyectos/[projectId]/unidades/[workUnitId]">) {
  const { projectId, workUnitId } = await params;
  const unit = await getWorkUnit(workUnitId);

  if (!unit) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-md border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-mono text-xs" style={{ color: "var(--ink-faint)" }}>{unit.code}</div>
            <h1 className="text-2xl font-semibold">{unit.name}</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
              {[unit.address, unit.postal_code, unit.city, unit.province].filter(Boolean).join(", ") || "Sin dirección registrada"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusChip status={unit.status} />
            <RiskChip risk={unit.risk_level} />
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4" style={{ borderColor: "var(--border)" }}>
          <Field label="Instalación prevista" value={formatDate(unit.installation_planned_at)} />
          <Field label="Operativo desde" value={formatDate(unit.operative_at)} />
          <Field label="Responsable" value={unit.contact_name ?? "Sin asignar"} />
          <Field label="Risk score" value={String(unit.risk_score)} />
        </dl>
      </div>

      <UnitTabs projectId={projectId} workUnitId={workUnitId} />

      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10.5px] tracking-wide uppercase" style={{ color: "var(--ink-faint)" }}>{label}</div>
      <div className="mt-0.5 text-sm" style={{ color: "var(--ink)" }}>{value}</div>
    </div>
  );
}
