-- Gestor de Proyectos SERCOM - Vodafone
-- 0001: extensiones, enums y tablas base
-- Ver SPECS_GESTOR_PROYECTOS_SERCOM_VODAFONE.md secciones 4, 5, 17, 18, 20, 22

create extension if not exists pgcrypto;

-- =========================================================
-- ENUMS
-- =========================================================

create type org_role as enum ('ADMIN', 'MEMBER');
create type team_kind as enum ('INTERNAL', 'EXTERNAL_PROVIDER');

-- Rol operativo, aplicable a nivel de proyecto y de unidad de trabajo.
-- ADMIN aparece aquí también para poder registrar overrides explícitos,
-- aunque su alcance real (organización completa) viene de organization_members.
create type app_role as enum ('ADMIN', 'COORDINATOR', 'OPERATIONS', 'INSTALLER', 'VIEWER');

create type project_status as enum ('ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

create type work_unit_status as enum (
  'PLANIFICADO', 'EN_PREPARACION', 'READY_FOR_INSTALL', 'INSTALLING',
  'PENDING_VALIDATION', 'OPERATIVE', 'BLOCKED', 'CANCELLED', 'ON_HOLD'
);

create type risk_level as enum ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
create type phase_status as enum ('NOT_STARTED', 'IN_PROGRESS', 'DONE');
create type milestone_kind as enum ('READY_FOR_INSTALL', 'INSTALLATION', 'VALIDATION', 'OPERATIVE');
create type task_status as enum ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED');
create type incident_status as enum ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
create type visibility_level as enum ('PARTICIPANTS', 'INTERNAL', 'MANAGEMENT');
create type attachment_status as enum ('ACTIVE', 'REPLACED', 'DELETED_LOGICALLY');

create type action_permission as enum (
  'READ', 'CREATE', 'UPDATE', 'ASSIGN', 'COMPLETE_TASK', 'UPLOAD_EVIDENCE',
  'CREATE_INCIDENT', 'VALIDATE', 'APPROVE', 'MANAGE_TEMPLATE', 'MANAGE_USERS', 'VIEW_AUDIT'
);

-- =========================================================
-- NUCLEO: organizaciones, perfiles, equipos
-- =========================================================

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Perfil ligero 1:1 con auth.users. La pertenencia a organizacion/rol
-- NUNCA se decide aqui: vive en organization_members para que un
-- usuario no pueda auto-asignarse una organizacion via UPDATE.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role org_role not null default 'MEMBER',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  kind team_kind not null default 'INTERNAL',
  -- true para equipos de management: habilita comentarios/adjuntos con visibility = MANAGEMENT
  is_management boolean not null default false,
  created_at timestamptz not null default now()
);

create table team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

-- =========================================================
-- PROYECTOS Y UNIDADES DE TRABAJO
-- =========================================================

create table projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  description text,
  status project_status not null default 'ACTIVE',
  deadline_at date,
  drive_root_folder_id text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  project_role app_role not null,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table project_team_access (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  team_id uuid not null references teams (id) on delete cascade,
  project_role app_role not null,
  created_at timestamptz not null default now(),
  unique (project_id, team_id)
);

create table work_units (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  code text not null,
  name text not null,
  address text,
  postal_code text,
  city text,
  province text,
  lat double precision,
  lng double precision,
  contact_name text,
  contact_phone text,
  contact_email text,
  installer_company text,
  status work_unit_status not null default 'PLANIFICADO',
  -- El riesgo es un concepto independiente del estado operativo (spec 2.4 / 5.3).
  risk_level risk_level not null default 'LOW',
  risk_score int not null default 0,
  installation_planned_at date,
  installation_baseline_at date,
  operative_at timestamptz,
  drive_folder_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, code)
);

create table work_unit_assignments (
  id uuid primary key default gen_random_uuid(),
  work_unit_id uuid not null references work_units (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (work_unit_id, user_id)
);

create table work_unit_team_access (
  id uuid primary key default gen_random_uuid(),
  work_unit_id uuid not null references work_units (id) on delete cascade,
  team_id uuid not null references teams (id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (work_unit_id, team_id)
);

create table work_unit_phases (
  id uuid primary key default gen_random_uuid(),
  work_unit_id uuid not null references work_units (id) on delete cascade,
  template_phase_id uuid,
  name text not null,
  order_index int not null default 0,
  status phase_status not null default 'NOT_STARTED',
  created_at timestamptz not null default now()
);

create table milestones (
  id uuid primary key default gen_random_uuid(),
  work_unit_id uuid not null references work_units (id) on delete cascade,
  kind milestone_kind not null,
  planned_at date,
  actual_at timestamptz,
  created_at timestamptz not null default now(),
  unique (work_unit_id, kind)
);

-- =========================================================
-- PLANTILLAS (versionadas, seccion 6/8)
-- =========================================================

create table project_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references project_templates (id) on delete cascade,
  version_label text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (template_id, version_label)
);

create table template_phases (
  id uuid primary key default gen_random_uuid(),
  template_version_id uuid not null references template_versions (id) on delete cascade,
  name text not null,
  order_index int not null default 0,
  drive_subfolder_name text
);

alter table work_unit_phases
  add constraint work_unit_phases_template_phase_fk
  foreign key (template_phase_id) references template_phases (id);

create table template_tasks (
  id uuid primary key default gen_random_uuid(),
  template_phase_id uuid not null references template_phases (id) on delete cascade,
  title text not null,
  description text,
  default_assignee_role app_role,
  is_mandatory boolean not null default true,
  gate text,
  priority int not null default 0,
  requires_evidence boolean not null default false,
  relative_day_offset int, -- p.ej. -20 = T-20, 0 = T, 1 = T+1
  created_at timestamptz not null default now()
);

create table template_task_dependencies (
  id uuid primary key default gen_random_uuid(),
  template_task_id uuid not null references template_tasks (id) on delete cascade,
  depends_on_template_task_id uuid not null references template_tasks (id) on delete cascade,
  check (template_task_id <> depends_on_template_task_id)
);

create table template_evidence_requirements (
  id uuid primary key default gen_random_uuid(),
  template_task_id uuid not null references template_tasks (id) on delete cascade,
  category text not null,
  min_count int not null default 1,
  instructions text
);

-- =========================================================
-- EJECUCION: tareas
-- =========================================================

create table tasks (
  id uuid primary key default gen_random_uuid(),
  work_unit_id uuid not null references work_units (id) on delete cascade,
  work_unit_phase_id uuid not null references work_unit_phases (id) on delete cascade,
  template_task_id uuid references template_tasks (id),
  title text not null,
  description text,
  status task_status not null default 'NOT_STARTED',
  assignee_id uuid references profiles (id),
  is_mandatory boolean not null default true,
  gate text,
  priority int not null default 0,
  requires_evidence boolean not null default false,
  due_at date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table task_dependencies (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  depends_on_task_id uuid not null references tasks (id) on delete cascade,
  check (task_id <> depends_on_task_id)
);

create table task_collaborators (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (task_id, user_id)
);

create table task_assignment_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  user_id uuid references profiles (id),
  assigned_by uuid references profiles (id),
  assigned_at timestamptz not null default now()
);

create table evidence_requirements (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  category text not null,
  min_count int not null default 1,
  instructions text
);

-- =========================================================
-- OPERACION: incidencias, comentarios, adjuntos, equipamiento
-- =========================================================

create table incidents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  work_unit_id uuid not null references work_units (id) on delete cascade,
  category text not null,
  severity risk_level not null default 'MEDIUM',
  description text not null,
  status incident_status not null default 'OPEN',
  assignee_id uuid references profiles (id),
  opened_at timestamptz not null default now(),
  target_at date,
  resolved_at timestamptz,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  work_unit_id uuid not null references work_units (id) on delete cascade,
  task_id uuid references tasks (id) on delete set null,
  incident_id uuid references incidents (id) on delete set null,
  author_id uuid not null references profiles (id),
  body text not null,
  visibility visibility_level not null default 'PARTICIPANTS',
  created_at timestamptz not null default now()
);

create table attachments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  work_unit_id uuid not null references work_units (id) on delete cascade,
  task_id uuid references tasks (id) on delete set null,
  incident_id uuid references incidents (id) on delete set null,
  drive_file_id text not null,
  drive_folder_id text not null,
  original_filename text not null,
  normalized_filename text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  evidence_category text,
  visibility visibility_level not null default 'PARTICIPANTS',
  status attachment_status not null default 'ACTIVE',
  uploaded_by uuid references profiles (id),
  uploaded_by_email_snapshot text,
  created_at timestamptz not null default now()
);

create table equipment (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  kind text not null,
  serial_number text,
  status text not null default 'IN_STOCK',
  created_at timestamptz not null default now()
);

create table equipment_assignments (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references equipment (id) on delete cascade,
  work_unit_id uuid not null references work_units (id) on delete cascade,
  assigned_by uuid references profiles (id),
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz
);

-- =========================================================
-- PERMISOS Y AUDITORIA
-- =========================================================

create table role_permissions (
  id uuid primary key default gen_random_uuid(),
  role app_role not null,
  permission action_permission not null,
  unique (role, permission)
);

-- Append-only. No hay policy de insert/update/delete para 'authenticated':
-- solo se escribe desde triggers SECURITY DEFINER o el service role.
create table audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations (id),
  project_id uuid references projects (id),
  work_unit_id uuid references work_units (id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor_user_id uuid references profiles (id),
  actor_name_snapshot text,
  actor_email_snapshot text,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- =========================================================
-- INDICES
-- =========================================================

create index idx_organization_members_org_user on organization_members (organization_id, user_id);
create index idx_team_members_team_user on team_members (team_id, user_id);
create index idx_projects_org on projects (organization_id);
create index idx_project_members_project_user on project_members (project_id, user_id);
create index idx_project_team_access_project on project_team_access (project_id);
create index idx_work_units_project on work_units (project_id);
create index idx_work_units_status on work_units (status);
create index idx_work_unit_assignments_unit_user on work_unit_assignments (work_unit_id, user_id);
create index idx_work_unit_team_access_unit on work_unit_team_access (work_unit_id);
create index idx_work_unit_phases_unit on work_unit_phases (work_unit_id);
create index idx_milestones_unit on milestones (work_unit_id);
create index idx_template_versions_template on template_versions (template_id);
create index idx_template_phases_version on template_phases (template_version_id);
create index idx_template_tasks_phase on template_tasks (template_phase_id);
create index idx_tasks_work_unit on tasks (work_unit_id);
create index idx_tasks_assignee on tasks (assignee_id);
create index idx_tasks_status on tasks (status);
create index idx_task_dependencies_task on task_dependencies (task_id);
create index idx_evidence_requirements_task on evidence_requirements (task_id);
create index idx_incidents_work_unit on incidents (work_unit_id);
create index idx_incidents_status on incidents (status);
create index idx_comments_work_unit on comments (work_unit_id);
create index idx_attachments_work_unit on attachments (work_unit_id);
create index idx_attachments_status on attachments (status);
create index idx_equipment_project on equipment (project_id);
create index idx_equipment_assignments_unit on equipment_assignments (work_unit_id);
create index idx_audit_events_project_created on audit_events (project_id, created_at desc);
create index idx_audit_events_work_unit_created on audit_events (work_unit_id, created_at desc);
