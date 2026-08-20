-- Gestor de Proyectos SERCOM - Vodafone
-- 0006: quitar las FK de audit_events hacia organizations/projects/work_units
--
-- Bug real encontrado en pruebas: el trigger log_audit_event() inserta
-- una fila en audit_events DESPUES de un DELETE (AFTER DELETE), pero
-- si audit_events.work_unit_id tiene FK a work_units(id), esa insercion
-- viola la propia FK -> el DELETE entero falla con
-- "violates foreign key constraint audit_events_work_unit_id_fkey".
-- Es decir: con el esquema original, borrar cualquier work_unit/task/
-- incident/attachment auditado era literalmente imposible.
--
-- Un log de auditoria debe seguir existiendo aunque la entidad
-- referenciada se elimine (por eso ya guardamos actor_name_snapshot /
-- actor_email_snapshot en vez de depender de que el usuario siga
-- existiendo). Las columnas se quedan como uuid simples, indexadas,
-- sin integridad referencial forzada.

alter table audit_events drop constraint if exists audit_events_organization_id_fkey;
alter table audit_events drop constraint if exists audit_events_project_id_fkey;
alter table audit_events drop constraint if exists audit_events_work_unit_id_fkey;
