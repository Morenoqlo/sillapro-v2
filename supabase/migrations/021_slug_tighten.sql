-- Migration 021 · Endurecer regex de slug.
--
-- Problema (B8): el CHECK actual sobre barbershops.slug es
--   slug ~ '^[a-z0-9-]+$'
-- Esto acepta strings raros como "--", "-foo", "foo-", "a--b". Resultan
-- en URLs feas y, peor, abren puerta a typosquatting ("norte-fino" vs
-- "norte--fino").
--
-- Nuevo regex: minúsculas/dígitos, sin leading/trailing hyphen, sin
-- guiones consecutivos, longitud 3-50.

BEGIN;

-- Limpieza preventiva: NULL out cualquier slug existente que no cumpla
-- (DB ya tenía el regex viejo, así que el nuevo debe ser un superset de
-- los validos viejos — sólo agrega anti-patrones).
UPDATE public.barbershops
SET slug = NULL
WHERE slug IS NOT NULL
  AND slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$';

ALTER TABLE public.barbershops
  DROP CONSTRAINT IF EXISTS barbershops_slug_check;

ALTER TABLE public.barbershops
  ADD CONSTRAINT barbershops_slug_check
  CHECK (
    slug IS NULL OR (
      length(slug) BETWEEN 3 AND 50
      AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    )
  );

COMMIT;
