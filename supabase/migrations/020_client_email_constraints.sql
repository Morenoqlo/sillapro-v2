-- Migration 020 · Data quality: validar formato y unicidad de clients.email.
--
-- Problema (M7): clients.email se agregó en 011 sin CHECK ni UNIQUE.
-- Sin validación se aceptan strings basura ("asdf", "n/a") y un mismo
-- cliente puede quedar duplicado con distintas variantes de email.
--
-- Solución:
--   - CHECK regex (permite '' para no romper filas existentes)
--   - Índice UNIQUE condicional cuando email <> ''

BEGIN;

-- Limpieza preventiva: cualquier email no-vacío que no matchee el regex
-- queda en '' (vacío). Evita que el ADD CONSTRAINT falle con filas legacy.
UPDATE public.clients
SET email = ''
WHERE email <> ''
  AND email !~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$';

-- CHECK constraint: regex moderado (no es RFC completo, pero filtra spam)
ALTER TABLE public.clients
  ADD CONSTRAINT clients_email_format_check
  CHECK (
    email = '' OR email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
  );

-- UNIQUE INDEX condicional: no más de 1 cliente por (shop, email) cuando hay email.
-- Vacío sigue permitido sin restricción (matching de teléfono ya cubre eso).
CREATE UNIQUE INDEX IF NOT EXISTS clients_unique_email_per_shop_idx
  ON public.clients (barbershop_id, lower(email))
  WHERE email <> '';

COMMIT;
