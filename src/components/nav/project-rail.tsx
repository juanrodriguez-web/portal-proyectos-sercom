"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href?: string; // sin href = pantalla todavia no construida
  icon: React.ReactNode;
};

function icon(path: React.ReactNode) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" stroke="currentColor" fill="none" strokeWidth={1.75}>
      {path}
    </svg>
  );
}

export function ProjectRail({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const pathname = usePathname();
  const base = `/proyectos/${projectId}`;

  const projectItems: NavItem[] = [
    {
      label: "Control Tower",
      href: base,
      icon: icon(<><rect x="3" y="12" width="4" height="8" /><rect x="10" y="7" width="4" height="13" /><rect x="17" y="3" width="4" height="17" /></>),
    },
    {
      label: "Unidades",
      href: `${base}/unidades`,
      icon: icon(<><rect x="3" y="4" width="18" height="16" rx="1" /><path d="M3 10h18" /></>),
    },
    {
      label: "Importar PDV",
      href: `${base}/importar`,
      icon: icon(<><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M4 21h16" /></>),
    },
    { label: "Gantt", href: `${base}/gantt`, icon: icon(<path d="M4 6h10M4 12h16M4 18h7" />) },
    { label: "Mapa", href: `${base}/mapa`, icon: icon(<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />) },
    {
      label: "Incidencias",
      href: `${base}/incidencias`,
      icon: icon(<><path d="M12 9v5M12 17h.01" /><path d="M10.3 3.9 2.6 18a1.6 1.6 0 0 0 1.4 2.4h16a1.6 1.6 0 0 0 1.4-2.4L13.7 3.9a1.6 1.6 0 0 0-2.8 0z" /></>),
    },
    {
      label: "Plantillas",
      href: `${base}/plantillas`,
      icon: icon(<><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M8 8h8M8 12h8M8 16h5" /></>),
    },
    {
      label: "Auditoría",
      href: `${base}/auditoria`,
      icon: icon(<><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" /></>),
    },
    {
      label: "Usuarios y equipos",
      href: `${base}/equipo`,
      icon: icon(<><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><circle cx="17.5" cy="8.5" r="2.6" /><path d="M15.2 14.2c2.9.4 4.8 2.4 4.8 5.8" /></>),
    },
  ];

  const personalItems: NavItem[] = [
    { label: "Mis tareas", href: "/mis-tareas", icon: icon(<path d="M20 6 9 17l-5-5" />) },
  ];

  const renderItem = (item: NavItem) => {
    const active = item.href && pathname === item.href;
    const className = `flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-[13px] ${
      active
        ? "font-semibold"
        : item.href
        ? "text-[var(--rail-ink)] hover:bg-white/5"
        : "text-[var(--rail-ink)] opacity-40 cursor-default"
    }`;
    const style = active
      ? { background: "var(--rail-accent-bg)", color: "var(--rail-accent-ink)" }
      : undefined;

    if (!item.href) {
      return (
        <span key={item.label} className={className} title="Pantalla pendiente de construir">
          {item.icon}
          {item.label}
        </span>
      );
    }
    return (
      <Link key={item.label} href={item.href} className={className} style={style}>
        {item.icon}
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="flex w-[220px] shrink-0 flex-col gap-0.5 p-3" style={{ background: "var(--rail-bg)" }}>
      <div className="flex items-center gap-2 px-2 pb-4 pt-1.5">
        <div className="h-5 w-2 rounded-[1px]" style={{ background: "var(--brand)" }} />
        <div>
          <b className="block font-condensed text-sm font-semibold" style={{ color: "var(--rail-ink-strong)" }}>
            SERCOM
          </b>
          <span className="text-[11px] opacity-70" style={{ color: "var(--rail-ink)" }}>
            Vodafone
          </span>
        </div>
      </div>

      <div
        className="mb-4 rounded-sm border px-2.5 py-2 text-xs"
        style={{ background: "#161d25", borderColor: "var(--rail-line)" }}
      >
        <b className="block text-xs font-semibold" style={{ color: "var(--rail-ink-strong)" }}>
          {projectName}
        </b>
      </div>

      <div className="px-2.5 pb-1 text-[9.5px] tracking-wide uppercase opacity-50" style={{ color: "var(--rail-ink)" }}>
        Proyecto
      </div>
      {projectItems.map(renderItem)}

      <div className="px-2.5 pt-3 pb-1 text-[9.5px] tracking-wide uppercase opacity-50" style={{ color: "var(--rail-ink)" }}>
        Personal
      </div>
      {personalItems.map(renderItem)}

      <div className="mt-auto px-2.5 pt-3 text-[10.5px] opacity-45" style={{ color: "var(--rail-ink)" }}>
        v0.1 · Gestor de Proyectos
      </div>
    </nav>
  );
}
