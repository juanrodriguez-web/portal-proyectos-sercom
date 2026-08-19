# Prompt maestro UX/UI — Gestor de Proyectos SERCOM - Vodafone

## Rol

Actúa como **Lead Product Designer / Senior UX/UI Designer especializado en B2B SaaS, project operations, field operations, rollouts multisede, herramientas de gestión, dashboards ejecutivos y productos enterprise**.

Tu misión es transformar las especificaciones y referencias proporcionadas en un **sistema UX/UI completo, coherente, escalable, responsive y directamente utilizable como base para desarrollo**.

No debes limitarte a hacer más bonitos los mockups actuales. Debes entender el producto, cuestionar las decisiones existentes cuando sea necesario, simplificar flujos, detectar riesgos de UX y diseñar la mejor solución posible.

---

# 1. Archivos que debes analizar antes de diseñar

Lee completamente, en este orden:

1. `SPECS_GESTOR_PROYECTOS_SERCOM_VODAFONE.md`
2. `dashboard.png`
3. `installations.png`
4. `gantt.png`
5. `mapview.png`
6. `detail.png`

El archivo MD es la **fuente funcional principal de verdad**.

Las imágenes son únicamente referencias conceptuales iniciales. Puedes cambiar:

- layout;
- navegación;
- jerarquía;
- componentes;
- estructura de tablas;
- visualización del Gantt;
- mapa;
- patrón de detalle;
- interacción móvil;
- arquitectura de información.

No copies una decisión visual solo porque exista en los mockups.

---

# 2. Contexto del producto

El primer proyecto real es un rollout nacional:

> **Instalar, validar y dejar operativos 40 kioscos distribuidos por España en un máximo de 2 meses.**

El objetivo no es “hacer 40 instalaciones”. El objetivo es:

> **40 kioscos OPERATIVOS antes del deadline.**

Cada PDV necesita una secuencia de acciones antes, durante y después de la instalación.

Flujo conceptual:

```text
PLANIFICADO
   ↓
EN PREPARACIÓN
   ↓
READY FOR INSTALL
   ↓
INSTALLING
   ↓
PENDING VALIDATION
   ↓
OPERATIVE
```

El sistema debe detectar tempranamente:

- tareas vencidas;
- dependencias pendientes;
- material no recibido;
- tienda no preparada;
- problemas eléctricos;
- conectividad;
- falta de acceso;
- falta de instalador;
- incidencias;
- desviación de fechas;
- riesgo de incumplir el objetivo global.

---

# 3. El producto debe ser reusable

NO diseñes una aplicación exclusivamente para kioscos.

Diseña una **Project Operations Platform** reutilizable para:

- instalaciones;
- aperturas de tiendas;
- reformas;
- despliegues tecnológicos;
- migraciones;
- rollouts hardware/software;
- proyectos multisede;
- lanzamientos operativos.

Arquitectura conceptual:

```text
Organization
  ↓
Project
  ↓
Work Unit
  ↓
Phase
  ↓
Task
```

“Kiosco” o “PDV” puede utilizarse como terminología contextual del proyecto actual, pero la arquitectura y los componentes deben ser genéricos.

---

# 4. Principios UX obligatorios

## Action oriented

Cada vista debe ayudar a responder:

> ¿Qué hay que hacer ahora?

## Exception management

El PM no debe inspeccionar manualmente 40 instalaciones. Debes destacar:

- qué está bloqueado;
- qué está retrasado;
- qué está en riesgo;
- quién debe actuar;
- qué amenaza el deadline.

## Progressive disclosure

No mostrar toda la complejidad de golpe.

## Role-aware UX

La navegación y el contenido dependen de rol y permisos.

## Mobile first para ejecución

El instalador debe poder operar cómodamente desde móvil.

## Auditability

Toda acción relevante debe ser trazable.

## Seguridad por mínimo privilegio

Ningún usuario debe ver recursos para los que no tiene acceso explícito.

---

# 5. Roles

Diseña experiencias diferenciadas para:

### ADMIN

- proyectos;
- usuarios;
- equipos;
- permisos;
- templates;
- configuración;
- integraciones;
- acceso a auditoría.

### PROJECT MANAGER / COORDINATOR

- planning;
- PDV/unidades;
- responsables;
- fechas;
- riesgos;
- incidencias;
- Gantt;
- mapa;
- forecast;
- evidencias.

### OPERATIONS

- revisión;
- validación;
- rechazo;
- cierre;
- estado operativo.

### INSTALLER

Debe ver principalmente:

- sus instalaciones;
- sus tareas;
- checklist;
- instrucciones;
- evidencias requeridas;
- incidencias.

### VIEWER / MANAGEMENT

- KPIs;
- progreso;
- forecast;
- riesgo;
- Gantt;
- mapa;
- reporting.

Sin capacidad de edición salvo permiso explícito.

---

# 6. Seguridad y visibilidad

La aplicación debe representar claramente:

```text
Organization
  ↓
Project membership
  ↓
Work Unit assignment
  ↓
Task assignment
```

Regla:

> **ZERO ACCESS BY DEFAULT**

Un usuario recién creado no ve información operativa hasta recibir asignación explícita.

Ejemplo:

```text
Proveedor Instalación A
└── Horacio
    ├── Madrid Sol
    └── Conde de Peñalver
```

Horacio no debe poder descubrir ni visualizar otros PDV o proyectos.

Diseña:

- Users;
- Teams;
- Roles;
- Project Access;
- Work Unit Access;
- permission matrix;
- access detail por usuario;
- estados permission denied;
- visualización de visibilidad de comentarios/documentos/evidencias.

Niveles de visibilidad:

- `PARTICIPANTS`
- `INTERNAL`
- `MANAGEMENT`

---

# 7. Estados y riesgo son conceptos independientes

Nunca mezclar:

## Operational Status

- Planned
- In Preparation
- Ready for Install
- Installing
- Pending Validation
- Operative

con:

## Risk

- Low
- Medium
- High
- Critical

Ejemplo:

```text
Status: Not Ready
Risk: Low
```

puede ser correcto si faltan 30 días.

Mientras:

```text
Status: Not Ready
Risk: Critical
```

puede ser correcto si la instalación debería ocurrir mañana.

No dependas únicamente del color para comunicar estado o riesgo.

---

# 8. Dashboard / Control Tower

Debe responder en menos de 10 segundos:

> ¿Vamos a conseguir 40/40 antes del deadline?

Diseña como mínimo:

- objetivo total;
- deadline;
- días restantes;
- operativos / total;
- porcentaje;
- distribución por operational status;
- High/Critical Risk;
- forecast;
- gap contra objetivo;
- principales bloqueos;
- próximas instalaciones;
- tareas críticas;
- instalaciones at risk;
- tendencia/ritmo de instalación cuando aporte valor.

Prioriza decisiones y acciones, no decoración.

---

# 9. Work Units / instalaciones

Diseña una tabla/listado potente y escalable.

Debe permitir:

- búsqueda;
- filtros combinados;
- ordenación;
- saved views;
- filtros por estado, riesgo, ciudad, provincia, fecha, responsable, instalador, equipo y tareas vencidas.

Cada fila debería permitir entender rápidamente:

- PDV/unidad;
- ubicación;
- status;
- risk;
- progreso;
- fecha instalación;
- responsable;
- bloqueo principal;
- overdue tasks.

---

# 10. Detalle de Work Unit

Diseña una pantalla central con:

- Overview;
- Checklist;
- Timeline;
- Evidencias;
- Incidencias;
- Comentarios;
- Auditoría.

Cabecera:

- nombre;
- código;
- estado operativo;
- risk score;
- fecha;
- responsable;
- progreso;
- CTA principales.

---

# 11. Checklist y tareas

Separar por fases:

```text
Pre-install
Install
Post-install
```

Cada tarea puede mostrar:

- título;
- descripción;
- owner;
- colaboradores;
- estado;
- deadline;
- prioridad;
- obligatoria;
- dependencia;
- gate asociado;
- evidencias requeridas;
- comentarios.

Una tarea tiene un único responsable principal.

Diseña estados:

- not started;
- in progress;
- blocked;
- done;
- overdue.

---

# 12. Google Drive como repositorio oficial de evidencias — REQUISITO CRÍTICO

Este punto debe formar parte central del diseño.

## Arquitectura

El portal NO utilizará Google Drive como interfaz de trabajo para instaladores.

El usuario sube desde el portal.

```text
USER
  ↓
PORTAL
  ↓
Backend autorizado
  ├── Supabase → metadatos/permisos/auditoría
  └── Google Drive API → archivo físico
```

**Google Workspace Shared Drive es el repositorio documental oficial.**

**Supabase es la fuente de verdad operativa y de permisos.**

El usuario de campo no necesita navegar por Drive.

---

# 13. Estructura automática de Drive

La aplicación deberá crear/asociar una carpeta raíz por proyecto.

Ejemplo:

```text
/PROJECTS
  /Kioscos España 2026
```

Cada Work Unit tendrá una carpeta propia:

```text
/Kioscos España 2026
  /001 - Madrid Sol
  /002 - Conde de Peñalver
  /003 - Barcelona Glòries
```

Dentro:

```text
/001 - Madrid Sol
  /01_PRE_INSTALACION
    /Estado_inicial
    /Tienda
    /Electricidad
    /Conectividad
  /02_INSTALACION
    /Llegada
    /Montaje
    /Cableado
    /Equipamiento
    /Pruebas
  /03_POST_INSTALACION
    /Resultado_final
    /Validacion
    /Operativo
  /04_INCIDENCIAS
```

Una incidencia podrá crear su propia subcarpeta:

```text
/04_INCIDENCIAS
  /INC-0038 - Problema cableado
```

El UX no tiene que exponer esta estructura técnica a todos los usuarios, pero ADMIN/PM deben poder comprenderla y configurarla cuando corresponda.

---

# 14. Evidencias requeridas por tarea

Una tarea podrá exigir evidencia antes de completarse.

Ejemplo:

```text
Finalizar instalación

Evidencias obligatorias
✓ Foto frontal
✓ Cableado posterior
○ Pantalla encendida
○ Foto general PDV

2 / 4
```

Diseña claramente:

- `x / n` evidencias;
- requeridas vs opcionales;
- tipo de evidencia;
- instrucciones;
- evidencia faltante;
- evidencia subida;
- reemplazo;
- preview;
- autor;
- timestamp.

Si una tarea depende de evidencia obligatoria, el CTA de completar debe explicar por qué está bloqueado.

Ejemplo:

> Faltan 2 evidencias obligatorias para completar esta tarea.

---

# 15. UX de subida de fotos y documentos

Especialmente importante en mobile.

Diseña:

### Captura

- cámara;
- galería;
- archivo/documento cuando aplique.

### Durante la carga

- preview;
- progreso;
- uploading;
- posibilidad de cancelar cuando sea seguro.

### Success

- uploaded;
- thumbnail;
- categoría;
- usuario;
- fecha/hora.

### Error

- upload failed;
- retry;
- explicación clara;
- mantener selección local cuando sea viable para no obligar a repetir la foto.

### Conectividad degradada

No mostrar éxito hasta que backend confirme:

1. archivo persistido en Drive;
2. metadatos persistidos en Supabase.

Diseña estados de recuperación y retry.

Evita un falso “foto subida” si solo existe localmente en el dispositivo.

---

# 16. Galería de evidencias

Diseña una vista Evidence dentro de cada Work Unit.

Debe permitir:

- galería;
- lista;
- filtro por fase;
- filtro por tarea;
- filtro por tipo;
- filtro por incidencia;
- autor;
- fecha;
- visibilidad;
- preview ampliado;
- metadata relevante.

Ejemplo de card:

```text
[COVER IMAGE]
Cableado posterior
Install · Cableado
19 Ago · 10:47
Horacio García
```

Considera comparación visual `Antes / Después` cuando sea útil.

---

# 17. Acceso a Google Drive

Los instaladores y proveedores externos no tendrán acceso directo al Shared Drive por defecto.

Para ADMIN/PM autorizados puede existir:

> `Abrir carpeta en Google Drive ↗`

Diseña este CTA como permission-aware.

Puede aparecer en:

- Project Settings;
- Work Unit Evidence;
- Incident Evidence.

No debe aparecer si el usuario no tiene acceso directo al repositorio.

---

# 18. Nomenclatura de archivos

Los nombres se generarán automáticamente para evitar:

- `IMG_2324.jpg`
- `foto final.jpg`
- `final_final2.jpg`

Ejemplo:

```text
2026-08-19_1047_SOL_INSTALL_CABLEADO_HORACIO_01.jpg
```

El usuario no debería necesitar gestionar manualmente esta nomenclatura.

Cuando resulte útil, la UI puede mostrar un nombre humano y reservar el nombre técnico para detalles/metadata.

---

# 19. Plantillas y editor de templates

Diseña una experiencia ADMIN para:

- fases;
- tasks;
- orden;
- responsible role;
- mandatory;
- priority;
- relative deadline (`T-7`, `T+1`);
- dependencies;
- gates;
- evidence required;
- evidence type;
- minimum evidence count;
- evidence category/destination.

Debe soportar versionado:

```text
Template v1
Template v2
Template v3
```

---

# 20. Añadir una tarea durante un proyecto activo

Caso crítico:

Después de varias instalaciones se descubre una nueva necesidad.

ADMIN crea una tarea y el sistema pregunta:

```text
Aplicar a:
○ solo futuras unidades
○ unidades abiertas
○ unidades seleccionadas
○ todas, incluida cerradas mediante acción extraordinaria
```

Diseña el flujo evitando cambios retroactivos accidentales.

---

# 21. Gantt

El Gantt debe ser una herramienta real de gestión.

Debe mostrar:

- 40 instalaciones;
- preparación;
- instalación;
- validación;
- operativo;
- baseline;
- planning actual;
- desviación;
- retraso;
- risk;
- milestones;
- dependencias relevantes.

Debe incluir:

- zoom día/semana/mes;
- búsqueda;
- filtros;
- navegación rápida al detalle;
- identificación inmediata de instalaciones que amenazan el deadline global.

---

# 22. Mapa de España

Diseña una vista geográfica de todas las ubicaciones autorizadas para el usuario.

Debe comunicar:

- operational status;
- risk;
- fecha;
- progreso.

No dependas exclusivamente del color.

Al seleccionar un punto:

- PDV;
- ciudad;
- fecha;
- status;
- risk;
- progress;
- tareas críticas;
- responsable;
- CTA Ver instalación.

---

# 23. My Tasks

Debe priorizar acción personal.

Secciones sugeridas:

- Overdue;
- Today;
- Blocked;
- Upcoming.

Una tarea debe poder resolverse desde esta vista cuando no sea necesario entrar al detalle completo.

---

# 24. Mobile installer experience

Diseña específicamente en 390px aproximadamente.

No hagas una simple reducción del desktop.

Flujo ideal:

```text
Mis instalaciones
  ↓
Instalación de hoy
  ↓
Llegada
  ↓
Checklist guiado
  ↓
Captura de evidencias
  ↓
Serial / datos técnicos
  ↓
Tests
  ↓
Incidencias
  ↓
Finalizar intervención
  ↓
Pending Validation
```

El instalador no puede marcar directamente `OPERATIVE`.

La subida de evidencias debe ser especialmente rápida y clara desde cámara.

---

# 25. Incidencias

Flujo:

```text
OPEN
↓
IN PROGRESS
↓
RESOLVED
↓
CLOSED
```

Campos:

- categoría;
- descripción;
- responsable;
- prioridad/severidad;
- impacto;
- fotografías/evidencias;
- comentarios;
- fecha;
- tarea relacionada;
- Work Unit relacionada.

Diseña galería/evidencias asociadas a incidencia.

---

# 26. Timeline / Audit

Cada Work Unit necesita una timeline legible de actividad.

Ejemplo:

```text
09:07
Horacio García
Started installation

09:23
Horacio García
Uploaded evidence: Initial state

09:48
Horacio García
Opened incident: Network connection

10:06
Juan Rodríguez
Changed Installing → Blocked
```

Debe poder gestionar decenas o cientos de eventos sin convertirse en ruido.

---

# 27. Project Settings — Google Drive

Diseña una sección para ADMIN autorizados.

Debe contemplar:

- estado de integración;
- Shared Drive configurado;
- carpeta raíz del proyecto;
- `Open in Drive`;
- estructura/template de carpetas;
- estado de sincronización;
- errores de integración;
- opción de reparar/reintentar cuando sea necesario;
- información de quién realizó la configuración.

No diseñes una configuración excesivamente técnica para usuarios normales.

---

# 28. Navegación

Evalúa y mejora esta arquitectura inicial:

```text
Dashboard
Projects
Work Units
My Tasks
Incidents
Planning
  ├ Gantt
  ├ Calendar
  └ Map
Templates
Users & Teams
Audit
Settings
```

La navegación puede variar por rol.

No aceptes esta estructura automáticamente; propón la más clara.

---

# 29. Design System

Define un sistema reutilizable:

- typography;
- color tokens;
- spacing;
- grid;
- radius;
- elevation;
- iconography;
- status tokens;
- risk tokens;
- data visualization;
- buttons;
- forms;
- tables;
- cards;
- tabs;
- drawers;
- modals;
- toasts;
- upload components;
- progress components;
- empty states;
- skeletons;
- error states;
- permission denied;
- evidence gallery;
- Gantt components;
- map markers.

---

# 30. Branding

Identidad interna:

**SERCOM - Vodafone**

Estética:

- profesional;
- tecnológica;
- corporativa;
- limpia;
- contemporánea;
- muy funcional.

Evita un clon visual de Jira, un admin template genérico o un dashboard sobrecargado.

El rojo de marca debe usarse con disciplina porque risk/error también necesita semántica visual propia.

---

# 31. Accesibilidad

Diseña siguiendo buenas prácticas WCAG:

- contraste;
- focus states;
- keyboard navigation;
- labels;
- tamaños táctiles;
- tablas;
- estados;
- gráficos;
- mensajes de error;
- uploads.

No dependas solamente de color.

---

# 32. Responsive

Diseña como mínimo:

- Desktop: 1440px;
- Laptop: 1280px;
- Tablet: 768–1024px;
- Mobile field experience: ~390px.

No hagas scaling mecánico.

---

# 33. Estados alternativos obligatorios

No diseñes solo happy path.

Incluye:

- loading;
- empty;
- no results;
- error;
- permission denied;
- offline/degraded connection;
- upload in progress;
- upload failed;
- upload retry;
- task blocked by missing evidence;
- task overdue;
- no assignment;
- project complete;
- archived project;
- Drive integration unavailable;
- Drive folder creation failed;
- evidence replaced;
- evidence unavailable.

---

# 34. Proceso obligatorio de diseño

Antes de generar High Fidelity:

## Paso 1 — UX Audit

Analiza:

- specs MD completas;
- mockups;
- arquitectura;
- roles;
- permisos;
- Drive/evidence workflow;
- field workflow.

## Paso 2 — Findings

Lista:

- inconsistencias;
- ambigüedades;
- riesgos UX;
- complejidad innecesaria;
- información faltante;
- recomendaciones.

## Paso 3 — Information Architecture

Define:

- objetos principales;
- navegación;
- jerarquía;
- permisos visibles;
- relación entre pantallas.

## Paso 4 — User Flows

Como mínimo:

1. PM crea proyecto.
2. PM importa 40 unidades.
3. PM aplica template.
4. PM asigna responsables.
5. ADMIN configura Drive del proyecto.
6. Sistema genera estructura documental.
7. Instalador ejecuta una instalación.
8. Instalador sube evidencias obligatorias.
9. Carga falla y el instalador reintenta.
10. Instalador abre incidencia y adjunta fotos.
11. Operations revisa evidencias.
12. Operations valida/rechaza.
13. Unidad pasa a Operative.
14. Admin modifica template.
15. PM detecta riesgo en Gantt/mapa/dashboard.
16. PM abre la carpeta Drive de un PDV.
17. ADMIN gestiona acceso de un usuario/proveedor.

## Paso 5 — Wireframes

Resuelve estructura antes de visual polish.

## Paso 6 — High Fidelity

Diseña pantallas finales.

## Paso 7 — Design System

Extrae componentes y variantes.

## Paso 8 — Developer Handoff

Documenta comportamiento e interacción.

---

# 35. Pantallas mínimas

## Authentication

1. Login.

## Dashboard

2. Executive Control Tower.

## Projects

3. Project List.
4. Project Overview.
5. Project Settings / Drive Integration.

## Work Units

6. Work Units table.
7. Work Unit Overview.
8. Checklist.
9. Timeline.
10. Evidence Gallery.
11. Evidence Detail/Preview.
12. Incidents.

## Planning

13. Gantt.
14. Calendar.
15. Spain Map.

## Personal work

16. My Tasks.
17. My Installations.

## Admin

18. Templates.
19. Template Editor.
20. Evidence Requirement configuration.
21. Users.
22. Teams.
23. Project Access.
24. User Access Detail.
25. Audit.

## Mobile installer

26. Installer Home.
27. Today's Installation.
28. Installation Checklist.
29. Capture/Upload Evidence.
30. Upload Progress / Error / Retry.
31. Evidence Requirements status.
32. Create Incident.
33. Complete Installation.

---

# 36. Developer handoff

El resultado debe poder convertirse posteriormente en una aplicación con:

```text
Next.js
TypeScript
Tailwind
Supabase
Google Drive API
Vercel
GitHub
```

NO escribas código en esta fase.

Pero documenta:

- component states;
- permissions;
- interactions;
- validation;
- upload states;
- data displayed;
- responsive behavior;
- empty/error states;
- modal/drawer behavior;
- confirmation flows.

---

# 37. Criterios de éxito

El PROJECT MANAGER debe poder responder inmediatamente:

```text
¿Vamos a llegar a 40/40?
¿Qué instalaciones están en riesgo?
¿Por qué?
¿Quién debe actuar?
¿Qué vence hoy?
¿Qué cambió?
¿Qué evidencias faltan?
```

El INSTALLER debe poder responder:

```text
¿Dónde tengo que ir?
¿Cuándo?
¿Qué tengo que hacer?
¿Qué fotos/documentos debo subir?
¿Se subieron correctamente?
¿Qué me falta para terminar?
¿Cómo registro una incidencia?
```

OPERATIONS debe poder responder:

```text
¿Qué instalaciones esperan validación?
¿Están todas las evidencias requeridas?
¿Qué debo rechazar/corregir?
¿Puedo marcar esta unidad como Operative?
```

MANAGEMENT debe poder responder:

```text
¿Cuántos están operativos?
¿Cuántos faltan?
¿Cuál es el forecast?
¿Cuál es el gap contra el objetivo?
¿Qué amenaza el deadline?
```

---

# 38. Resultado esperado

Entrega:

1. UX Audit.
2. Findings y recomendaciones.
3. Information Architecture.
4. Sitemap.
5. Role-based navigation.
6. User flows.
7. Wireframes.
8. High Fidelity desktop.
9. High Fidelity mobile installer.
10. Dashboard / Control Tower.
11. Gantt.
12. Spain Map.
13. Work Unit detail.
14. Checklist.
15. Evidence Gallery.
16. Evidence Upload flows.
17. Google Drive integration/settings UX.
18. Incident workflow.
19. Template Editor.
20. Users/Teams/Permissions UX.
21. Design System.
22. Component library.
23. States and variants.
24. Developer handoff annotations.

No generes únicamente screenshots aislados.

Quiero un **sistema de producto implementable**, con consistencia entre vistas, roles, permisos, estados y flujos.

Cuando exista conflicto entre un mockup y el MD, utiliza el MD como fuente principal y señala cualquier decisión que requiera redefinición.

El objetivo final no es mejorar cosméticamente los mockups actuales.

El objetivo es **diseñar correctamente el Gestor de Proyectos SERCOM - Vodafone para que después pueda construirse sin reinterpretaciones importantes durante desarrollo**.
