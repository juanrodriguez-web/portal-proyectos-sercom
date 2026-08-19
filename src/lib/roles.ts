import type { AppRole } from "@/lib/queries/team";

// Modulo de datos puro (sin "use client"): se puede importar tanto
// desde Server Components como desde Client Components sin cruzar la
// frontera RSC. Exportar estas constantes desde un archivo "use client"
// rompe en build de produccion (aunque funcione en dev) porque el
// export deja de ser el array real al llegar al lado servidor.
export const ROLE_LABEL: Record<AppRole, string> = {
  ADMIN: "Admin",
  COORDINATOR: "Coordinador",
  OPERATIONS: "Operations",
  INSTALLER: "Instalador",
  VIEWER: "Viewer",
};

export const ASSIGNABLE_ROLES: AppRole[] = ["COORDINATOR", "OPERATIONS", "INSTALLER", "VIEWER"];
