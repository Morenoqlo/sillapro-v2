# SillaPro v2

Reescritura completa de SillaPro. Stack: React 18 + TypeScript + Vite + Tailwind + Supabase.

## Setup local

```
npm install
cp .env.example .env   # Llenar valores reales de Supabase
npm run dev
```

## Scripts

- `npm run dev` — servidor dev en http://localhost:5173
- `npm run build` — build de producción
- `npm run lint` — linter
- `npm run typecheck` — chequeo de tipos
- `npm test` — tests unitarios (Vitest)
- `npm run e2e` — tests end-to-end (Playwright)
- `npm run e2e:install` — instala browsers de Playwright (correr 1 vez)

## Backups

```
./scripts/backup-db.sh
```

Genera `backups/sillapro-YYYYMMDD-HHMMSS.sql.gz` y mantiene los últimos 8. Subir manualmente a Google Drive o S3.

Programar semanal con cron (ej: domingos 03:00):

```
0 3 * * 0 cd /path/to/sillapro-v2 && ./scripts/backup-db.sh
```

## Documentación

Ver en el repo padre:

- Spec completo: `docs/superpowers/specs/2026-05-30-sillapro-v2-rediseno-design.md`
- Plan Fase 0: `docs/superpowers/plans/2026-05-30-fase-0-cimientos.md`
