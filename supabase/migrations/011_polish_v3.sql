-- Migration 011 · Polish V3
-- Cambios:
--   1. clients.email — para clientes que opten por guardar datos
--   2. barbers.experience_level — etiqueta de nivel libre ("Senior", "Junior", etc)
--   3. barber_services.price_amount + commission_percent (nullable) — overrides por barbero
--   4. closed_days — tabla de días en que el local cierra
--   5. book_appointment_public actualizada: acepta email opcional, respeta precio por barbero, bloquea closed_days
--   6. Defaults de barbershops actualizados para nuevas cuentas: slot 45, open 10:00, close 18:00

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. clients.email
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS clients_email_idx
  ON public.clients (barbershop_id, lower(email))
  WHERE email <> '';

-- ─────────────────────────────────────────────────────────────
-- 2. barbers.experience_level
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.barbers
  ADD COLUMN IF NOT EXISTS experience_level TEXT NOT NULL DEFAULT '';

-- ─────────────────────────────────────────────────────────────
-- 3. barber_services overrides
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.barber_services
  ADD COLUMN IF NOT EXISTS price_amount NUMERIC(12,2)
    CHECK (price_amount IS NULL OR price_amount >= 0),
  ADD COLUMN IF NOT EXISTS commission_percent NUMERIC(5,2)
    CHECK (commission_percent IS NULL OR (commission_percent >= 0 AND commission_percent <= 100));

-- ─────────────────────────────────────────────────────────────
-- 4. closed_days
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.closed_days (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id   UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  closed_date     DATE NOT NULL,
  reason          TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (barbershop_id, closed_date)
);

CREATE INDEX IF NOT EXISTS closed_days_shop_date_idx
  ON public.closed_days (barbershop_id, closed_date);

ALTER TABLE public.closed_days ENABLE ROW LEVEL SECURITY;

-- Members can read their shop's closed days
CREATE POLICY closed_days_member_select ON public.closed_days
  FOR SELECT USING (public.user_has_barbershop_role(barbershop_id));

-- Admin/owner can write
CREATE POLICY closed_days_admin_write ON public.closed_days
  FOR ALL USING (public.user_has_barbershop_role(barbershop_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.user_has_barbershop_role(barbershop_id, ARRAY['owner', 'admin']));

-- Anon SELECT for public reservation flow (only future-ish dates)
CREATE POLICY closed_days_public_select ON public.closed_days
  FOR SELECT TO anon
  USING (closed_date >= (now() AT TIME ZONE 'America/Santiago')::date - interval '1 day');

GRANT SELECT ON public.closed_days TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.closed_days TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 5. book_appointment_public actualizada
--    - p_client_email opcional
--    - p_save_as_client opcional (si false, no upsert en clients persistente con email)
--    - usa precio del barber_services override si existe
--    - falla si el día está cerrado
-- ─────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.book_appointment_public(
  UUID, UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT
);

CREATE OR REPLACE FUNCTION public.book_appointment_public(
  p_barbershop_id   UUID,
  p_barber_id       UUID,
  p_service_id      UUID,
  p_starts_at       TIMESTAMPTZ,
  p_ends_at         TIMESTAMPTZ,
  p_client_name     TEXT,
  p_client_phone    TEXT,
  p_client_email    TEXT DEFAULT '',
  p_save_as_client  BOOLEAN DEFAULT TRUE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tz                 TEXT;
  v_business_date      DATE;
  v_is_closed          BOOLEAN;
  v_service_price      NUMERIC;
  v_service_commission NUMERIC;
  v_override_price     NUMERIC;
  v_override_comm      NUMERIC;
  v_final_price        NUMERIC;
  v_final_comm         NUMERIC;
  v_client_id          UUID;
  v_appointment_id     UUID;
BEGIN
  -- Get shop timezone for closed_days check
  SELECT timezone INTO v_tz FROM public.barbershops WHERE id = p_barbershop_id;
  IF v_tz IS NULL THEN
    RAISE EXCEPTION 'Barbershop not found' USING ERRCODE = '22023';
  END IF;

  v_business_date := (p_starts_at AT TIME ZONE v_tz)::date;

  -- Block if the day is marked closed
  SELECT EXISTS (
    SELECT 1 FROM public.closed_days
    WHERE barbershop_id = p_barbershop_id AND closed_date = v_business_date
  ) INTO v_is_closed;

  IF v_is_closed THEN
    RAISE EXCEPTION 'Shop is closed on %', v_business_date USING ERRCODE = '22023';
  END IF;

  -- Service base price + commission
  SELECT price_amount, commission_percent
    INTO v_service_price, v_service_commission
  FROM public.services
  WHERE id = p_service_id AND barbershop_id = p_barbershop_id AND active = TRUE;

  IF v_service_price IS NULL THEN
    RAISE EXCEPTION 'Service not found or inactive' USING ERRCODE = '22023';
  END IF;

  -- Override: per-barber price for this service
  SELECT price_amount, commission_percent
    INTO v_override_price, v_override_comm
  FROM public.barber_services
  WHERE barber_id = p_barber_id AND service_id = p_service_id;

  v_final_price := COALESCE(v_override_price, v_service_price);
  v_final_comm  := COALESCE(v_override_comm,  v_service_commission);

  -- Client handling
  IF p_save_as_client AND p_client_phone <> '' THEN
    SELECT id INTO v_client_id
    FROM public.clients
    WHERE barbershop_id = p_barbershop_id AND phone = p_client_phone
    LIMIT 1;

    IF v_client_id IS NULL THEN
      INSERT INTO public.clients (barbershop_id, full_name, phone, email)
      VALUES (p_barbershop_id, p_client_name, p_client_phone, COALESCE(p_client_email, ''))
      RETURNING id INTO v_client_id;
    ELSE
      UPDATE public.clients
      SET full_name = p_client_name,
          email = CASE
            WHEN COALESCE(p_client_email, '') <> '' THEN p_client_email
            ELSE email
          END
      WHERE id = v_client_id;
    END IF;
  ELSE
    -- Not saving — create a one-off client record (still needs FK)
    INSERT INTO public.clients (barbershop_id, full_name, phone, email)
    VALUES (p_barbershop_id, p_client_name, COALESCE(p_client_phone, ''), '')
    RETURNING id INTO v_client_id;
  END IF;

  -- Insert appointment
  INSERT INTO public.appointments (
    barbershop_id, barber_id, client_id, service_id,
    starts_at, ends_at,
    price_amount, commission_percent
  )
  VALUES (
    p_barbershop_id, p_barber_id, v_client_id, p_service_id,
    p_starts_at, p_ends_at,
    v_final_price, v_final_comm
  )
  RETURNING id INTO v_appointment_id;

  RETURN v_appointment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.book_appointment_public(
  UUID, UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT, BOOLEAN
) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 6. Defaults para nuevas barbershops
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.barbershops
  ALTER COLUMN open_time SET DEFAULT '10:00',
  ALTER COLUMN close_time SET DEFAULT '18:00',
  ALTER COLUMN slot_minutes SET DEFAULT 45;

-- create_initial_barbershop usa los defaults solo si el caller no manda valores.
-- El frontend ya manda los valores explícitos, así que esto no afecta accounts existentes.

COMMIT;
