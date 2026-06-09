-- Migration 016 · Defense-in-depth: revocar GRANT global, otorgar explícito.
--
-- Problema (C5): migration 004 hace
--   GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
--   GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
-- Cualquier tabla/función futura quedaba accesible por anon hasta revocar.
-- RLS protege los datos, pero si una migration olvida `ENABLE ROW LEVEL SECURITY`
-- → fuga inmediata.
--
-- Solución:
--   - REVOKE el SELECT/EXECUTE global a anon
--   - Otorgar solo lo necesario para el flujo público:
--     SELECT en: barbershops, services, barbers, closed_days, barber_services
--     EXECUTE en: book_appointment_public, get_public_busy_slots,
--                 get_public_invite_info (creada en 017)
--   - ALTER DEFAULT PRIVILEGES → NO grant futuro a anon

BEGIN;

-- 1. Revocar grants amplios
REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;

-- 2. Otorgar SELECT solo en las tablas que el flujo público necesita.
--    RLS sigue siendo la primera línea (cada policy controla qué filas).
GRANT SELECT ON public.barbershops    TO anon;
GRANT SELECT ON public.services       TO anon;
GRANT SELECT ON public.barbers        TO anon;
GRANT SELECT ON public.closed_days    TO anon;
GRANT SELECT ON public.barber_services TO anon;

-- 3. Otorgar EXECUTE solo en RPCs públicas explícitas
GRANT EXECUTE ON FUNCTION public.book_appointment_public(
  UUID, UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT, BOOLEAN
) TO anon;

GRANT EXECUTE ON FUNCTION public.get_public_busy_slots(
  UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ
) TO anon;

-- 4. authenticated keeps its full grants (RLS still enforces multi-tenancy).
--    No tocamos lo de authenticated.

COMMIT;
