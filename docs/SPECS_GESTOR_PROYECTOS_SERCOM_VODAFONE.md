# Gestor de Proyectos SERCOM - Vodafone

**Especificaciones funcionales y técnicas**  
**Versión:** 1.2  
**Fecha:** 19/08/2026  
**Primer caso de uso:** Rollout de 40 kioscos en España  
**Objetivo operativo:** 40 kioscos instalados, validados y operativos en un máximo de 2 meses.

### Cambios v1.2

- Google Workspace Shared Drive pasa a ser el repositorio documental oficial de evidencias y documentos del proyecto.
- Estructura automática de carpetas por proyecto, unidad/PDV, fase e incidencia.
- Subida de evidencias desde el portal con almacenamiento transparente en Drive.
- Metadatos, relaciones, permisos operativos y auditoría permanecen en Supabase.
- Evidencias requeridas por tarea: tipo, cantidad mínima y validación para completar tareas/gates.
- Convención automática de nombres de archivos y acceso directo a carpetas solo para perfiles autorizados.
- Estados UX de carga, progreso, error y reintento para evidencias, especialmente en móvil.

### Cambios v1.1

- Modelo de autorización formalizado con RBAC + RLS.
- Acceso explícito por proyecto y por unidad/PDV.
- Cero acceso operativo por defecto para nuevos usuarios.
- Soporte de Teams y aislamiento entre proveedores externos.
- Visibilidad configurable para comentarios, documentos y evidencias.
- Permisos separados por acción y refuerzo del modelo de datos de seguridad.

---

## 1. Visión del producto

El Gestor de Proyectos SERCOM - Vodafone será una plataforma web para planificar, ejecutar y controlar proyectos operativos con múltiples unidades de trabajo, responsables, tareas, dependencias, evidencias, incidencias y trazabilidad completa.

La herramienta no se diseñará como una aplicación exclusiva para kioscos. El rollout de kioscos será el primer caso de uso de un motor reutilizable de proyectos basado en:

- Proyectos.
- Unidades de trabajo.
- Fases.
- Plantillas.
- Checklists configurables.
- Responsables.
- Dependencias.
- Hitos.
- Riesgos.
- Evidencias.
- Incidencias.
- Auditoría.

Ejemplos de futuros usos:

- Instalación de equipamiento en tiendas.
- Apertura o reforma de PDV.
- Despliegues tecnológicos.
- Migraciones.
- Lanzamientos comerciales.
- Rollouts de software o hardware.
- Proyectos operativos con múltiples localizaciones.

---

## 2. Principios de diseño

### 2.1 Trazabilidad total

Toda acción relevante debe quedar registrada con:

- Usuario.
- Nombre visible.
- Email.
- Fecha y hora.
- Entidad afectada.
- Valor anterior.
- Valor nuevo.
- Comentario o metadatos asociados.

### 2.2 Una tarea, un responsable principal

Cada tarea tendrá un único **Accountable Owner**. Se podrán añadir colaboradores, pero siempre existirá una persona responsable de que la tarea llegue a completarse.

### 2.3 Gates automáticos

Los estados operativos no serán simples campos editables. Determinados cambios dependerán del cumplimiento de reglas.

Ejemplo:

`Not Ready -> Ready for Install`

solo será posible cuando se hayan completado todas las tareas obligatorias de preinstalación.

### 2.4 Estado y riesgo son conceptos distintos

Una unidad puede estar `Not Ready` y tener riesgo bajo si faltan varias semanas para su instalación. Otra puede estar `Not Ready` y tener riesgo crítico si la instalación está prevista para el día siguiente.

### 2.5 Mobile first para ejecución

El equipo de instalación debe poder completar tareas, comentarios, fotografías y evidencias desde un móvil sin depender de un ordenador.

### 2.6 Drive como repositorio documental oficial

Los archivos de proyecto —fotografías, PDFs, actas y otras evidencias— se almacenarán en un **Google Workspace Shared Drive** corporativo. Supabase conservará la relación entre archivo, proyecto, unidad, tarea/incidencia, usuario, visibilidad y auditoría.

El usuario no necesitará navegar manualmente por Drive para aportar evidencias: la carga se realizará desde el portal y el backend resolverá de forma automática carpeta, nombre de archivo y metadatos.

---

## 3. Jerarquía funcional

```text
Organization
  └── Project
       └── Work Unit
            ├── Phase
            │    └── Task
            ├── Milestones
            ├── Incidents
            ├── Comments
            ├── Attachments
            └── Audit Events
```

### Caso de uso inicial

```text
Project
Kioscos España · Rollout 2026

Work Unit
PDV Málaga Centro

Phases
- Pre-instalación
- Instalación
- Post-instalación

Tasks
- Confirmar acceso
- Confirmar electricidad
- Confirmar recepción del kiosco
- Asignar instalador
- Instalar kiosco
- Ejecutar pruebas
- Validar operación
```

---

## 4. Roles y permisos

### ADMIN

Puede:

- Crear y editar proyectos.
- Crear y versionar plantillas.
- Añadir, editar y retirar tareas de plantillas.
- Gestionar usuarios.
- Gestionar roles.
- Configurar reglas y estados.
- Aplicar nuevas tareas a instalaciones abiertas.
- Consultar auditoría completa.

### COORDINATOR

Puede:

- Crear y editar unidades de trabajo.
- Programar instalaciones.
- Asignar responsables.
- Gestionar fechas.
- Gestionar tareas.
- Registrar incidencias.
- Añadir comentarios y evidencias.
- Consultar Gantt, mapa y riesgos.

### INSTALLER

Puede:

- Ver las instalaciones asignadas.
- Completar tareas de instalación.
- Registrar hora de llegada.
- Subir fotografías.
- Registrar seriales y equipos.
- Añadir comentarios.
- Crear incidencias.

No podrá modificar planificación global ni validar el cierre operativo.

### OPERATIONS

Puede:

- Revisar instalaciones terminadas.
- Revisar evidencias.
- Rechazar una instalación.
- Aprobar la instalación.
- Marcar una unidad como Operativa cuando se cumplen los gates.

### VIEWER

Acceso de solo lectura únicamente a los proyectos y unidades expresamente autorizados. No obtiene acceso global por el mero hecho de tener perfil VIEWER.

### 4.1 Principio de mínimo privilegio

Todo usuario nuevo se creará con **cero acceso a datos operativos por defecto**. El alta de usuario no implica acceso automático a ningún proyecto, unidad de trabajo, documento, comentario, dashboard ni informe.

El acceso se otorgará de forma explícita mediante una combinación de:

1. **Rol**: qué acciones puede ejecutar.
2. **Proyecto**: a qué proyectos puede acceder.
3. **Unidad de trabajo / PDV**: qué instalaciones concretas puede consultar o modificar.
4. **Permiso de acción**: lectura, edición, asignación, validación, aprobación o administración.

La experiencia visual y las consultas a base de datos deben aplicar las mismas restricciones. Ocultar un menú o botón en frontend no se considerará una medida de seguridad suficiente.

### 4.2 Alcance de acceso por rol

Reglas iniciales:

| Rol | Alcance por defecto | Acciones principales |
|---|---|---|
| ADMIN | Toda la organización | Administración completa |
| COORDINATOR | Proyectos asignados | Planificar, asignar, editar y coordinar |
| OPERATIONS | Proyectos/unidades asignados | Revisar, validar, rechazar y aprobar |
| INSTALLER | Solo unidades asignadas | Ejecutar checklist, evidencias e incidencias |
| VIEWER | Solo recursos autorizados | Lectura |

Ningún rol, salvo ADMIN, otorgará por sí solo acceso a todos los proyectos de la organización.

### 4.3 Acceso por proyecto

La tabla `project_members` definirá qué usuarios participan en cada proyecto y con qué rol dentro de ese proyecto.

Ejemplo:

```text
Usuario: patricia@empresa.com
Proyecto: Kioscos España · Rollout 2026
Rol proyecto: COORDINATOR
Acceso: todas las unidades del proyecto
```

Un usuario no incluido en `project_members` no podrá consultar el proyecto ni inferir sus datos mediante API, URLs directas, búsquedas o endpoints secundarios.

### 4.4 Acceso por unidad de trabajo / PDV

Cuando un usuario no deba ver todo el proyecto, `work_unit_assignments` limitará su acceso a unidades concretas.

Ejemplo:

```text
Usuario: horacio@proveedor.com
Proyecto: Kioscos España · Rollout 2026
Rol: INSTALLER
Unidades visibles:
- Madrid Sol
- Conde de Peñalver
- Málaga Centro
```

Ese usuario no podrá consultar el resto de PDV del proyecto, aunque conozca sus identificadores o URLs.

### 4.5 Teams y proveedores externos

La plataforma soportará equipos para simplificar asignaciones y aislar proveedores.

Ejemplo:

```text
SERCOM
├── Project Management
├── Operations
├── Logistics
└── Management

Proveedor Instalación A
└── Instaladores

Proveedor Instalación B
└── Instaladores
```

Un equipo podrá recibir acceso a un proyecto o conjunto de unidades, pero el sistema permitirá restricciones adicionales por usuario. Los proveedores externos no podrán visualizar información perteneciente a otros proveedores salvo autorización explícita.

### 4.6 Visibilidad de comentarios, documentos y evidencias

Comentarios, adjuntos y documentos podrán definir un nivel de visibilidad:

- `PARTICIPANTS`: usuarios autorizados en la unidad/proyecto.
- `INTERNAL`: solo usuarios internos de la organización.
- `MANAGEMENT`: solo perfiles/equipos autorizados de management.

Ejemplo:

```text
Comentario operativo
Visibilidad: PARTICIPANTS
"Técnico en tienda. Falta acceso al cuadro eléctrico."

Comentario interno
Visibilidad: INTERNAL
"Revisar impacto contractual con el proveedor."
```

El acceso a archivos desde el portal deberá respetar la misma lógica. La existencia de un archivo en Google Drive no otorgará acceso operativo al usuario: la aplicación comprobará proyecto, unidad, rol, asignación y visibilidad antes de permitir visualizarlo o solicitarlo. Los instaladores y proveedores externos no requerirán acceso directo al Shared Drive.

### 4.7 Permisos por acción

El sistema distinguirá como mínimo:

- `READ`
- `CREATE`
- `UPDATE`
- `ASSIGN`
- `COMPLETE_TASK`
- `UPLOAD_EVIDENCE`
- `CREATE_INCIDENT`
- `VALIDATE`
- `APPROVE`
- `MANAGE_TEMPLATE`
- `MANAGE_USERS`
- `VIEW_AUDIT`

Ejemplo de límites para INSTALLER:

Puede:
- Completar sus tareas.
- Añadir comentarios operativos.
- Subir evidencias.
- Abrir incidencias.
- Registrar llegada y fin de intervención.

No puede:
- Modificar la planificación global.
- Cambiar responsables de otros equipos.
- Eliminar tareas obligatorias.
- Modificar plantillas.
- Marcar una unidad como OPERATIVE.
- Eliminar o alterar auditoría.

### 4.8 Enforcement en Supabase / RLS

Las restricciones anteriores deberán implementarse mediante **Row Level Security (RLS)** para los datos operativos y autorización server-side para cualquier operación con Google Drive, no únicamente en la interfaz.

Las políticas deberán contemplar como mínimo:

- pertenencia a la organización;
- pertenencia al proyecto;
- asignación a la unidad cuando corresponda;
- rol y permiso de acción;
- visibilidad del recurso;
- aislamiento entre proveedores/equipos externos;
- autorización previa a lectura, subida, reemplazo o eliminación lógica de cualquier evidencia almacenada en Drive.

Principio de seguridad:

> Si el usuario no está autorizado, la fila o archivo debe ser inaccesible aunque conozca su ID, URL o endpoint.

Las funciones con privilegios elevados deberán ejecutarse exclusivamente en servidor y nunca confiar en atributos modificables desde el cliente.

---

## 5. Estados

### 5.1 Estado de tarea

- NOT_STARTED
- IN_PROGRESS
- BLOCKED
- DONE
- CANCELLED

### 5.2 Estado operativo de una unidad

```text
PLANIFICADO
    ↓
EN_PREPARACION
    ↓
READY_FOR_INSTALL
    ↓
INSTALLING
    ↓
PENDING_VALIDATION
    ↓
OPERATIVE
```

Estados alternativos:

- BLOCKED
- CANCELLED
- ON_HOLD

### 5.3 Riesgo

- LOW
- MEDIUM
- HIGH
- CRITICAL

El riesgo será independiente del estado operativo.

---

## 6. Plantillas

Las plantillas permiten reutilizar procesos completos.

Ejemplo inicial:

**Plantilla: Instalación Kiosco**

### Pre-instalación

- Confirmar PDV y contacto.
- Confirmar acceso técnico.
- Confirmar ubicación exacta del kiosco.
- Confirmar mobiliario preparado.
- Confirmar toma eléctrica.
- Confirmar conectividad.
- Asignar kiosco / número de serie.
- Confirmar envío.
- Confirmar recepción.
- Asignar instalador.
- Confirmar fecha con PDV.
- Confirmar fecha con instalador.

### Instalación

- Registrar llegada.
- Adjuntar foto inicial.
- Verificar ubicación.
- Registrar serial del kiosco.
- Instalar equipo.
- Conectar alimentación.
- Conectar red.
- Revisar cableado.
- Iniciar aplicación.
- Ejecutar prueba hardware.
- Ejecutar prueba conectividad.
- Ejecutar flujo end-to-end.
- Adjuntar fotografía final.

### Post-instalación

- Revisar evidencias.
- Resolver incidencias abiertas.
- Validación Operations.
- Confirmar funcionamiento.
- Cierre.
- Marcar Operativo.

---

## 7. Gestión dinámica del checklist

El ADMIN podrá añadir una nueva tarea a una plantilla cuando se descubra una necesidad nueva durante el proyecto.

### Alta de una nueva tarea

Campos mínimos:

- Título.
- Descripción.
- Fase.
- Responsable por defecto o rol responsable.
- Obligatoria: sí/no.
- Gate asociado.
- Prioridad.
- Evidencia obligatoria: sí/no.
- Tipo de evidencia requerida: foto/documento/otro.
- Cantidad mínima de evidencias.
- Categoría/carpeta de destino dentro de la fase.
- Fecha relativa al hito de instalación.
- Dependencias.

Ejemplo:

```text
Tarea: Confirmar toma eléctrica a menos de 2 metros
Fase: Pre-instalación
Responsable: Responsable PDV
Obligatoria: Sí
Bloquea Ready for Install: Sí
Deadline: T-7
```

### Alcance al publicar una nueva tarea

El administrador elegirá entre:

1. Solo futuras unidades.
2. Todas las unidades abiertas.
3. Unidades seleccionadas.
4. Todas las unidades, incluyendo completadas, mediante acción extraordinaria.

Por defecto, una nueva tarea **no modificará instalaciones ya cerradas**.

---

## 8. Versionado de plantillas

Las plantillas serán versionadas.

Ejemplo:

```text
Instalación Kiosco v1.0
Instalación Kiosco v1.1
Instalación Kiosco v2.0
```

Cada unidad conservará referencia a la versión utilizada.

Una modificación de plantilla nunca debe alterar silenciosamente el histórico de una instalación ya ejecutada.

---

## 9. Responsables

Cada tarea tendrá:

- `assignee_id`: responsable principal.
- Colaboradores opcionales.
- Rol responsable por defecto en plantilla.

Ejemplo:

| Tarea | Owner por defecto |
|---|---|
| Confirmar PDV | Coordinación |
| Confirmar electricidad | Tienda |
| Enviar kiosco | Logística |
| Confirmar recepción | Tienda |
| Asignar instalador | Coordinación |
| Instalación física | Instalador |
| Validación final | Operations |

La pantalla **Mis tareas** mostrará automáticamente las tareas pendientes del usuario autenticado.

---

## 10. Fechas relativas

Las plantillas deben soportar fechas relativas al hito principal de instalación.

Ejemplo:

```text
Confirmar PDV             T-20
Validar ubicación         T-15
Enviar equipo             T-10
Confirmar recepción        T-5
Confirmar técnico          T-3
Instalación                  T
Validación                  T+1
Cierre                      T+2
```

Si cambia la fecha de instalación, el sistema podrá recalcular automáticamente las fechas dependientes.

Se deberá conservar el histórico de fechas anteriores.

---

## 11. Dependencias

Las tareas podrán depender de otras tareas.

Ejemplo:

```text
Enviar equipo
    ↓
Confirmar recepción
    ↓
Ready for Install
    ↓
Instalación
    ↓
Validación
    ↓
Operativo
```

Una dependencia incompleta puede bloquear automáticamente una tarea posterior o un gate.

---

## 12. Gantt

El proyecto contará con una vista Gantt para visualizar las 40 instalaciones dentro del horizonte de dos meses.

Debe mostrar:

- Una fila por PDV.
- Periodo de preparación.
- Fecha prevista de instalación.
- Periodo de validación.
- Fecha operativa.
- Baseline original.
- Planificación actual.
- Desviación respecto al baseline.
- Línea de “Hoy”.
- Estado.
- Riesgo.
- Responsable.

### Hitos principales

- Ready for Install.
- Instalación.
- Validación.
- Operativo.

### Interacción

- Zoom día/semana/mes.
- Filtros por ciudad, provincia, responsable, estado y riesgo.
- Acceso al detalle pulsando sobre una fila.
- Replanificación controlada.

---

## 13. Mapa de España

Cada unidad tendrá:

- Dirección.
- Código postal.
- Ciudad.
- Provincia.
- Latitud.
- Longitud.

El mapa mostrará las instalaciones mediante iconos según estado.

### Estado visual

- Verde: Operativo.
- Azul: Ready for Install.
- Rojo: Not Ready.
- Naranja: At Risk / riesgo alto o crítico.

El riesgo debe mantenerse como capa independiente del estado en el modelo de datos aunque visualmente pueda resaltarse mediante color, borde o badge.

Al pulsar un punto se mostrará:

- PDV.
- Estado.
- Riesgo.
- Fecha prevista.
- Progreso del checklist.
- Responsable.
- Bloqueos críticos.
- Botón para abrir la instalación.

---

## 14. Dashboard / Control Tower

La página de inicio debe responder en segundos a la pregunta:

**¿Vamos a llegar a 40 kioscos operativos antes del deadline?**

### KPIs principales

- Objetivo total.
- Operativos.
- Ready for Install.
- Not Ready.
- Porcentaje completado.
- Instalaciones previstas por semana.
- Riesgos High/Critical.
- Forecast al deadline.
- Gap frente al objetivo.
- Tareas vencidas.
- Incidencias abiertas.

### Ejemplo

```text
Objetivo              40
Operativos            12
Ready for Install      8
Not Ready             20
High/Critical Risk     4
Forecast              36
Gap                    -4
Deadline        19/10/2026
```

---

## 15. Forecast

El forecast debe estimar cuántas unidades estarán operativas en la fecha objetivo.

La primera versión podrá basarse en reglas deterministas, sin IA.

Factores:

- Fecha prevista.
- Tareas obligatorias pendientes.
- Tareas vencidas.
- Número de días restantes.
- Incidencias abiertas.
- Dependencias bloqueadas.
- Capacidad semanal de instalación.

---

## 16. Risk Score

Propuesta inicial de scoring:

- Tarea crítica vencida: +40.
- Cada tarea vencida adicional: +20.
- Falta una tarea obligatoria a menos de 5 días: +30.
- Incidencia crítica abierta: +30.
- Material no recibido a T-3: +40.
- Instalador sin asignar a T-3: +30.
- Tienda sin confirmar a T-3: +30.

Clasificación orientativa:

```text
0–30     LOW
31–60    MEDIUM
61–80    HIGH
81–100   CRITICAL
```

El algoritmo debe ser configurable.

---

## 17. Incidencias

Cada incidencia tendrá:

- Proyecto.
- Unidad.
- Categoría.
- Severidad.
- Descripción.
- Responsable.
- Estado.
- Fecha de apertura.
- Fecha objetivo.
- Evidencias.
- Comentarios.
- Fecha de resolución.

Categorías iniciales:

- Material.
- PDV no preparado.
- Electricidad.
- Conectividad.
- Instalador.
- Acceso.
- Hardware.
- Software.
- Logística.
- Otros.

---

## 18. Evidencias y repositorio documental en Google Drive

### 18.1 Principio de arquitectura

**Google Workspace Shared Drive será el repositorio documental oficial** para fotografías, PDFs, actas, documentos y evidencias de instalación.

Responsabilidades:

```text
SUPABASE
- usuarios y permisos
- proyectos y unidades
- tareas e incidencias
- metadatos de archivos
- relaciones con tarea/incidencia
- visibilidad
- auditoría

GOOGLE SHARED DRIVE
- archivo físico
- fotografías
- PDFs
- actas
- documentos
- evidencias
```

Supabase Storage no será el repositorio principal de evidencias de negocio. Podrá utilizarse de forma técnica o temporal si fuese necesario durante el proceso de subida, pero el archivo persistente oficial deberá quedar en Drive.

### 18.2 Estructura automática de carpetas

Al crear un proyecto, el backend creará o asociará una carpeta raíz dentro del Shared Drive:

```text
/PROJECTS
  /Kioscos España 2026
```

Cada unidad/PDV tendrá su propia carpeta, utilizando código único + nombre legible para evitar duplicidades:

```text
/Kioscos España 2026
  /001 - Madrid Sol
  /002 - Conde de Peñalver
  /003 - Barcelona Glòries
```

Dentro de cada unidad se crearán, como mínimo:

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

Cuando una incidencia requiera evidencias, podrá crearse una subcarpeta específica:

```text
/04_INCIDENCIAS
  /INC-0038 - Problema cableado
```

La estructura será configurable por template para que futuros proyectos puedan utilizar fases/carpetas distintas.

### 18.3 Subida desde el portal

El usuario subirá las evidencias **desde el portal**, no desde Google Drive.

Flujo:

```text
Usuario
  -> selecciona/captura archivo
  -> Portal valida permiso y requisito
  -> Backend determina carpeta
  -> Backend genera nombre normalizado
  -> Google Drive API almacena el archivo
  -> Supabase registra metadatos + audit event
  -> UI confirma evidencia disponible
```

El usuario de campo no necesita conocer la estructura de Drive ni disponer de acceso directo a ella.

### 18.4 Metadatos de evidencias

Cada archivo deberá registrar, como mínimo:

- `project_id`
- `work_unit_id`
- `phase_id` opcional
- `task_id` opcional
- `incident_id` opcional
- `drive_file_id`
- `drive_folder_id`
- nombre original
- nombre normalizado
- MIME type
- tamaño
- tipo/categoría de evidencia
- usuario que realizó la carga
- email snapshot del usuario
- fecha y hora
- nivel de visibilidad (`PARTICIPANTS`, `INTERNAL`, `MANAGEMENT`)
- estado de archivo (`ACTIVE`, `REPLACED`, `DELETED_LOGICALLY`)

### 18.5 Convención de nombres

El backend normalizará nombres para evitar archivos ambiguos como `IMG_1234.jpg` o `final_final.jpg`.

Ejemplo:

```text
2026-08-19_1047_SOL_INSTALL_CABLEADO_HORACIO_01.jpg
```

La convención deberá conservar suficiente contexto para comprender el archivo incluso fuera del portal.

### 18.6 Evidencia requerida por tarea

Una tarea podrá declarar requisitos de evidencia:

- obligatoria o no;
- tipo de archivo;
- cantidad mínima;
- categorías requeridas;
- instrucciones de captura.

Ejemplo:

```text
Tarea: Finalizar instalación
Evidencias requeridas:
- 1 foto frontal del kiosco
- 1 foto del cableado posterior
- 1 foto de pantalla encendida
- 1 foto general del PDV

Progreso: 3 / 4
```

Si la evidencia es requisito de una tarea/gate, la tarea no podrá completarse hasta cumplirla.

### 18.7 Permisos y acceso a Drive

Los instaladores y proveedores externos **no recibirán acceso directo al Shared Drive por defecto**. El portal actuará como capa de acceso autorizada.

Para cada solicitud de visualización, carga o acción sobre una evidencia, el backend deberá comprobar:

- organización;
- proyecto;
- unidad/PDV;
- asignación;
- rol y permiso;
- nivel de visibilidad.

Los perfiles internos autorizados podrán disponer del CTA:

`Abrir carpeta en Google Drive`

Este CTA será permission-aware y no aparecerá a perfiles sin acceso directo al repositorio.

### 18.8 UX de carga y resiliencia

La experiencia móvil deberá contemplar:

- captura directa desde cámara;
- selección desde galería/archivos;
- preview antes de enviar cuando aporte valor;
- progreso de subida;
- compresión razonable de imágenes;
- estado `uploading`;
- estado `uploaded`;
- error de subida;
- reintento;
- prevención de duplicados accidentales;
- indicación clara de `x / n evidencias requeridas`;
- recuperación ante conectividad degradada sin marcar falsamente una evidencia como subida.

Una tarea no deberá considerarse cumplida hasta que el backend confirme tanto el archivo en Drive como el registro de metadatos en Supabase.

### 18.9 Auditoría

La carga, reemplazo, cambio de visibilidad y eliminación lógica de una evidencia generará un `audit_event` con usuario, email, timestamp, entidad asociada y `drive_file_id`.

La eliminación física desde el portal deberá estar muy restringida. Por defecto se priorizará eliminación lógica o reemplazo para conservar trazabilidad.

---

## 19. Comentarios y timeline

Cada unidad tendrá una timeline cronológica que combine:

- Comentarios, respetando su nivel de visibilidad.
- Cambios de estado.
- Cambios de fechas.
- Cambios de responsable.
- Finalización de tareas.
- Creación/resolución de incidencias.
- Carga de archivos.
- Cambios de riesgo.

Ejemplo:

```text
19/08/2026 09:42
Patricia Gómez · patricia@empresa.com
Comentó: "Pendiente confirmación de acceso técnico."

19/08/2026 09:31
Juan Rodríguez · juan@empresa.com
Risk: HIGH -> CRITICAL

18/08/2026 00:01
Sistema
Tarea "Confirmar recepción" marcada como vencida.
```

Los comentarios deberán almacenar como mínimo `visibility`, `author_user_id`, `created_at` y, cuando aplique, el equipo/ámbito autorizado. Los eventos automáticos de sistema se mostrarán únicamente si el usuario tiene acceso a la entidad que originó el evento.

---

## 20. Auditoría

La auditoría será append-only.

No se debe depender exclusivamente del frontend para registrar cambios críticos.

Los eventos importantes se generarán mediante lógica de servidor y/o triggers PostgreSQL.

Campos orientativos:

```text
audit_events
- id
- project_id
- work_unit_id
- entity_type
- entity_id
- action
- actor_user_id
- actor_name_snapshot
- actor_email_snapshot
- old_value
- new_value
- metadata
- created_at
```

---

## 21. Importación inicial de los 40 PDV

La plataforma permitirá importar un CSV/XLSX con los 40 PDV.

Campos recomendados:

- Código PDV.
- Nombre.
- Dirección.
- CP.
- Ciudad.
- Provincia.
- Latitud / longitud si existen.
- Contacto.
- Teléfono.
- Email.
- Fecha de instalación prevista.
- Empresa instaladora.
- Instalador.
- Observaciones.

Después de la importación:

1. Se crea una unidad por PDV.
2. Se aplica la plantilla seleccionada.
3. Se generan fases y tareas.
4. Se calculan fechas relativas.
5. Se asignan responsables por defecto.

---

## 22. Modelo de datos propuesto

### Núcleo

```text
organizations
teams
team_members
projects
project_members
project_team_access
work_units
work_unit_phases
work_unit_assignments
work_unit_team_access
milestones
```

### Plantillas

```text
project_templates
template_versions
template_phases
template_tasks
```

### Ejecución

```text
tasks
task_dependencies
task_collaborators
task_assignments
```

### Operación

```text
incidents
comments                 # incluye visibility
attachments              # metadatos + drive_file_id + drive_folder_id + visibility
evidence_requirements
equipment
equipment_assignments
```

### Seguridad y auditoría

```text
profiles
roles
permissions
role_permissions
resource_visibility
audit_events
```

Relaciones de acceso clave:

```text
User
 ├─ organization membership
 ├─ team membership
 ├─ project membership
 └─ work unit assignment

Role
 └─ permissions/actions

Resource
 └─ visibility scope
```

---

## 23. Stack técnico

### Frontend

- Next.js.
- React.
- TypeScript.
- Tailwind CSS.

### Backend

- Supabase PostgreSQL.
- Supabase Auth.
- Supabase Realtime cuando aporte valor.
- Server-side integration con Google Drive API.

### Repositorio documental

- Google Workspace Shared Drive.
- Carpetas automáticas por proyecto/unidad/fase/incidencia.
- Drive IDs persistidos en Supabase.
- Google Drive API invocada exclusivamente desde backend autorizado.
- Supabase Storage solo como opción técnica/transitoria, no como repositorio oficial de evidencias.

### Seguridad

- Row Level Security en todas las tablas expuestas.
- RBAC para permisos de acción.
- Acceso explícito por proyecto y por unidad de trabajo.
- Equipos y aislamiento de proveedores externos.
- Autenticación por email.
- Autorización server-side para operaciones de Google Drive.
- El Shared Drive no sustituye las reglas de acceso del portal.
- Proveedores externos sin acceso directo a Drive por defecto.
- Recursos privados por defecto.
- Cero acceso operativo para usuarios recién creados hasta asignación explícita.
- Funciones privilegiadas exclusivamente server-side.

### Hosting

- Vercel.

### Código

- GitHub.
- Pull Requests.
- Branch protection.
- GitHub Actions para CI.

### Entornos

- Development.
- Preview/Staging.
- Production.

---

## 24. Requisitos no funcionales

- Responsive web.
- Mobile usable por instaladores.
- Carga inicial de dashboard < 3 s en condiciones normales.
- Acciones habituales < 1 s percibido siempre que sea posible.
- Disponibilidad objetivo >= 99,5%.
- Backups automáticos.
- RLS en todas las tablas expuestas.
- Pruebas automatizadas de aislamiento entre proyectos, PDV, equipos y proveedores.
- Verificación de acceso denegado mediante ID/URL directa para recursos no autorizados.
- Evidencias persistentes en Shared Drive con autorización por recurso desde el portal.
- Consistencia transaccional lógica: no confirmar subida hasta registrar archivo en Drive + metadatos en Supabase.
- Reintentos seguros e idempotencia para evitar duplicados en fallos de red.
- Logs de errores.
- Auditoría inmutable para cambios críticos.
- Arquitectura multi-proyecto desde v1.
- Arquitectura multi-template desde v1.

---

## 25. Pantallas MVP

1. Login.
2. Dashboard / Control Tower.
3. Proyectos.
4. Unidades de trabajo.
5. Detalle de unidad.
6. Checklist.
7. Mis tareas.
8. Gantt.
9. Mapa.
10. Incidencias.
11. Evidencias / galería documental.
12. Plantillas.
13. Gestión de usuarios, equipos y accesos.
14. Matriz de permisos / asignaciones.
15. Auditoría.
16. Project Settings / integración Google Drive.

---

## 26. Detalle de unidad

Tabs recomendadas:

```text
Resumen
Checklist
Timeline
Evidencias
Incidencias
Comentarios
Auditoría
```

Cabecera:

- Nombre PDV.
- Código.
- Estado operativo.
- Risk score.
- Fecha instalación.
- Responsable.
- Progreso.

---

## 27. Vista Mis tareas

Cada usuario verá únicamente el trabajo que requiere su atención **y para el que tenga acceso explícito**. La vista nunca debe revelar nombres de proyectos, PDV o tareas fuera de su ámbito autorizado.

Filtros rápidos:

- Hoy.
- Vencidas.
- Esta semana.
- Bloqueadas.
- Por proyecto.

Cada tarea mostrará:

- Título.
- PDV.
- Fase.
- Deadline.
- Prioridad.
- Estado.
- Riesgo asociado.

---

## 28. Gates iniciales para kioscos

### Gate READY FOR INSTALL

Debe requerir como mínimo:

- PDV confirmado.
- Acceso confirmado.
- Electricidad confirmada.
- Conectividad confirmada.
- Kiosco asignado.
- Material recibido.
- Instalador asignado.
- Fecha confirmada.

### Gate PENDING VALIDATION

Debe requerir:

- Instalación física completada.
- Serial registrado.
- Prueba hardware OK.
- Prueba conectividad OK.
- Prueba end-to-end OK.
- Evidencias obligatorias adjuntas.

### Gate OPERATIVE

Debe requerir:

- Todas las tareas obligatorias anteriores completadas.
- Sin incidencia crítica abierta.
- Validación de Operations.

---

## 29. MVP recomendado

### Incluido

- Multi-proyecto.
- Multi-unidad.
- Usuarios, roles y equipos.
- Acceso por proyecto y por unidad/PDV.
- Matriz de permisos y RLS.
- Visibilidad de comentarios/documentos.
- Plantillas versionadas.
- Checklist configurable.
- Responsable por tarea.
- Fechas relativas.
- Dependencias.
- Gates.
- Estados.
- Riesgo.
- Dashboard.
- Lista filtrable.
- Mis tareas.
- Gantt.
- Mapa.
- Comentarios.
- Evidencias en Google Workspace Shared Drive.
- Estructura automática de carpetas por proyecto/PDV/fase/incidencia.
- Evidencias requeridas por tarea y gates.
- Galería de evidencias y estados de carga/reintento.
- Incidencias.
- Audit trail.
- Importación CSV/XLSX.
- Responsive móvil.

### Fuera de v1

- IA generativa.
- App nativa iOS/Android.
- Chat interno tipo Slack.
- ERP completo.
- Facturación.
- Gestión avanzada de compras.
- Automatizaciones complejas externas.

---

## 30. Arquitectura de integración documental

```text
                         PORTAL NEXT.JS
                              |
                 +------------+------------+
                 |                         |
                 v                         v
          SUPABASE / POSTGRES       BACKEND SERVER-SIDE
          - Auth                    - valida permisos
          - RLS                     - resuelve carpeta
          - proyectos               - normaliza nombre
          - tareas                  - llama Drive API
          - incidencias                     |
          - attachments metadata            v
          - audit_events            GOOGLE SHARED DRIVE
                                    - archivos físicos
                                    - carpetas proyecto
                                    - carpetas unidad
                                    - fases/incidencias
```

Regla arquitectónica:

> Drive almacena el archivo; Supabase define qué significa, a qué pertenece, quién puede acceder desde el portal y qué ocurrió con él.

---

## 31. Evolución posterior

- Alertas automáticas por email / Teams / Slack.
- SSO corporativo.
- Integraciones SAP/ERP.
- Integración logística.
- Geocodificación automática.
- Capacity planning de instaladores.
- Forecast avanzado.
- Detección automática de riesgo.
- Aplicación móvil/PWA avanzada.
- API externa.
- Webhooks.
- Dashboards por proveedor.
- Flujos de aprobación de acceso y revisiones periódicas de permisos.

---

## 32. Mockups de referencia

### Dashboard ejecutivo

![Dashboard](dashboard.png)

### Listado de instalaciones

![Unidades de trabajo](installations.png)

### Gantt

![Gantt](gantt.png)

### Mapa de España

![Mapa](mapview.png)

### Detalle de instalación y checklist

![Detalle](detail.png)

---

## 33. Criterio de éxito del proyecto inicial

El producto será exitoso si permite que cualquier responsable autorizado pueda responder, sin recurrir a cadenas de emails o mensajes externos, a estas preguntas:

1. ¿Cuántos kioscos están operativos?
2. ¿Cuántos están realmente Ready for Install?
3. ¿Qué falta en cada PDV?
4. ¿Quién es responsable de cada pendiente?
5. ¿Qué tareas están vencidas?
6. ¿Qué instalaciones están en riesgo?
7. ¿Qué cambió, quién lo cambió y cuándo?
8. ¿Qué evidencia existe de cada instalación?
9. ¿Vamos a llegar a 40 operativos antes del deadline?
10. Si no llegamos, ¿qué cuatro o cinco acciones debemos priorizar hoy para recuperar el plan?

---

## 34. Decisión de producto

La aplicación debe construirse como **Project Operations Platform**, no como una aplicación específica de kioscos.

El rollout de 40 kioscos será el primer template y la primera prueba real del modelo.

La prioridad de la v1 es control operativo, trazabilidad y anticipación de riesgos. Cualquier funcionalidad que no contribuya directamente a esos tres objetivos debe posponerse.
