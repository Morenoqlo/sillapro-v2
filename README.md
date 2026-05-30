# SillaPro v2

Reescritura completa de SillaPro. Stack: React 18 + TypeScript + Vite + Tailwind + Supabase.

## Setup local

```
npm install
cp .env.example .env   # Llenar valores de Supabase
npm run dev
```

## Scripts

- `npm run dev` — servidor dev en http://localhost:5173
- `npm run build` — build de producción
- `npm run lint` — linter
- `npm run typecheck` — chequeo de tipos
- `npm test` — tests unitarios (Vitest)
- `npm run e2e` — tests end-to-end (Playwright)

Ver `docs/superpowers/specs/2026-05-30-sillapro-v2-rediseno-design.md` en el repo padre para el spec completo.
