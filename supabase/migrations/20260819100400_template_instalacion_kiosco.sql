-- Gestor de Proyectos SERCOM - Vodafone
-- 0005: plantilla "Instalación Kiosco v1.0" (spec seccion 6) + aplicacion
-- a las unidades de trabajo existentes del proyecto de rollout.
--
-- Idempotente: si la plantilla u organizacion no existen, no hace nada
-- (RAISE NOTICE); si ya esta aplicada al proyecto, no duplica.
--
-- Nota: 'gate' es hoy solo una etiqueta informativa en la tarea/plantilla.
-- El *enforcement* real (bloquear el cambio de estado de work_units hasta
-- que todas las tareas de ese gate esten DONE) es logica de aplicacion
-- pendiente de construir (spec 2.3) - no hay trigger que lo haga todavia.

DO $$
DECLARE
  v_org_id uuid;
  v_template_id uuid;
  v_version_id uuid;
  v_phase_pre uuid;
  v_phase_inst uuid;
  v_phase_post uuid;
BEGIN
  SELECT id INTO v_org_id FROM organizations WHERE name = 'SERCOM - Vodafone' LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'Organizacion SERCOM - Vodafone no encontrada; se omite la plantilla.';
    RETURN;
  END IF;

  SELECT id INTO v_template_id FROM project_templates
   WHERE organization_id = v_org_id AND name = 'Instalación Kiosco';

  IF v_template_id IS NULL THEN
    INSERT INTO project_templates (organization_id, name, description)
    VALUES (v_org_id, 'Instalación Kiosco', 'Plantilla estandar de rollout de kioscos de autoservicio (spec seccion 6).')
    RETURNING id INTO v_template_id;
  END IF;

  SELECT id INTO v_version_id FROM template_versions
   WHERE template_id = v_template_id AND version_label = 'v1.0';

  IF v_version_id IS NOT NULL THEN
    RAISE NOTICE 'Plantilla Instalacion Kiosco v1.0 ya existe; no se duplica.';
    RETURN;
  END IF;

  INSERT INTO template_versions (template_id, version_label, is_active)
  VALUES (v_template_id, 'v1.0', true)
  RETURNING id INTO v_version_id;

  INSERT INTO template_phases (template_version_id, name, order_index, drive_subfolder_name)
  VALUES (v_version_id, 'Pre-instalación', 0, '01_PRE_INSTALACION')
  RETURNING id INTO v_phase_pre;

  INSERT INTO template_phases (template_version_id, name, order_index, drive_subfolder_name)
  VALUES (v_version_id, 'Instalación', 1, '02_INSTALACION')
  RETURNING id INTO v_phase_inst;

  INSERT INTO template_phases (template_version_id, name, order_index, drive_subfolder_name)
  VALUES (v_version_id, 'Post-instalación', 2, '03_POST_INSTALACION')
  RETURNING id INTO v_phase_post;

  -- Pre-instalacion: fechas relativas orientativas, spec seccion 10.
  INSERT INTO template_tasks
    (template_phase_id, title, default_assignee_role, is_mandatory, gate, requires_evidence, relative_day_offset)
  VALUES
    (v_phase_pre, 'Confirmar PDV y contacto', 'COORDINATOR', true, 'READY_FOR_INSTALL', false, -20),
    (v_phase_pre, 'Confirmar acceso técnico', 'COORDINATOR', true, 'READY_FOR_INSTALL', false, -18),
    (v_phase_pre, 'Confirmar ubicación exacta del kiosco', 'COORDINATOR', true, NULL, false, -15),
    (v_phase_pre, 'Confirmar mobiliario preparado', 'COORDINATOR', true, NULL, false, -15),
    (v_phase_pre, 'Confirmar toma eléctrica', 'COORDINATOR', true, 'READY_FOR_INSTALL', false, -14),
    (v_phase_pre, 'Confirmar conectividad', 'COORDINATOR', true, 'READY_FOR_INSTALL', false, -14),
    (v_phase_pre, 'Asignar kiosco / número de serie', 'COORDINATOR', true, 'READY_FOR_INSTALL', false, -12),
    (v_phase_pre, 'Confirmar envío', 'COORDINATOR', true, NULL, false, -10),
    (v_phase_pre, 'Asignar instalador', 'COORDINATOR', true, 'READY_FOR_INSTALL', false, -7),
    (v_phase_pre, 'Confirmar recepción', 'COORDINATOR', true, 'READY_FOR_INSTALL', false, -5),
    (v_phase_pre, 'Confirmar fecha con PDV', 'COORDINATOR', true, 'READY_FOR_INSTALL', false, -5),
    (v_phase_pre, 'Confirmar fecha con instalador', 'COORDINATOR', true, 'READY_FOR_INSTALL', false, -3);

  -- Instalacion: todo el mismo dia T (offset 0).
  INSERT INTO template_tasks
    (template_phase_id, title, default_assignee_role, is_mandatory, gate, requires_evidence, relative_day_offset)
  VALUES
    (v_phase_inst, 'Registrar llegada', 'INSTALLER', true, NULL, false, 0),
    (v_phase_inst, 'Adjuntar foto inicial', 'INSTALLER', true, 'PENDING_VALIDATION', true, 0),
    (v_phase_inst, 'Verificar ubicación', 'INSTALLER', true, NULL, false, 0),
    (v_phase_inst, 'Registrar serial del kiosco', 'INSTALLER', true, 'PENDING_VALIDATION', false, 0),
    (v_phase_inst, 'Instalar equipo', 'INSTALLER', true, 'PENDING_VALIDATION', false, 0),
    (v_phase_inst, 'Conectar alimentación', 'INSTALLER', true, NULL, false, 0),
    (v_phase_inst, 'Conectar red', 'INSTALLER', true, NULL, false, 0),
    (v_phase_inst, 'Revisar cableado', 'INSTALLER', true, NULL, false, 0),
    (v_phase_inst, 'Iniciar aplicación', 'INSTALLER', true, NULL, false, 0),
    (v_phase_inst, 'Ejecutar prueba hardware', 'INSTALLER', true, 'PENDING_VALIDATION', false, 0),
    (v_phase_inst, 'Ejecutar prueba conectividad', 'INSTALLER', true, 'PENDING_VALIDATION', false, 0),
    (v_phase_inst, 'Ejecutar flujo end-to-end', 'INSTALLER', true, 'PENDING_VALIDATION', false, 0),
    (v_phase_inst, 'Adjuntar fotografía final', 'INSTALLER', true, 'PENDING_VALIDATION', true, 0);

  -- Post-instalacion.
  INSERT INTO template_tasks
    (template_phase_id, title, default_assignee_role, is_mandatory, gate, requires_evidence, relative_day_offset)
  VALUES
    (v_phase_post, 'Revisar evidencias', 'OPERATIONS', true, NULL, false, 1),
    (v_phase_post, 'Resolver incidencias abiertas', 'OPERATIONS', true, 'OPERATIVE', false, 1),
    (v_phase_post, 'Validación Operations', 'OPERATIONS', true, 'OPERATIVE', false, 1),
    (v_phase_post, 'Confirmar funcionamiento', 'OPERATIONS', true, NULL, false, 1),
    (v_phase_post, 'Cierre', 'OPERATIONS', true, NULL, false, 2),
    (v_phase_post, 'Marcar Operativo', 'OPERATIONS', true, 'OPERATIVE', false, 2);

  INSERT INTO template_evidence_requirements (template_task_id, category, min_count, instructions)
  SELECT id, 'foto_inicial', 1, 'Foto general del PDV antes de empezar la instalación'
  FROM template_tasks WHERE template_phase_id = v_phase_inst AND title = 'Adjuntar foto inicial';

  INSERT INTO template_evidence_requirements (template_task_id, category, min_count, instructions)
  SELECT id, 'foto_final', 1, 'Foto general del kiosco instalado y encendido'
  FROM template_tasks WHERE template_phase_id = v_phase_inst AND title = 'Adjuntar fotografía final';
END $$;

-- Aplicacion a las unidades del proyecto de rollout ya existentes.
DO $$
DECLARE
  v_project_id uuid;
  v_version_id uuid;
BEGIN
  SELECT p.id INTO v_project_id
  FROM projects p
  JOIN organizations o ON o.id = p.organization_id
  WHERE o.name = 'SERCOM - Vodafone' AND p.name = 'Kioscos España · Rollout 2026'
  LIMIT 1;

  SELECT tv.id INTO v_version_id
  FROM template_versions tv
  JOIN project_templates pt ON pt.id = tv.template_id
  JOIN organizations o ON o.id = pt.organization_id
  WHERE o.name = 'SERCOM - Vodafone' AND pt.name = 'Instalación Kiosco' AND tv.version_label = 'v1.0'
  LIMIT 1;

  IF v_project_id IS NULL OR v_version_id IS NULL THEN
    RAISE NOTICE 'Proyecto o plantilla no encontrados; se omite la aplicacion.';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM work_unit_phases wup
    JOIN work_units wu ON wu.id = wup.work_unit_id
    JOIN template_phases tp ON tp.id = wup.template_phase_id
    WHERE wu.project_id = v_project_id AND tp.template_version_id = v_version_id
  ) THEN
    RAISE NOTICE 'La plantilla ya esta aplicada a este proyecto; no se duplica.';
    RETURN;
  END IF;

  INSERT INTO work_unit_phases (work_unit_id, template_phase_id, name, order_index)
  SELECT wu.id, tp.id, tp.name, tp.order_index
  FROM work_units wu
  CROSS JOIN template_phases tp
  WHERE wu.project_id = v_project_id AND tp.template_version_id = v_version_id;

  INSERT INTO tasks
    (work_unit_id, work_unit_phase_id, template_task_id, title, is_mandatory, gate, requires_evidence, due_at)
  SELECT
    wu.id, wup.id, tt.id, tt.title, tt.is_mandatory, tt.gate, tt.requires_evidence,
    CASE
      WHEN wu.installation_planned_at IS NOT NULL
        THEN (wu.installation_planned_at + make_interval(days => tt.relative_day_offset))::date
      ELSE NULL
    END
  FROM work_units wu
  JOIN work_unit_phases wup ON wup.work_unit_id = wu.id
  JOIN template_phases tp ON tp.id = wup.template_phase_id AND tp.template_version_id = v_version_id
  JOIN template_tasks tt ON tt.template_phase_id = tp.id
  WHERE wu.project_id = v_project_id;

  INSERT INTO evidence_requirements (task_id, category, min_count, instructions)
  SELECT t.id, ter.category, ter.min_count, ter.instructions
  FROM tasks t
  JOIN template_evidence_requirements ter ON ter.template_task_id = t.template_task_id
  JOIN work_units wu ON wu.id = t.work_unit_id
  WHERE wu.project_id = v_project_id;

  INSERT INTO milestones (work_unit_id, kind, planned_at)
  SELECT wu.id, k.kind, (wu.installation_planned_at + k.offset_days)::date
  FROM work_units wu
  CROSS JOIN (VALUES
    ('READY_FOR_INSTALL'::milestone_kind, -3),
    ('INSTALLATION'::milestone_kind, 0),
    ('VALIDATION'::milestone_kind, 1),
    ('OPERATIVE'::milestone_kind, 2)
  ) AS k(kind, offset_days)
  WHERE wu.project_id = v_project_id AND wu.installation_planned_at IS NOT NULL
  ON CONFLICT (work_unit_id, kind) DO NOTHING;
END $$;
