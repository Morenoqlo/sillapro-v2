-- Migration 008 · Políticas públicas para la página de reserva
-- Permite a usuarios NO autenticados (anon) leer datos del local,
-- servicios y barberos necesarios para la página de reserva pública.

BEGIN;

-- Public SELECT on barbershops (only those with a slug configured)
CREATE POLICY barbershops_public_select ON public.barbershops
  FOR SELECT TO anon
  USING (slug IS NOT NULL);

-- Public SELECT on services (active only)
CREATE POLICY services_public_select ON public.services
  FOR SELECT TO anon
  USING (active = TRUE);

-- Public SELECT on barbers (active only)
CREATE POLICY barbers_public_select ON public.barbers
  FOR SELECT TO anon
  USING (active = TRUE);

-- Public SELECT on appointments (only active statuses — used to compute free slots)
CREATE POLICY appointments_public_select ON public.appointments
  FOR SELECT TO anon
  USING (status IN ('pending', 'confirmed', 'in_chair'));

-- RPC: book_appointment_public
-- Creates a client (or reuses existing by phone) and an appointment.
-- SECURITY DEFINER to bypass RLS (anon cannot INSERT into appointments).
CREATE OR REPLACE FUNCTION public.book_appointment_public(
  p_barbershop_id UUID,
  p_barber_id     UUID,
  p_service_id    UUID,
  p_starts_at     TIMESTAMPTZ,
  p_ends_at       TIMESTAMPTZ,
  p_client_name   TEXT,
  p_client_phone  TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service_price      NUMERIC;
  v_service_commission NUMERIC;
  v_client_id          UUID;
  v_appointment_id     UUID;
BEGIN
  -- Validate service belongs to barbershop and is active
  SELECT price_amount, commission_percent
    INTO v_service_price, v_service_commission
  FROM public.services
  WHERE id = p_service_id AND barbershop_id = p_barbershop_id AND active = TRUE;

  IF v_service_price IS NULL THEN
    RAISE EXCEPTION 'Service not found or inactive' USING ERRCODE = '22023';
  END IF;

  -- Reuse client by phone, or create new
  IF p_client_phone <> '' THEN
    SELECT id INTO v_client_id
    FROM public.clients
    WHERE barbershop_id = p_barbershop_id AND phone = p_client_phone
    LIMIT 1;
  END IF;

  IF v_client_id IS NULL THEN
    INSERT INTO public.clients (barbershop_id, full_name, phone)
    VALUES (p_barbershop_id, p_client_name, p_client_phone)
    RETURNING id INTO v_client_id;
  ELSE
    -- Update name in case it changed
    UPDATE public.clients SET full_name = p_client_name WHERE id = v_client_id;
  END IF;

  -- Insert appointment (GIST exclusion constraint prevents double-booking)
  INSERT INTO public.appointments (
    barbershop_id, barber_id, client_id, service_id,
    starts_at, ends_at,
    price_amount, commission_percent
  )
  VALUES (
    p_barbershop_id, p_barber_id, v_client_id, p_service_id,
    p_starts_at, p_ends_at,
    v_service_price, v_service_commission
  )
  RETURNING id INTO v_appointment_id;

  RETURN v_appointment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.book_appointment_public(
  UUID, UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT
) TO anon;

COMMIT;
