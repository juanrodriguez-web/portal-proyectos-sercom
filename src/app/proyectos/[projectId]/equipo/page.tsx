import { getProject } from "@/lib/queries/projects";
import { getProjectRole } from "@/lib/dal";
import {
  listProjectMembers,
  listOrgTeams,
  listProjectTeamAccess,
  listTeamMembers,
} from "@/lib/queries/team";
import {
  inviteProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
  createTeam,
  addTeamMember,
  grantProjectTeamAccess,
  revokeProjectTeamAccess,
} from "@/lib/actions/team";
import { RoleSelect, ROLE_LABEL, ASSIGNABLE_ROLES } from "@/components/ui/role-select";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default async function EquipoPage({
  params,
}: PageProps<"/proyectos/[projectId]/equipo">) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) return null;

  const [role, members, teams, teamAccess] = await Promise.all([
    getProjectRole(projectId),
    listProjectMembers(projectId),
    listOrgTeams(project.organization_id),
    listProjectTeamAccess(projectId),
  ]);

  const isAdmin = role === "ADMIN";
  const teamsWithMembers = await Promise.all(
    teams.map(async (team) => ({ team, members: await listTeamMembers(team.id) }))
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Usuarios y equipos</h1>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          Acceso explícito por proyecto — nadie ve nada de este proyecto salvo que
          esté aquí, directo o vía un equipo (spec 4.1/4.3).
        </p>
        {!isAdmin && (
          <p className="mt-2 rounded-sm px-3 py-2 text-xs" style={{ background: "var(--surface-2)", color: "var(--ink-faint)" }}>
            Solo un ADMIN puede invitar o cambiar accesos. Puedes ver esta pantalla en modo lectura.
          </p>
        )}
      </div>

      {/* Miembros del proyecto */}
      <section className="rounded-md border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold">Miembros del proyecto</h2>
        </div>

        <ul>
          {members.length === 0 && (
            <li className="px-4 py-6 text-center text-sm" style={{ color: "var(--ink-faint)" }}>
              Todavía no hay miembros añadidos directamente a este proyecto.
            </li>
          )}
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 border-t px-4 py-3 first:border-t-0"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-semibold"
                style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}
              >
                {initials(m.profiles?.full_name || m.profiles?.email || "?")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{m.profiles?.full_name || m.profiles?.email}</div>
                <div className="truncate text-xs" style={{ color: "var(--ink-faint)" }}>{m.profiles?.email}</div>
              </div>
              {isAdmin ? (
                <RoleSelect value={m.project_role} onChange={updateProjectMemberRole.bind(null, projectId, m.id)} />
              ) : (
                <span className="text-xs" style={{ color: "var(--ink-faint)" }}>{ROLE_LABEL[m.project_role]}</span>
              )}
              {isAdmin && (
                <form action={removeProjectMember.bind(null, projectId, m.id)}>
                  <ConfirmSubmitButton
                    confirmMessage={`¿Quitar a ${m.profiles?.email} de este proyecto?`}
                    className="text-xs"
                    style={{ color: "var(--red)" }}
                  >
                    Quitar
                  </ConfirmSubmitButton>
                </form>
              )}
            </li>
          ))}
        </ul>

        {isAdmin && (
          <form
            action={async (formData: FormData) => {
              "use server";
              const email = String(formData.get("email") ?? "");
              const role = formData.get("role") as (typeof ASSIGNABLE_ROLES)[number];
              await inviteProjectMember(projectId, email, role);
            }}
            className="flex flex-wrap items-end gap-2 border-t px-4 py-3"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-[10.5px] tracking-wide uppercase" style={{ color: "var(--ink-faint)" }}>
                Invitar por email
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="nombre@proveedor.com"
                className="w-full rounded-sm border px-2.5 py-1.5 text-sm"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              />
            </div>
            <select
              name="role"
              defaultValue="INSTALLER"
              className="rounded-sm border px-2.5 py-1.5 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-sm px-3 py-1.5 text-sm font-semibold text-white"
              style={{ background: "var(--brand)" }}
            >
              Invitar
            </button>
          </form>
        )}
      </section>

      {/* Equipos */}
      <section className="rounded-md border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold">Equipos</h2>
          <p className="mt-0.5 text-xs" style={{ color: "var(--ink-faint)" }}>
            Un equipo agrupa personas (p.ej. un proveedor de instalación) y se puede
            enganchar al proyecto completo con un rol.
          </p>
        </div>

        {teamsWithMembers.length === 0 && (
          <div className="px-4 py-6 text-center text-sm" style={{ color: "var(--ink-faint)" }}>
            Todavía no hay equipos en esta organización.
          </div>
        )}

        {teamsWithMembers.map(({ team, members: tMembers }) => {
          const access = teamAccess.find((a) => a.team_id === team.id);
          return (
            <div key={team.id} className="border-t px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{team.name}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                  style={{ background: "var(--surface-2)", color: "var(--ink-faint)" }}
                >
                  {team.kind === "EXTERNAL_PROVIDER" ? "Proveedor externo" : "Interno"}
                </span>
                {team.is_management && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                    style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}
                  >
                    Management
                  </span>
                )}

                <div className="ml-auto flex items-center gap-2">
                  {access ? (
                    <>
                      <span className="text-xs" style={{ color: "var(--ink-faint)" }}>
                        Acceso al proyecto:
                      </span>
                      {isAdmin ? (
                        <RoleSelect
                          value={access.project_role}
                          onChange={grantProjectTeamAccess.bind(null, projectId, team.id)}
                        />
                      ) : (
                        <span className="text-xs">{ROLE_LABEL[access.project_role]}</span>
                      )}
                      {isAdmin && (
                        <form action={revokeProjectTeamAccess.bind(null, projectId, access.id)}>
                          <button type="submit" className="text-xs" style={{ color: "var(--red)" }}>
                            Quitar acceso
                          </button>
                        </form>
                      )}
                    </>
                  ) : (
                    isAdmin && (
                      <form
                        action={async (formData: FormData) => {
                          "use server";
                          const role = formData.get("role") as (typeof ASSIGNABLE_ROLES)[number];
                          await grantProjectTeamAccess(projectId, team.id, role);
                        }}
                        className="flex items-center gap-2"
                      >
                        <select
                          name="role"
                          defaultValue="INSTALLER"
                          className="rounded-sm border px-2 py-1 text-xs"
                          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                        >
                          {ASSIGNABLE_ROLES.map((r) => (
                            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                          ))}
                        </select>
                        <button type="submit" className="text-xs" style={{ color: "var(--accent-ink)" }}>
                          Dar acceso a este proyecto
                        </button>
                      </form>
                    )
                  )}
                </div>
              </div>

              <ul className="mt-2 flex flex-wrap gap-2">
                {tMembers.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-full px-2.5 py-1 text-xs"
                    style={{ background: "var(--surface-2)", color: "var(--ink-soft)" }}
                  >
                    {m.profiles?.full_name || m.profiles?.email}
                  </li>
                ))}
              </ul>

              {isAdmin && (
                <form
                  action={async (formData: FormData) => {
                    "use server";
                    const email = String(formData.get("email") ?? "");
                    await addTeamMember(projectId, team.id, email);
                  }}
                  className="mt-2 flex items-center gap-2"
                >
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Añadir miembro por email"
                    className="rounded-sm border px-2 py-1 text-xs"
                    style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                  />
                  <button type="submit" className="text-xs" style={{ color: "var(--accent-ink)" }}>
                    Añadir
                  </button>
                </form>
              )}
            </div>
          );
        })}

        {isAdmin && (
          <form
            action={async (formData: FormData) => {
              "use server";
              const name = String(formData.get("name") ?? "");
              const kind = formData.get("kind") as "INTERNAL" | "EXTERNAL_PROVIDER";
              const isManagement = formData.get("isManagement") === "on";
              await createTeam(projectId, project.organization_id, name, kind, isManagement);
            }}
            className="flex flex-wrap items-end gap-2 border-t px-4 py-3"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex-1 min-w-[180px]">
              <label className="mb-1 block text-[10.5px] tracking-wide uppercase" style={{ color: "var(--ink-faint)" }}>
                Nuevo equipo
              </label>
              <input
                name="name"
                required
                placeholder="Proveedor Instalación A"
                className="w-full rounded-sm border px-2.5 py-1.5 text-sm"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              />
            </div>
            <select
              name="kind"
              defaultValue="EXTERNAL_PROVIDER"
              className="rounded-sm border px-2.5 py-1.5 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <option value="INTERNAL">Interno</option>
              <option value="EXTERNAL_PROVIDER">Proveedor externo</option>
            </select>
            <label className="flex items-center gap-1.5 pb-1.5 text-xs" style={{ color: "var(--ink-soft)" }}>
              <input type="checkbox" name="isManagement" />
              Management
            </label>
            <button
              type="submit"
              className="rounded-sm px-3 py-1.5 text-sm font-semibold text-white"
              style={{ background: "var(--brand)" }}
            >
              Crear equipo
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
