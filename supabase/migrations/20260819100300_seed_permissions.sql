-- Gestor de Proyectos SERCOM - Vodafone
-- 0004: matriz de permisos por rol (spec 4.7 / 16 - "el algoritmo debe ser configurable")
-- Esta tabla se puede editar en caliente (via ADMIN) sin nueva migracion
-- para afinar la matriz; esto es solo el estado inicial.

insert into role_permissions (role, permission) values
  -- ADMIN: acceso completo
  ('ADMIN', 'READ'), ('ADMIN', 'CREATE'), ('ADMIN', 'UPDATE'), ('ADMIN', 'ASSIGN'),
  ('ADMIN', 'COMPLETE_TASK'), ('ADMIN', 'UPLOAD_EVIDENCE'), ('ADMIN', 'CREATE_INCIDENT'),
  ('ADMIN', 'VALIDATE'), ('ADMIN', 'APPROVE'), ('ADMIN', 'MANAGE_TEMPLATE'),
  ('ADMIN', 'MANAGE_USERS'), ('ADMIN', 'VIEW_AUDIT'),

  -- COORDINATOR: planifica, asigna, coordina (spec 4 / 4.2)
  ('COORDINATOR', 'READ'), ('COORDINATOR', 'CREATE'), ('COORDINATOR', 'UPDATE'),
  ('COORDINATOR', 'ASSIGN'), ('COORDINATOR', 'UPLOAD_EVIDENCE'), ('COORDINATOR', 'CREATE_INCIDENT'),

  -- OPERATIONS: revisa, valida, aprueba, marca operativo
  ('OPERATIONS', 'READ'), ('OPERATIONS', 'VALIDATE'), ('OPERATIONS', 'APPROVE'),
  ('OPERATIONS', 'UPDATE'),

  -- INSTALLER: ejecuta checklist, evidencias e incidencias de sus unidades
  ('INSTALLER', 'READ'), ('INSTALLER', 'COMPLETE_TASK'), ('INSTALLER', 'UPLOAD_EVIDENCE'),
  ('INSTALLER', 'CREATE_INCIDENT'),

  -- VIEWER: solo lectura sobre recursos autorizados
  ('VIEWER', 'READ');
