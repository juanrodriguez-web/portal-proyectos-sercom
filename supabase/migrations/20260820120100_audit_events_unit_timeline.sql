-- Gestor de Proyectos SERCOM - Vodafone
-- 0007: audit_events visible tambien para la Timeline de unidad
--
-- El spec distingue dos consumidores del mismo audit_events:
-- - Auditoria (seccion 20): log tecnico completo, solo ADMIN.
-- - Timeline de unidad (seccion 19): "los eventos automaticos de
--   sistema se mostraran unicamente si el usuario tiene acceso a la
--   entidad que origino el evento" - es decir, cualquiera con acceso a
--   la work_unit, no solo ADMIN.
--
-- Postgres combina policies permisivas del mismo comando con OR, asi
-- que anadir esta segunda policy de SELECT no reduce lo que ya podia
-- ver un ADMIN (audit_events_select sigue existiendo); solo amplia el
-- acceso para quien tenga has_work_unit_access sobre esa fila.

create policy audit_events_select_by_unit_access on audit_events for select
  using (work_unit_id is not null and public.has_work_unit_access(work_unit_id));
