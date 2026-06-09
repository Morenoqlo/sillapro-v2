-- Migration 018 · Validación servidor en create_initial_barbershop.
--
-- Problema (A2/A7): la RPC aceptaba strings arbitrarios sin longitud
-- máxima. Un atacante autenticado podía pasar 1GB en shop_name, llenar
-- disco y crashear la BD.
--
-- También: defaults de la RPC (09:00-20:00, 30 min) no coincidían con
-- defaults nuevos del schema (10:00-18:00, 45 min) introducidos en 011.
--
-- Solución:
--   - Longitudes máximas en cada TEXT input
--   - Validar timezone contra pg_timezone_names (catálogo de Postgres)
--   - Validar commission y slot_minutes contra valores permitidos
--   - Alinear defaults con el schema actual

BEGIN;

CREATE OR REPLACE FUNCTION public.create_initial_barbershop(
  shop_name TEXT,
  shop_timezone TEXT DEFAULT 'America/Santiago',
  shop_open_time TIME DEFAULT '10:00',
  shop_close_time TIME DEFAULT '18:00',
  shop_slot_minutes BIGINT DEFAULT 45,
  barber_full_name TEXT DEFAULT 'Yo',
  barber_commission_default NUMERIC DEFAULT 40,
  service_name TEXT DEFAULT 'Corte clásico',
  service_duration_minutes BIGINT DEFAULT 30,
  service_price_amount NUMERIC DEFAULT 12000,
  service_commission_percent NUMERIC DEFAULT 40
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID := auth.uid();
  new_shop_id UUID;
  new_barber_id UUID;
  existing_count INTEGER;
  v_shop_name TEXT := COALESCE(trim(shop_name), '');
  v_barber TEXT := COALESCE(trim(barber_full_name), '');
  v_service TEXT := COALESCE(trim(service_name), '');
BEGIN
  -- Auth check
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  -- ─── INPUT VALIDATION ─────────────────────────────────────────────────
  IF length(v_shop_name) = 0 OR length(v_shop_name) > 80 THEN
    RAISE EXCEPTION 'Nombre del local inválido (1-80 caracteres)' USING ERRCODE = '22023';
  END IF;
  IF length(v_barber) = 0 OR length(v_barber) > 80 THEN
    RAISE EXCEPTION 'Nombre del barbero inválido (1-80 caracteres)' USING ERRCODE = '22023';
  END IF;
  IF length(v_service) = 0 OR length(v_service) > 80 THEN
    RAISE EXCEPTION 'Nombre del servicio inválido (1-80 caracteres)' USING ERRCODE = '22023';
  END IF;

  -- Timezone must exist in pg_timezone_names catalog
  IF NOT EXISTS (
    SELECT 1 FROM pg_timezone_names WHERE name = shop_timezone
  ) THEN
    RAISE EXCEPTION 'Timezone inválida: %', shop_timezone USING ERRCODE = '22023';
  END IF;

  -- open < close (CHECK already exists at column-level but better error here)
  IF shop_open_time >= shop_close_time THEN
    RAISE EXCEPTION 'La hora de cierre debe ser posterior a la de apertura'
      USING ERRCODE = '22023';
  END IF;

  -- slot_minutes whitelisted (matches CHECK on barbershops table)
  IF shop_slot_minutes NOT IN (10, 15, 20, 30, 45, 60) THEN
    RAISE EXCEPTION 'Slot minutes inválido (10, 15, 20, 30, 45, 60)'
      USING ERRCODE = '22023';
  END IF;

  -- Commission ranges
  IF barber_commission_default < 0 OR barber_commission_default > 100 THEN
    RAISE EXCEPTION 'Comisión del barbero fuera de rango (0-100)'
      USING ERRCODE = '22023';
  END IF;
  IF service_commission_percent < 0 OR service_commission_percent > 100 THEN
    RAISE EXCEPTION 'Comisión del servicio fuera de rango (0-100)'
      USING ERRCODE = '22023';
  END IF;

  -- Duration sanity
  IF service_duration_minutes < 10 OR service_duration_minutes > 240 THEN
    RAISE EXCEPTION 'Duración del servicio fuera de rango (10-240 min)'
      USING ERRCODE = '22023';
  END IF;

  -- Price sanity
  IF service_price_amount < 0 OR service_price_amount > 99999999 THEN
    RAISE EXCEPTION 'Precio del servicio fuera de rango'
      USING ERRCODE = '22023';
  END IF;

  -- ─── PREVENT ABUSE: 1 barbershop per user ─────────────────────────────
  SELECT COUNT(*) INTO existing_count
  FROM public.memberships
  WHERE user_id = caller_id AND active = TRUE;

  IF existing_count > 0 THEN
    RAISE EXCEPTION 'User already has a barbershop' USING ERRCODE = '42501';
  END IF;

  -- ─── CREATE BARBERSHOP ────────────────────────────────────────────────
  INSERT INTO public.barbershops (
    name, timezone, open_time, close_time, slot_minutes
  )
  VALUES (
    v_shop_name, shop_timezone, shop_open_time, shop_close_time, shop_slot_minutes
  )
  RETURNING id INTO new_shop_id;

  INSERT INTO public.barbers (barbershop_id, full_name, commission_default)
  VALUES (new_shop_id, v_barber, barber_commission_default)
  RETURNING id INTO new_barber_id;

  INSERT INTO public.memberships (barbershop_id, user_id, barber_id, role)
  VALUES (new_shop_id, caller_id, new_barber_id, 'owner');

  INSERT INTO public.services (
    barbershop_id, name, duration_minutes, price_amount, commission_percent
  )
  VALUES (
    new_shop_id, v_service, service_duration_minutes,
    service_price_amount, service_commission_percent
  );

  INSERT INTO public.profiles (id)
  VALUES (caller_id)
  ON CONFLICT (id) DO NOTHING;

  RETURN new_shop_id;
END;
$$;

-- Grant ya existía pero re-aplicamos por seguridad
GRANT EXECUTE ON FUNCTION public.create_initial_barbershop(
  TEXT, TEXT, TIME, TIME, BIGINT, TEXT, NUMERIC, TEXT, BIGINT, NUMERIC, NUMERIC
) TO authenticated;

COMMIT;
