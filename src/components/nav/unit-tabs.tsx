"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Resumen", href: "" },
  { label: "Checklist", href: "/checklist" },
  { label: "Timeline", href: null },
  { label: "Evidencias", href: null },
  { label: "Incidencias", href: null },
  { label: "Comentarios", href: null },
  { label: "Auditoría", href: null },
] as const;

export function UnitTabs({ projectId, workUnitId }: { projectId: string; workUnitId: string }) {
  const pathname = usePathname();
  const base = `/proyectos/${projectId}/unidades/${workUnitId}`;

  return (
    <div className="flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
      {TABS.map((tab) => {
        if (tab.href === null) {
          return (
            <span
              key={tab.label}
              className="px-3 py-2 text-sm opacity-40"
              style={{ color: "var(--ink-soft)" }}
              title="Pantalla pendiente de construir"
            >
              {tab.label}
            </span>
          );
        }
        const href = `${base}${tab.href}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.label}
            href={href}
            className={`px-3 py-2 text-sm ${active ? "border-b-2 font-semibold" : ""}`}
            style={active ? { borderColor: "var(--accent)", color: "var(--ink)" } : { color: "var(--ink-soft)" }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
