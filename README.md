# SillaPro v2

Software de gestión para barberías chicas (1-4 sillas).
Multi-tenant, multi-rol (owner / admin / barber), reservas públicas.

> En producción para validar con clientes reales en Antofagasta.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 8 + TypeScript (strict + `exactOptionalPropertyTypes`) |
| UI | Tailwind 3 + react-hook-form + Zod 4 + cmdk + recharts |
| Estado server | TanStack Query 5 |
| Auth + DB | Supabase (Postgres con RLS multi-tenant) |
| Hosting | Vercel (SPA con rewrites) |
| PWA | vite-plugin-pwa |
| Tests | Vitest (unit) + Playwright (E2E) |
| CI | GitHub Actions (lint, typecheck, tests, audit) |

---

## Local dev

```bash
# Requiere Node 20+
npm ci

# Setup .env con tus claves de Supabase (ver .env.example)
cp .env.example .env

npm run dev          # http://localhost:5173
npm test             # unit tests
npm run e2e          # Playwright (necesita .env válido contra Supabase real)
npm run lint
npm run typecheck
npm run build
```

---

## Estructura

```
src/
├── app/           Layouts, guards, providers, router, ErrorBoundary
├── features/      Una carpeta por área de producto (auth, hoy, cobrar, …)
├── hooks/         Hooks compartidos (useAuth, useTenant, …)
├── lib/           Helpers (supabase client, dates, money, slots, …)
├── types/         Types globales
└── ui/            Componentes UI base (Button, Card, Dialog, …)

supabase/
├── migrations/      21 migrations (001 → 021), aplicables individualmente
└── email-templates/ HTML en español para pegar en Supabase Auth → Templates

tests/
├── unit/   81 vitest
└── e2e/    38 Playwright
```

---

## Migraciones

Cada migración es un `.sql` idempotente con `BEGIN; … COMMIT;`.
Aplicar manualmente contra `SUPABASE_DB_URL`:

```bash
node -e "
import('pg').then(async (pg) => {
  const fs = await import('node:fs');
  await import('dotenv/config');
  const c = new pg.default.Client({ connectionString: process.env.SUPABASE_DB_URL });
  await c.connect();
  const sql = fs.readFileSync('supabase/migrations/XXX_name.sql', 'utf8');
  await c.query(sql);
  console.log('OK');
  await c.end();
});
"
```

### Resumen
- **001** schema inicial + RLS + helpers `user_has_barbershop_role()`
- **002** propinas, slug, multi-service, vista MV de KPIs
- **003-004** policies + grants base (endurecidos por 016)
- **005-007** RPCs onboarding / cobro / cierre de día
- **008-010** reserva pública + WhatsApp phone + invites
- **011-013** v3 (closed_days, email, barber overrides) + fix de propinas
- **014-017** **audit de seguridad** (bloquea scrape, rate limit, revoke amplio, RPC para invites)
- **018-021** input validation + audit triggers + email/slug constraints

---

## Scripts

```bash
# Llena una barbería demo con datos realistas
node scripts/seed-demo.mjs --slug=norte-fino

# Backup DB
./scripts/backup-db.sh
```

---

## Seguridad (high-level)

- RLS activa en TODAS las tablas con políticas por rol
- `anon` solo accede a 5 tablas + 3 RPCs explícitas (reserva pública)
- Rate limit en `book_appointment_public`: 3/h por teléfono, 30/h por shop
- Audit log en eventos críticos (signup, membership, closeout, invite consumido)
- Headers: HSTS + CSP + X-Frame-Options + Referrer-Policy en `vercel.json`
- ErrorBoundary global previene fugas de stack trace

Ver `docs/superpowers/plans/` para historial de decisiones.

---

## Despliegue

`main` → deploy automático en Vercel.
CI por PR: lint + typecheck + unit + E2E smoke + `npm audit --audit-level=high`.

URLs en producción:
- App: <https://sillapro-v2.vercel.app>
- Reserva pública: `/reservar/<slug>`
- Invitación de barbero: `/unirse?token=<uuid>`

---

## Licencia

Privado · todos los derechos reservados.
