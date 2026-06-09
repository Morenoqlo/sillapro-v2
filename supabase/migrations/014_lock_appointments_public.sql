-- Migration 014 · Hardening: cerrar lectura pública sin scope de appointments.
--
-- Problema (C1 del audit): la policy appointments_public_select permitía a
-- anon leer appointments de TODOS los barbershops solo filtrando por status.
-- Sin filtro por barbershop_id → cualquier visitante podía scrapear las
-- agendas de cualquier barbería.
--
-- Solución:
--   1. Reemplazar la policy abierta por una RPC SECURITY DEFINER
--      `get_public_busy_slots(shop_id, barber_id, range_start, range_end)`
--      que valida que el shop tiene slug público y devuelve solo
--      starts_at/ends_at (sin price/comisión/cliente/etc).
--   2. Dropear la policy abierta.

BEGIN;

-- Drop la policy peligrosa
DROP POLICY IF EXISTS appointments_public_select ON public.appointments;

-- RPC que devuelve solo los huecos ocupados (ningún dato adicional)
-- Solo funciona para shops con slug configurado (visibles públicamente).
CREATE OR REPLACE FUNCTION public.get_public_busy_slots(
  p_barbershop_id  UUID,
  p_barber_id      UUID,
  p_range_start    TIMESTAMPTZ,
  p_range_end      TIMESTAMPTZ
)
RETURNS TABLE (starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Validar que el shop existe y tiene slug (es público)
  IF NOT EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE id = p_barbershop_id AND slug IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Barbershop not found or not public' USING ERRCODE = 'P0002';
  END IF;

  -- Validar que el barber pertenece al shop y está activo
  IF NOT EXISTS (
    SELECT 1 FROM public.barbers
    WHERE id = p_barber_id AND barbershop_id = p_barbershop_id AND active = TRUE
  ) THEN
    RAISE EXCEPTION 'Barber not found or inactive' USING ERRCODE = 'P0002';
  END IF;

  -- Acotar la ventana de consulta para evitar abuso (max 14 días)
  IF p_range_end - p_range_start > interval '14 days' THEN
    RAISE EXCEPTION 'Range too wide (max 14 days)' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT a.starts_at, a.ends_at
  FROM public.appointments a
  WHERE a.barbershop_id = p_barbershop_id
    AND a.barber_id = p_barber_id
    AND a.status IN ('pending', 'confirmed', 'in_chair')
    AND a.starts_at >= p_range_start
    AND a.starts_at <  p_range_end;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_busy_slots(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ)
  TO anon, authenticated;

COMMIT;
