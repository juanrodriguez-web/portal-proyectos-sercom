import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";
import type { AppRole } from "@/lib/queries/team";

export type TemplateTask = {
  id: string;
  title: string;
  is_mandatory: boolean;
  gate: string | null;
  requires_evidence: boolean;
  relative_day_offset: number | null;
  default_assignee_role: AppRole | null;
};

export type TemplatePhase = {
  id: string;
  name: string;
  order_index: number;
  template_tasks: TemplateTask[];
};

export type TemplateVersion = {
  id: string;
  version_label: string;
  is_active: boolean;
  template_phases: TemplatePhase[];
};

export type Template = {
  id: string;
  name: string;
  description: string | null;
  template_versions: TemplateVersion[];
};

// RLS: project_templates_select = is_org_member. Cualquiera con acceso
// a la organizacion ve el catalogo; solo ADMIN puede escribir (RLS de
// las tablas de plantilla exige is_org_admin, ver 0003_rls.sql).
export async function listTemplates(organizationId: string): Promise<Template[]> {
  await getSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_templates")
    .select(
      "id, name, description, template_versions(id, version_label, is_active, template_phases(id, name, order_index, template_tasks(id, title, is_mandatory, gate, requires_evidence, relative_day_offset, default_assignee_role)))"
    )
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as Template[];
}
