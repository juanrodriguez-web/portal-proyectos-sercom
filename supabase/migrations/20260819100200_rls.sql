-- Gestor de Proyectos SERCOM - Vodafone
-- 0003: Row Level Security
--
-- Principio (spec 4.8): si el usuario no esta autorizado, la fila debe
-- ser inaccesible aunque conozca su ID. Ocultar en frontend no basta.
-- Toda tabla operativa se habilita con RLS y SIN policy permisiva por
-- defecto (deny-by-default); cada policy añade un caso concreto.
--
-- Nota: RLS de Postgres es a nivel de fila, no de columna. Restricciones
-- mas finas (p.ej. INSTALLER no puede tocar la planificacion global de
-- una work_unit aunque tenga UPDATE en la fila por ser el assignee de
-- una tarea) se aplican en la capa de aplicacion/Server Actions.

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table organization_members enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table project_team_access enable row level security;
alter table work_units enable row level security;
alter table work_unit_assignments enable row level security;
alter table work_unit_team_access enable row level security;
alter table work_unit_phases enable row level security;
alter table milestones enable row level security;
alter table project_templates enable row level security;
alter table template_versions enable row level security;
alter table template_phases enable row level security;
alter table template_tasks enable row level security;
alter table template_task_dependencies enable row level security;
alter table template_evidence_requirements enable row level security;
alter table tasks enable row level security;
alter table task_dependencies enable row level security;
alter table task_collaborators enable row level security;
alter table task_assignment_history enable row level security;
alter table evidence_requirements enable row level security;
alter table incidents enable row level security;
alter table comments enable row level security;
alter table attachments enable row level security;
alter table equipment enable row level security;
alter table equipment_assignments enable row level security;
alter table role_permissions enable row level security;
alter table audit_events enable row level security;

-- ---------------------------------------------------------
-- organizations / profiles / organization_members
-- ---------------------------------------------------------
create policy organizations_select on organizations for select
  using (public.is_org_member(id));
create policy organizations_update on organizations for update
  using (public.is_org_admin(id));

create policy profiles_select_self on profiles for select
  using (id = auth.uid());
create policy profiles_select_org_peers on profiles for select
  using (exists (
    select 1 from organization_members me
    join organization_members them on them.organization_id = me.organization_id
    where me.user_id = auth.uid() and them.user_id = profiles.id
  ));
create policy profiles_update_self on profiles for update
  using (id = auth.uid());

create policy organization_members_select on organization_members for select
  using (public.is_org_member(organization_id));
create policy organization_members_write on organization_members for all
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

-- ---------------------------------------------------------
-- teams / team_members
-- ---------------------------------------------------------
create policy teams_select on teams for select
  using (public.is_org_member(organization_id));
create policy teams_write on teams for all
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy team_members_select on team_members for select
  using (public.is_org_member(public.team_org_id(team_id)));
create policy team_members_write on team_members for all
  using (public.is_org_admin(public.team_org_id(team_id)))
  with check (public.is_org_admin(public.team_org_id(team_id)));

-- ---------------------------------------------------------
-- projects / project_members / project_team_access
-- ---------------------------------------------------------
create policy projects_select on projects for select
  using (public.has_project_access(id));
create policy projects_insert on projects for insert
  with check (public.is_org_admin(organization_id));
create policy projects_update on projects for update
  using (public.project_role(id) = 'ADMIN');

create policy project_members_select on project_members for select
  using (public.has_project_access(project_id));
create policy project_members_write on project_members for all
  using (public.project_role(project_id) = 'ADMIN')
  with check (public.project_role(project_id) = 'ADMIN');

create policy project_team_access_select on project_team_access for select
  using (public.has_project_access(project_id));
create policy project_team_access_write on project_team_access for all
  using (public.project_role(project_id) = 'ADMIN')
  with check (public.project_role(project_id) = 'ADMIN');

-- ---------------------------------------------------------
-- work_units y accesos asociados
-- ---------------------------------------------------------
create policy work_units_select on work_units for select
  using (public.has_work_unit_access(id));
create policy work_units_insert on work_units for insert
  with check (public.project_role(project_id) in ('ADMIN', 'COORDINATOR'));
create policy work_units_update on work_units for update
  using (public.work_unit_role(id) in ('ADMIN', 'COORDINATOR', 'OPERATIONS'));

create policy work_unit_assignments_select on work_unit_assignments for select
  using (public.has_work_unit_access(work_unit_id));
create policy work_unit_assignments_write on work_unit_assignments for all
  using (public.work_unit_role(work_unit_id) in ('ADMIN', 'COORDINATOR'))
  with check (public.work_unit_role(work_unit_id) in ('ADMIN', 'COORDINATOR'));

create policy work_unit_team_access_select on work_unit_team_access for select
  using (public.has_work_unit_access(work_unit_id));
create policy work_unit_team_access_write on work_unit_team_access for all
  using (public.work_unit_role(work_unit_id) in ('ADMIN', 'COORDINATOR'))
  with check (public.work_unit_role(work_unit_id) in ('ADMIN', 'COORDINATOR'));

create policy work_unit_phases_select on work_unit_phases for select
  using (public.has_work_unit_access(work_unit_id));
create policy work_unit_phases_write on work_unit_phases for all
  using (public.work_unit_role(work_unit_id) in ('ADMIN', 'COORDINATOR'))
  with check (public.work_unit_role(work_unit_id) in ('ADMIN', 'COORDINATOR'));

create policy milestones_select on milestones for select
  using (public.has_work_unit_access(work_unit_id));
create policy milestones_write on milestones for all
  using (public.work_unit_role(work_unit_id) in ('ADMIN', 'COORDINATOR', 'OPERATIONS'))
  with check (public.work_unit_role(work_unit_id) in ('ADMIN', 'COORDINATOR', 'OPERATIONS'));

-- ---------------------------------------------------------
-- plantillas: gestion exclusiva de ADMIN (MANAGE_TEMPLATE, spec 4.1)
-- ---------------------------------------------------------
create policy project_templates_select on project_templates for select
  using (public.is_org_member(organization_id));
create policy project_templates_write on project_templates for all
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy template_versions_select on template_versions for select
  using (public.is_org_member((select organization_id from project_templates where id = template_id)));
create policy template_versions_write on template_versions for all
  using (public.is_org_admin((select organization_id from project_templates where id = template_id)))
  with check (public.is_org_admin((select organization_id from project_templates where id = template_id)));

create policy template_phases_select on template_phases for select
  using (public.is_org_member((
    select pt.organization_id from template_versions tv
    join project_templates pt on pt.id = tv.template_id
    where tv.id = template_version_id
  )));
create policy template_phases_write on template_phases for all
  using (public.is_org_admin((
    select pt.organization_id from template_versions tv
    join project_templates pt on pt.id = tv.template_id
    where tv.id = template_version_id
  )))
  with check (public.is_org_admin((
    select pt.organization_id from template_versions tv
    join project_templates pt on pt.id = tv.template_id
    where tv.id = template_version_id
  )));

create policy template_tasks_select on template_tasks for select
  using (public.is_org_member((
    select pt.organization_id from template_phases tp
    join template_versions tv on tv.id = tp.template_version_id
    join project_templates pt on pt.id = tv.template_id
    where tp.id = template_phase_id
  )));
create policy template_tasks_write on template_tasks for all
  using (public.is_org_admin((
    select pt.organization_id from template_phases tp
    join template_versions tv on tv.id = tp.template_version_id
    join project_templates pt on pt.id = tv.template_id
    where tp.id = template_phase_id
  )))
  with check (public.is_org_admin((
    select pt.organization_id from template_phases tp
    join template_versions tv on tv.id = tp.template_version_id
    join project_templates pt on pt.id = tv.template_id
    where tp.id = template_phase_id
  )));

create policy template_task_dependencies_select on template_task_dependencies for select
  using (public.is_org_member((
    select pt.organization_id from template_tasks tt
    join template_phases tp on tp.id = tt.template_phase_id
    join template_versions tv on tv.id = tp.template_version_id
    join project_templates pt on pt.id = tv.template_id
    where tt.id = template_task_id
  )));
create policy template_task_dependencies_write on template_task_dependencies for all
  using (public.is_org_admin((
    select pt.organization_id from template_tasks tt
    join template_phases tp on tp.id = tt.template_phase_id
    join template_versions tv on tv.id = tp.template_version_id
    join project_templates pt on pt.id = tv.template_id
    where tt.id = template_task_id
  )))
  with check (public.is_org_admin((
    select pt.organization_id from template_tasks tt
    join template_phases tp on tp.id = tt.template_phase_id
    join template_versions tv on tv.id = tp.template_version_id
    join project_templates pt on pt.id = tv.template_id
    where tt.id = template_task_id
  )));

create policy template_evidence_requirements_select on template_evidence_requirements for select
  using (public.is_org_member((
    select pt.organization_id from template_tasks tt
    join template_phases tp on tp.id = tt.template_phase_id
    join template_versions tv on tv.id = tp.template_version_id
    join project_templates pt on pt.id = tv.template_id
    where tt.id = template_task_id
  )));
create policy template_evidence_requirements_write on template_evidence_requirements for all
  using (public.is_org_admin((
    select pt.organization_id from template_tasks tt
    join template_phases tp on tp.id = tt.template_phase_id
    join template_versions tv on tv.id = tp.template_version_id
    join project_templates pt on pt.id = tv.template_id
    where tt.id = template_task_id
  )))
  with check (public.is_org_admin((
    select pt.organization_id from template_tasks tt
    join template_phases tp on tp.id = tt.template_phase_id
    join template_versions tv on tv.id = tp.template_version_id
    join project_templates pt on pt.id = tv.template_id
    where tt.id = template_task_id
  )));

-- ---------------------------------------------------------
-- tasks y dependientes
-- ---------------------------------------------------------
create policy tasks_select on tasks for select
  using (public.has_work_unit_access(work_unit_id));
create policy tasks_insert on tasks for insert
  with check (public.work_unit_role(work_unit_id) in ('ADMIN', 'COORDINATOR'));
create policy tasks_update on tasks for update
  using (
    public.work_unit_role(work_unit_id) in ('ADMIN', 'COORDINATOR', 'OPERATIONS')
    or (public.work_unit_role(work_unit_id) = 'INSTALLER' and assignee_id = auth.uid())
  );
create policy tasks_delete on tasks for delete
  using (public.work_unit_role(work_unit_id) in ('ADMIN', 'COORDINATOR'));

create policy task_dependencies_select on task_dependencies for select
  using (public.has_work_unit_access(public.task_work_unit_id(task_id)));
create policy task_dependencies_write on task_dependencies for all
  using (public.work_unit_role(public.task_work_unit_id(task_id)) in ('ADMIN', 'COORDINATOR'))
  with check (public.work_unit_role(public.task_work_unit_id(task_id)) in ('ADMIN', 'COORDINATOR'));

create policy task_collaborators_select on task_collaborators for select
  using (public.has_work_unit_access(public.task_work_unit_id(task_id)));
create policy task_collaborators_write on task_collaborators for all
  using (public.work_unit_role(public.task_work_unit_id(task_id)) in ('ADMIN', 'COORDINATOR'))
  with check (public.work_unit_role(public.task_work_unit_id(task_id)) in ('ADMIN', 'COORDINATOR'));

create policy task_assignment_history_select on task_assignment_history for select
  using (public.has_work_unit_access(public.task_work_unit_id(task_id)));
create policy task_assignment_history_insert on task_assignment_history for insert
  with check (public.work_unit_role(public.task_work_unit_id(task_id)) in ('ADMIN', 'COORDINATOR'));

create policy evidence_requirements_select on evidence_requirements for select
  using (public.has_work_unit_access(public.task_work_unit_id(task_id)));
create policy evidence_requirements_write on evidence_requirements for all
  using (public.work_unit_role(public.task_work_unit_id(task_id)) in ('ADMIN', 'COORDINATOR'))
  with check (public.work_unit_role(public.task_work_unit_id(task_id)) in ('ADMIN', 'COORDINATOR'));

-- ---------------------------------------------------------
-- incidents
-- ---------------------------------------------------------
create policy incidents_select on incidents for select
  using (public.has_work_unit_access(work_unit_id));
create policy incidents_insert on incidents for insert
  with check (public.has_work_unit_access(work_unit_id));
create policy incidents_update on incidents for update
  using (public.work_unit_role(work_unit_id) in ('ADMIN', 'COORDINATOR', 'OPERATIONS'));

-- ---------------------------------------------------------
-- comments / attachments: acceso a la unidad + regla de visibilidad
-- ---------------------------------------------------------
create policy comments_select on comments for select
  using (
    public.has_work_unit_access(work_unit_id)
    and public.can_see_visibility(public.project_org_id(project_id), visibility)
  );
create policy comments_insert on comments for insert
  with check (public.has_work_unit_access(work_unit_id) and author_id = auth.uid());
create policy comments_update on comments for update
  using (author_id = auth.uid() or public.work_unit_role(work_unit_id) = 'ADMIN');
create policy comments_delete on comments for delete
  using (author_id = auth.uid() or public.work_unit_role(work_unit_id) = 'ADMIN');

create policy attachments_select on attachments for select
  using (
    public.has_work_unit_access(work_unit_id)
    and public.can_see_visibility(public.project_org_id(project_id), visibility)
  );
-- Los inserts "normales" de evidencias se hacen desde un endpoint server-side
-- con service role tras subir a Drive (spec 18.3). Esta policy es defensa
-- en profundidad si en algun momento se permite insert directo autenticado.
create policy attachments_insert on attachments for insert
  with check (public.has_work_unit_access(work_unit_id) and uploaded_by = auth.uid());
create policy attachments_update on attachments for update
  using (
    uploaded_by = auth.uid()
    or public.work_unit_role(work_unit_id) in ('ADMIN', 'COORDINATOR')
  );

-- ---------------------------------------------------------
-- equipment
-- ---------------------------------------------------------
create policy equipment_select on equipment for select
  using (public.has_project_access(project_id));
create policy equipment_write on equipment for all
  using (public.project_role(project_id) in ('ADMIN', 'COORDINATOR'))
  with check (public.project_role(project_id) in ('ADMIN', 'COORDINATOR'));

create policy equipment_assignments_select on equipment_assignments for select
  using (public.has_work_unit_access(work_unit_id));
create policy equipment_assignments_write on equipment_assignments for all
  using (public.work_unit_role(work_unit_id) in ('ADMIN', 'COORDINATOR'))
  with check (public.work_unit_role(work_unit_id) in ('ADMIN', 'COORDINATOR'));

-- ---------------------------------------------------------
-- role_permissions: catalogo de solo lectura para usuarios autenticados,
-- editable solo por ADMIN de alguna organizacion (uso interno/soporte).
-- ---------------------------------------------------------
create policy role_permissions_select on role_permissions for select
  using (auth.role() = 'authenticated');

-- ---------------------------------------------------------
-- audit_events: sin policy de insert/update/delete para 'authenticated'
-- -> deny by default, solo escribe el trigger SECURITY DEFINER o el
-- service role. VIEW_AUDIT (spec 4.1) es, de partida, cosa de ADMIN.
-- ---------------------------------------------------------
create policy audit_events_select on audit_events for select
  using (
    organization_id is not null and public.is_org_admin(organization_id)
  );
