import { signOut } from "@/lib/actions/auth";

function initials(nameOrEmail: string) {
  const base = nameOrEmail.includes("@") ? nameOrEmail.split("@")[0] : nameOrEmail;
  const parts = base.split(/[.\s_]+/).filter(Boolean);
  return (parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?").slice(0, 2);
}

export function Topbar({
  breadcrumb,
  userLabel,
}: {
  breadcrumb: string;
  userLabel: string;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 border-b px-6 py-3"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="font-condensed text-sm font-semibold" style={{ color: "var(--ink)" }}>
        {breadcrumb}
      </div>
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-semibold"
          style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}
          title={userLabel}
        >
          {initials(userLabel)}
        </div>
        <form action={signOut}>
          <button type="submit" className="text-xs" style={{ color: "var(--ink-faint)" }}>
            Salir
          </button>
        </form>
      </div>
    </div>
  );
}
