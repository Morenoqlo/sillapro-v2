# AUDIT-REPORT · SillaPro v2

> Metodología: **nextjs-audit-skill** (sofbarre) — adaptada de Next.js a **Vite + React + Supabase**.
> Análisis local-only sobre código fuente. No se conectó a producción ni se ejecutó código del repo de la skill.
> Fecha: 2026-06-11

---

## Resumen ejecutivo

SillaPro es un SaaS multi-tenant para barberías (React 19 + Vite 8 + TypeScript strict + Supabase + Vercel).
El proyecto **ya pasó por 9 lotes de auditoría de seguridad/calidad** antes de este informe, por lo que el
puntaje es alto. Quedan 3 findings reales y accionables, todos de severidad media o baja.

**Nota de stack:** la skill original es para Next.js. Varios de sus checks **no aplican** a una SPA Vite
(middleware, Server Components, API routes, `next.config.js`, `revalidate`/`cache`). En esos casos se evaluó
el equivalente real del proyecto (React Router guards, RLS server-side, `vercel.json`, React Query).

### Puntaje global: **91 / 100 — Good shape** ✅

| Categoría | Puntaje | Estado |
|---|---|---|
| 🔐 Security | 21 / 25 | Bueno |
| 🗄️ Database | 24 / 25 | Excelente |
| ⚡ Performance | 23 / 25 | Muy bueno |
| 📈 Scalability | 23 / 25 | Muy bueno |

Escala: **80+** Good shape · **60–79** Needs work · **<40** Critical.

---

## 🔐 Security — 21 / 25

### ✅ Aprobado
- **RLS completo:** todas las tablas tienen `ENABLE ROW LEVEL SECURITY` + políticas. Usan helpers
  `user_has_barbershop_role()` / `user_barber_id()` (SECURITY DEFINER) basados en `auth.uid()`.
- **Aislamiento de tenant:** cada tabla filtra por `barbershop_id`; verificado por E2E `rls-isolation.spec.ts`.
- **Protección de rutas:** guards `RequireAuth`, `RequireOnboarded`, `PublicOnly` en `src/app/guards/`.
  La defensa real es server-side (RLS), no solo UI.
- **Secrets:** solo `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` en el bundle (públicos por diseño).
  `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_DB_URL` solo en scripts locales. `0` ocurrencias de `service_role`
  en `src/`. `.env` en `.gitignore`.
- **Security headers:** `vercel.json` con HSTS, CSP (sin inline scripts), X-Frame-Options DENY,
  X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- **Rate limit en reserva pública:** `book_appointment_public` limita 3/hora por teléfono y 30/hora por shop
  (migration 015) + validación de longitud/regex de inputs.
- **Grants explícitos:** `anon` solo accede a 5 tablas + 3 RPCs (migration 016). No hay GRANT ALL.

### ⚠️ Findings

**[MAJOR · −3] Sin CAPTCHA / bot-protection en formularios públicos**
- `src/features/auth/RegisterPage.tsx`, `LoginPage.tsx`, y la reserva pública `StepConfirmar.tsx` no
  validan ningún token anti-bot. `0` ocurrencias de captcha/turnstile/hcaptcha en el código.
- Riesgo: un bot puede crear cuentas o reservas en masa. El rate-limit de `book_appointment_public` mitiga
  parcialmente la reserva, pero el registro queda expuesto.
- Fix recomendado: Cloudflare Turnstile (gratis) en `/register` y en el paso de confirmación de reserva,
  validando el token server-side en una Edge Function o en la RPC.

**[MINOR · −1] Rate limiting de auth depende solo del default de Supabase**
- Login / signup / reset no tienen una capa propia de rate-limit; se apoyan en el límite nativo de Supabase
  Auth (≈30/h por IP), que no es configurable finamente.
- Fix recomendado: aceptable para la escala actual. Al crecer, agregar Turnstile (cubre esto y el anterior).

---

## 🗄️ Database — 24 / 25

### ✅ Aprobado
- **PKs:** `UUID DEFAULT gen_random_uuid()` en todas las tablas (ideal para multi-tenant).
- **FKs con cascade intencional:** `ON DELETE CASCADE` (datos hijos), `RESTRICT` (citas que referencian
  catálogo), `SET NULL` (membership→barber). Compuestas `(id, barbershop_id)` para forzar tenancy.
- **`updated_at` automático:** trigger `set_updated_at` en barbershops, barbers, services, clients,
  appointments, etc.
- **Índices:** 25 índices definidos — cubren `barbershop_id`, FKs, búsquedas por nombre/teléfono,
  `paid_at`, `starts_at`, `business_date`, GIN sobre `audit_events.metadata`.
- **Anti double-booking:** constraint `EXCLUDE USING gist` sobre `(barbershop_id, barber_id, tstzrange)`.
- **Multi-tenancy:** `barbershop_id` + RLS en todas las tablas. Sólido.
- **Audit table:** `audit_events` existe **y se escribe** vía triggers (migration 019): signup, membership,
  cierre de caja, invite aceptado.

### ⚠️ Findings

**[MINOR · −1] `audit_events` sin política de retención/cleanup**
- La tabla crece indefinidamente. Sin job de limpieza ni partición.
- Fix recomendado: cron mensual (`pg_cron` o función Supabase) que borre eventos > 12 meses, o partición por mes.

---

## ⚡ Performance — 23 / 25

### ✅ Aprobado
- **Sin N+1:** las queries usan joins de Supabase (`client:clients(...)`, `barber:barbers(...)`) en lugar de
  consultas por fila.
- **Columnas explícitas:** la mayoría de hooks seleccionan columnas concretas (migración del audit Lote 3).
- **Code splitting:** `React.lazy()` en rutas pesadas; Reportes (recharts ~346KB) en chunk separado, no se
  descarga en la reserva pública. Bundle principal 744KB.
- **Caching:** React Query con `staleTime` por hook. `preconnect` a Supabase en `index.html`.
- **Paginación parcial:** `useClients` (200), `useMyHistory` (30), `useClientAppointments` (50).

> Nota: `revalidate`/`cache`/Server Components no aplican (Vite SPA). El equivalente es React Query, OK.

### ⚠️ Findings

**[MINOR · −1] `useReportData` hace `select('*')` sobre appointments del rango y une client-side**
- `src/features/reportes/hooks/useReportData.ts:136` trae todas las citas del rango y cruza con payments en
  el navegador. Con 12+ meses de datos puede pesar.
- Fix recomendado: vista materializada o RPC de agregación server-side (es el item M10 del audit previo).

**[MINOR · −1] Listas de catálogo sin límite duro**
- `useBarbers` / `useServices` traen todo sin `.limit()`. Hoy son datasets chicos (1-10 filas), pero sin tope.
- `useDayCloseout` usa `select('*')` (1 fila — impacto nulo, se deja anotado).
- Fix recomendado: límite defensivo (p.ej. 100) por consistencia.

---

## 📈 Scalability — 23 / 25

### ✅ Aprobado
- **SaaS-ready:** multi-tenant, roles (owner/admin/barber), onboarding self-service, invitación de barberos.
- **Hosting apropiado:** Vercel (SPA) + Supabase es correcto para la escala actual (1-50 barberías). No hay
  razón para VPS/Docker todavía — la skill coincide: quedarse en Vercel+Supabase en etapa temprana.
- **Degradación elegante:** `ErrorBoundary` global evita pantalla blanca ante errores de render.
- **CI:** GitHub Actions con lint + typecheck + unit + E2E smoke + `npm audit`.

### ⚠️ Findings

**[MINOR · −1] Sin política de retención de datos a largo plazo**
- `appointments`, `payments`, `audit_events` crecen sin archivado. A escala de cientos de barberías × años,
  conviene archivar/particionar.
- Fix recomendado: definir retención (p.ej. archivar citas > 24 meses) cuando se pase de ~20 barberías.

**[MINOR · −1] Backups no automatizados**
- Existe `scripts/backup-db.sh` pero es manual. Supabase hace backups diarios en su plan, pero no hay un
  backup propio programado.
- Fix recomendado: confiar en backups de Supabase para empezar; automatizar `backup-db.sh` vía cron al crecer.

---

## Checklist priorizado de fixes

### Antes de escalar a varios clientes
- [ ] **[MAJOR]** Cloudflare Turnstile en `/register` y reserva pública (cubre los 2 findings de Security)

### Cuando haya ~20 barberías
- [ ] **[MINOR]** Vista materializada / RPC para `useReportData`
- [ ] **[MINOR]** Política de retención + cleanup de `audit_events` y citas viejas
- [ ] **[MINOR]** Automatizar backups

### Higiene (cuando haya tiempo)
- [ ] **[MINOR]** Límite duro en `useBarbers` / `useServices`
- [ ] **[MINOR]** Reemplazar el `select('*')` de `useReportData` por columnas explícitas

---

## Conclusión

**91/100 — Good shape.** El producto está en estado saludable para lanzar a sus primeros clientes. El único
finding de severidad media (CAPTCHA) no bloquea la validación con clientes onboarding-eados manualmente; se
vuelve relevante cuando el registro quede abierto al público sin asistencia. El resto son optimizaciones que
recién importan a escala (cientos de barberías / años de datos).

Coherente con la auditoría previa de 9 lotes: no aparecieron findings críticos nuevos.
