import { notFound } from "next/navigation";
import { getProject } from "@/lib/queries/projects";
import { getCurrentProfile } from "@/lib/dal";
import { ProjectRail } from "@/components/nav/project-rail";
import { Topbar } from "@/components/nav/topbar";

export default async function ProjectLayout({
  children,
  params,
}: LayoutProps<"/proyectos/[projectId]">) {
  const { projectId } = await params;

  // Si el proyecto no existe O el usuario no tiene acceso, getProject
  // devuelve null en ambos casos (RLS): la unidad/proyecto es
  // inaccesible aunque se conozca el ID (spec 4.8).
  const [project, profile] = await Promise.all([
    getProject(projectId),
    getCurrentProfile(),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--paper)" }}>
      <ProjectRail projectId={project.id} projectName={project.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar breadcrumb={project.name} userLabel={profile.full_name ?? profile.email} />
        <div className="min-w-0 flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
