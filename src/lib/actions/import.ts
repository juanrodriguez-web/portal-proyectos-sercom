"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProjectRole } from "@/lib/dal";
import { getProject } from "@/lib/queries/projects";
import { parseWorkUnitsCsv } from "@/lib/import/work-units-import";
import { applyTemplateToWorkUnits } from "@/lib/template-engine";

export type ImportSummary = {
  imported: number;
  skipped: { line: number; reason: string }[];
  templateApplied: number;
};

// ADMIN/COORDINATOR pueden importar (spec 4.2: COORDINATOR "crear y
// editar unidades de trabajo"). El resto de comprobaciones vive en RLS
// para los inserts concretos.
export async function importWorkUnitsCsv(projectId: string, formData: FormData): Promise<ImportSummary> {
  const role = await getProjectRole(projectId);
  if (role !== "ADMIN" && role !== "COORDINATOR") {
    throw new Error("Solo ADMIN o COORDINATOR pueden importar unidades.");
  }

  const project = await getProject(projectId);
  if (!project) throw new Error("Proyecto no encontrado.");

  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No se ha subido ningún archivo.");
  if (!file.name.toLowerCase().endsWith(".csv")) {
    throw new Error(
      "Solo se admite CSV por ahora. XLSX está pendiente: la librería estándar para leerlo en npm (xlsx/SheetJS) tiene vulnerabilidades sin parchear en el vector de subida de archivos de usuario."
    );
  }

  const text = await file.text();
  const { rows, skipped } = parseWorkUnitsCsv(text);

  if (rows.length === 0) {
    return { imported: 0, skipped, templateApplied: 0 };
  }

  const supabase = await createClient();
  const payload = rows.map((r) => ({ project_id: projectId, ...r }));

  // OJO: no encadenar .select() aqui. Un upsert/insert con
  // Prefer:return=representation en "work_units" dispara, para poder
  // devolver la fila, la policy de SELECT (has_work_unit_access(id)),
  // que internamente vuelve a leer la propia fila por id para resolver
  // su project_id/organization_id. Esa relectura de la fila recien
  // insertada, dentro del mismo INSERT...RETURNING, falla con 42501 en
  // Supabase (mismo problema que "projects"; da igual que el usuario
  // sea ADMIN). Separar el write de la lectura posterior lo evita.
  const { error: upsertError } = await supabase
    .from("work_units")
    .upsert(payload, { onConflict: "project_id,code" });
  if (upsertError) throw upsertError;

  const { data: upserted, error: fetchError } = await supabase
    .from("work_units")
    .select("id")
    .eq("project_id", projectId)
    .in("code", rows.map((r) => r.code));
  if (fetchError) throw fetchError;

  const { applied } = await applyTemplateToWorkUnits(
    supabase,
    project.organization_id,
    (upserted ?? []).map((u) => u.id)
  );

  revalidatePath(`/proyectos/${projectId}/unidades`);
  revalidatePath(`/proyectos/${projectId}`);

  return { imported: upserted?.length ?? 0, skipped, templateApplied: applied };
}
