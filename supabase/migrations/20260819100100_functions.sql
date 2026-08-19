-- Gestor de Proyectos SERCOM - Vodafone
-- 0002: funciones helper para RLS + triggers de mantenimiento y auditoria
--
-- Todas las funciones son SECURITY DEFINER con search_path fijo para que
-- puedan leer tablas de control de acceso (organization_members, project_members, ...)
-- sin quedar bloqueadas por el propio RLS de esas tablas, evitando recursion.
-- auth.uid() siempre se resuelve a partir del JWT de la sesion actual: nunca
-- se confia en un user_id enviado por el cliente.

-- ---------------------------------------------------------
-- Ranking de roles, para resolver el "mas privilegiado" cuando
-- un usuario tiene acceso por varias vias (directo + equipo).
-- ---------------------------------------------------------
create or replace function public.role_rank(r app_role) returns int
language sql immutable as $$
  select case r
    when 'ADMIN' then 5
    when 'OPERATIONS' then 4
    when 'COORDINATOR' then 3
    when 'INSTALLER' then 2
    when 'VIEWER' then 1
  end;
$$;

-- ---------------------------------------------------------
-- Organizacion
-- ---------------------------------------------------------
create or replace function public.is_org_admin(p_org_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from organization_members
    where organization_id = p_org_id and user_id = auth.uid() and role = 'ADMIN'
  );
$$;

create or replace function public.is_org_member(p_org_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from organization_members
    where organization_id = p_org_id and user_id = auth.uid()
  );
$$;

create or replace function public.team_org_id(p_team_id uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select organization_id from teams where id = p_team_id;
$$;

-- ---------------------------------------------------------
-- Proyecto: rol efectivo del usuario actual para un proyecto.
-- ADMIN de la organizacion del proyecto -> ADMIN.
-- Si no, el mayor rol entre project_members directo y
-- project_team_access via team_members. NULL si no tiene acceso.
-- ---------------------------------------------------------
create or replace function public.project_org_id(p_project_id uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select organization_id from projects where id = p_project_id;
$$;

create or replace function public.project_role(p_project_id uuid) returns app_role
language sql stable security definer set search_path = public as $$
  select role from (
    select 'ADMIN'::app_role as role
    where public.is_org_admin(public.project_org_id(p_project_id))
    union all
    select project_role as role from project_members
    where project_id = p_project_id and user_id = auth.uid()
    union all
    select pta.project_role as role from project_team_access pta
      join team_members tm on tm.team_id = pta.team_id
    where pta.project_id = p_project_id and tm.user_id = auth.uid()
  ) roles
  order by public.role_rank(role) desc
  limit 1;
$$;

create or replace function public.has_project_access(p_project_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.project_role(p_project_id) is not null;
$$;

-- ---------------------------------------------------------
-- Unidad de trabajo: rol efectivo del usuario actual.
-- COORDINATOR/OPERATIONS/ADMIN a nivel de proyecto heredan acceso a
-- TODAS las unidades del proyecto (spec 4.2/4.3). INSTALLER/VIEWER
-- necesitan asignacion explicita en work_unit_assignments o via equipo
-- en work_unit_team_access (spec 4.4).
-- ---------------------------------------------------------
create or replace function public.work_unit_project_id(p_work_unit_id uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select project_id from work_units where id = p_work_unit_id;
$$;

create or replace function public.work_unit_role(p_work_unit_id uuid) returns app_role
language sql stable security definer set search_path = public as $$
  select role from (
    select public.project_role(public.work_unit_project_id(p_work_unit_id)) as role
    where public.project_role(public.work_unit_project_id(p_work_unit_id)) in ('ADMIN', 'COORDINATOR', 'OPERATIONS')
    union all
    select role from work_unit_assignments
    where work_unit_id = p_work_unit_id and user_id = auth.uid()
    union all
    select wta.role from work_unit_team_access wta
      join team_members tm on tm.team_id = wta.team_id
    where wta.work_unit_id = p_work_unit_id and tm.user_id = auth.uid()
  ) roles
  order by public.role_rank(role) desc
  limit 1;
$$;

create or replace function public.has_work_unit_access(p_work_unit_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.work_unit_role(p_work_unit_id) is not null;
$$;

create or replace function public.task_work_unit_id(p_task_id uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select work_unit_id from tasks where id = p_task_id;
$$;

-- ---------------------------------------------------------
-- Permisos por accion (matriz configurable, spec 4.7 / 16).
-- ---------------------------------------------------------
create or replace function public.has_permission(p_role app_role, p_permission action_permission) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from role_permissions where role = p_role and permission = p_permission
  );
$$;

-- ---------------------------------------------------------
-- Visibilidad de comentarios/adjuntos (spec 4.6).
-- p_org_id: organizacion propietaria del recurso (via project_org_id).
-- ---------------------------------------------------------
create or replace function public.can_see_visibility(p_org_id uuid, p_visibility visibility_level) returns boolean
language sql stable security definer set search_path = public as $$
  select case p_visibility
    when 'PARTICIPANTS' then true
    when 'INTERNAL' then public.is_org_member(p_org_id)
    when 'MANAGEMENT' then (
      public.is_org_admin(p_org_id)
      or exists (
        select 1 from team_members tm
        join teams t on t.id = tm.team_id
        where t.organization_id = p_org_id and t.is_management and tm.user_id = auth.uid()
      )
    )
  end;
$$;

-- ---------------------------------------------------------
-- updated_at automatico
-- ---------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on profiles for each row execute function public.set_updated_at();
create trigger set_updated_at before update on projects for each row execute function public.set_updated_at();
create trigger set_updated_at before update on work_units for each row execute function public.set_updated_at();
create trigger set_updated_at before update on tasks for each row execute function public.set_updated_at();
create trigger set_updated_at before update on incidents for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- Alta automatica de profiles al crear un auth.users.
-- La organizacion NO se asigna aqui (queda en cero acceso, spec 4.1);
-- se hace despues via organization_members desde un flujo server-side
-- con service role.
-- ---------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------
-- Auditoria append-only (spec 20). Se dispara en las entidades
-- operativas clave; nunca depende del frontend para registrarse.
-- ---------------------------------------------------------
create or replace function public.log_audit_event() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_actor_name text;
  v_actor_email text;
  v_project_id uuid;
  v_work_unit_id uuid;
  v_org_id uuid;
begin
  select full_name, email into v_actor_name, v_actor_email from profiles where id = v_actor;

  if TG_TABLE_NAME = 'work_units' then
    v_work_unit_id := coalesce(new.id, old.id);
    v_project_id := coalesce(new.project_id, old.project_id);
  elsif TG_TABLE_NAME = 'tasks' then
    v_work_unit_id := coalesce(new.work_unit_id, old.work_unit_id);
    select project_id into v_project_id from work_units where id = v_work_unit_id;
  elsif TG_TABLE_NAME = 'incidents' then
    v_work_unit_id := coalesce(new.work_unit_id, old.work_unit_id);
    v_project_id := coalesce(new.project_id, old.project_id);
  elsif TG_TABLE_NAME = 'attachments' then
    v_work_unit_id := coalesce(new.work_unit_id, old.work_unit_id);
    v_project_id := coalesce(new.project_id, old.project_id);
  end if;

  select organization_id into v_org_id from projects where id = v_project_id;

  insert into audit_events (
    organization_id, project_id, work_unit_id, entity_type, entity_id, action,
    actor_user_id, actor_name_snapshot, actor_email_snapshot, old_value, new_value
  ) values (
    v_org_id, v_project_id, v_work_unit_id, TG_TABLE_NAME, coalesce(new.id, old.id), TG_OP,
    v_actor, v_actor_name, v_actor_email,
    case when TG_OP = 'INSERT' then null else to_jsonb(old) end,
    case when TG_OP = 'DELETE' then null else to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_work_units after insert or update or delete on work_units for each row execute function public.log_audit_event();
create trigger audit_tasks after insert or update or delete on tasks for each row execute function public.log_audit_event();
create trigger audit_incidents after insert or update or delete on incidents for each row execute function public.log_audit_event();
create trigger audit_attachments after insert or update or delete on attachments for each row execute function public.log_audit_event();
