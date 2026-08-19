# Gestor de Proyectos SERCOM · Vodafone

Plataforma para planificar, ejecutar y controlar proyectos operativos
multi-unidad. Primer caso de uso: rollout de 40 kioscos.

Especificación funcional completa:
[`docs/SPECS_GESTOR_PROYECTOS_SERCOM_VODAFONE.md`](./docs/SPECS_GESTOR_PROYECTOS_SERCOM_VODAFONE.md).
Artifacts de diseño (blueprint, wireframes, design system, Hi-Fi) en
[`design/`](./design).

## Stack

- Next.js 16 (App Router, `src/`) + React 19 + TypeScript + Tailwind v4.
- Supabase: Postgres + Auth (magic link por email) + RLS nativo.
- Google Workspace Shared Drive como repositorio documental (Supabase solo
  guarda metadatos — ver spec sección 18).
- Vercel + GitHub Actions (pendiente de configurar CI).

> **Nota Next 16:** esta versión renombró `middleware.ts` a `proxy.ts`
> (misma función). El helper de sesión vive en
> [`src/proxy.ts`](./src/proxy.ts). Antes de tocar convenciones de
> routing/fetching, revisa `node_modules/next/dist/docs/` — hay cambios
> respecto a lo que la mayoría de material de referencia todavía documenta.

## Por qué Supabase nativo (no Prisma+NextAuth)

Portal-RRHH-Sercom usa Prisma + NextAuth (Microsoft Entra ID) sobre un
Postgres compartido con `DATABASE_SCHEMA` por app. Este proyecto usa
**Supabase Auth + `supabase-js` + RLS con `auth.uid()`** porque así lo pide
el spec (sección 23) y porque el modelo de permisos (RBAC + RLS multi-nivel:
organización → proyecto → unidad/PDV → equipo) depende de tener `auth.uid()`
disponible de forma nativa dentro de las políticas RLS. Requiere un
**proyecto Supabase propio** para esta app (no reutilizar el de RRHH).

## Setup

```bash
npm install
cp .env.example .env.local   # rellena con las credenciales del proyecto Supabase de ESTA app
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push         # aplica supabase/migrations/*
npx supabase gen types typescript --linked > src/lib/supabase/types.ts
npm run dev
```

Variables de entorno: ver [`.env.example`](./.env.example). Las claves de
Google Drive (service account) son necesarias para subir evidencias (spec
18.3) pero no bloquean el arranque local del resto de la app.

## Modelo de datos y seguridad

Todo vive en `supabase/migrations/`, en orden de aplicación:

1. `20260819100000_schema.sql` — extensiones, enums, tablas (núcleo,
   plantillas versionadas, ejecución, operación, permisos/auditoría).
2. `20260819100100_functions.sql` — funciones `SECURITY DEFINER` que
   resuelven el rol efectivo de un usuario para una organización, proyecto
   o unidad de trabajo (con herencia: COORDINATOR/OPERATIONS/ADMIN de
   proyecto ven todas sus unidades; INSTALLER/VIEWER necesitan asignación
   explícita — spec 4.2–4.4), triggers de `updated_at`, alta automática de
   `profiles` y **auditoría append-only** vía trigger (spec 20).
3. `20260819100200_rls.sql` — RLS deny-by-default en todas las tablas.
4. `20260819100300_seed_permissions.sql` — matriz `role_permissions`
   inicial (spec 4.7 / 16), editable en caliente sin nueva migración.

**Limitación conocida:** RLS de Postgres es a nivel de fila, no de columna.
Restricciones más finas (p.ej. un INSTALLER no debería poder tocar la
planificación global de una unidad aunque tenga `UPDATE` en la fila por ser
`assignee` de una tarea) se aplican en Server Actions / capa de aplicación,
no solo en RLS.

**Bootstrap:** dar de alta el primer `ADMIN` de una organización requiere el
service role (`src/lib/supabase/service-role.ts`), porque las policies de
`organization_members` exigen ya ser ADMIN para poder insertar — nadie lo es
al crear la organización. Falta el flujo/script para esto.

## Qué falta (fuera de este scaffold)

- Las 16 pantallas MVP (spec sección 25) — este commit solo trae login +
  home mínimos para probar el circuito auth → RLS de punta a punta.
  Reutilizar tokens y componentes de `design/04-design-system.html` y las
  Hi-Fi (`design/05`–`09`) al construirlas.
- Integración server-side con Google Drive API (crear carpetas, subir
  evidencias, normalizar nombres — spec 18.2/18.3/18.5).
- Importación CSV/XLSX de PDV (spec 21).
- Motor de forecast y risk score (spec 15/16).
- CI (GitHub Actions) y branch protection.
