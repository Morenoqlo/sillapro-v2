-- Migration 015 · Validación servidor + rate limit en book_appointment_public.
--
-- Problemas atacados:
--   A6: la RPC no validaba tamaño/contenido de inputs (nombre, email, teléfono).
--   C2: sin rate limit, un script trivial podía llenar la BD con spam.
--
-- Solución:
--   - Limites de longitud en cada input
--   - Regex de email (si se provee) y phone
--   - Rate limit por (phone, shop): max 3 citas / 1h
--   - Rate limit por shop: max 30 citas anon / 1h
--
-- NOTA: el rate limit ideal es por IP (no by phone), pero PostgreSQL no recibe
-- la IP del cliente de PostgREST salvo configuración extra. Phone-based filtra
-- spam básico; para protección DDoS real se requiere Edge Function o WAF.

BEGIN;

-- Reemplazar la RPC con la versión hardenada
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
  v_phone_count        BIGINT;
  v_shop_count         BIGINT;
  v_name               TEXT;
  v_phone              TEXT;
  v_email              TEXT;
BEGIN
  -- ─── 1. INPUT VALIDATION ───────────────────────────────────────────────
  v_name  := COALESCE(trim(p_client_name), '');
  v_phone := COALESCE(trim(p_client_phone), '');
  v_email := COALESCE(trim(p_client_email), '');

  IF length(v_name) = 0 OR length(v_name) > 80 THEN
    RAISE EXCEPTION 'Nombre inválido (1-80 caracteres)' USING ERRCODE = '22023';
  END IF;
  IF length(v_phone) = 0 OR length(v_phone) > 30 THEN
    RAISE EXCEPTION 'Teléfono inválido (1-30 caracteres)' USING ERRCODE = '22023';
  END IF;
  -- Phone: dígitos, espacios, +, -, (, )
  IF v_phone !~ '^[0-9+\-\s()]+$' THEN
    RAISE EXCEPTION 'Formato de teléfono inválido' USING ERRCODE = '22023';
  END IF;
  IF length(v_email) > 0 THEN
    IF length(v_email) > 100 THEN
      RAISE EXCEPTION 'Email demasiado largo' USING ERRCODE = '22023';
    END IF;
    IF v_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Formato de email inválido' USING ERRCODE = '22023';
    END IF;
  END IF;

  -- ─── 2. RATE LIMITS ────────────────────────────────────────────────────
  -- Por (phone, shop): max 3 en 1 hora
  SELECT COUNT(*) INTO v_phone_count
  FROM public.appointments a
  JOIN public.clients c ON c.id = a.client_id
  WHERE a.barbershop_id = p_barbershop_id
    AND c.phone = v_phone
    AND a.created_at > now() - interval '1 hour';

  IF v_phone_count >= 3 THEN
    RAISE EXCEPTION 'Demasiadas reservas recientes desde este teléfono. Espera 1 hora.'
      USING ERRCODE = '54000';
  END IF;

  -- Por shop (anti-spam masivo): max 30 reservas/hora a este shop
  -- (asume que ningún local atiende 30 clientes/hora)
  SELECT COUNT(*) INTO v_shop_count
  FROM public.appointments
  WHERE barbershop_id = p_barbershop_id
    AND created_at > now() - interval '1 hour';

  IF v_shop_count >= 30 THEN
    RAISE EXCEPTION 'El local recibió demasiadas reservas. Intenta más tarde.'
      USING ERRCODE = '54000';
  END IF;

  -- ─── 3. SHOP TZ + CLOSED DAY CHECK ─────────────────────────────────────
  SELECT timezone INTO v_tz FROM public.barbershops WHERE id = p_barbershop_id;
  IF v_tz IS NULL THEN
    RAISE EXCEPTION 'Barbershop not found' USING ERRCODE = '22023';
  END IF;

  v_business_date := (p_starts_at AT TIME ZONE v_tz)::date;

  SELECT EXISTS (
    SELECT 1 FROM public.closed_days
    WHERE barbershop_id = p_barbershop_id AND closed_date = v_business_date
  ) INTO v_is_closed;

  IF v_is_closed THEN
    RAISE EXCEPTION 'Shop is closed on %', v_business_date USING ERRCODE = '22023';
  END IF;

  -- ─── 4. SERVICE PRICE + BARBER OVERRIDE ────────────────────────────────
  SELECT price_amount, commission_percent
    INTO v_service_price, v_service_commission
  FROM public.services
  WHERE id = p_service_id AND barbershop_id = p_barbershop_id AND active = TRUE;

  IF v_service_price IS NULL THEN
    RAISE EXCEPTION 'Service not found or inactive' USING ERRCODE = '22023';
  END IF;

  SELECT price_amount, commission_percent
    INTO v_override_price, v_override_comm
  FROM public.barber_services
  WHERE barber_id = p_barber_id AND service_id = p_service_id;

  v_final_price := COALESCE(v_override_price, v_service_price);
  v_final_comm  := COALESCE(v_override_comm,  v_service_commission);

  -- ─── 5. CLIENT HANDLING ────────────────────────────────────────────────
  IF p_save_as_client THEN
    SELECT id INTO v_client_id
    FROM public.clients
    WHERE barbershop_id = p_barbershop_id AND phone = v_phone
    LIMIT 1;

    IF v_client_id IS NULL THEN
      INSERT INTO public.clients (barbershop_id, full_name, phone, email)
      VALUES (p_barbershop_id, v_name, v_phone, v_email)
      RETURNING id INTO v_client_id;
    ELSE
      UPDATE public.clients
      SET full_name = v_name,
          email = CASE
            WHEN v_email <> '' THEN v_email
            ELSE email
          END
      WHERE id = v_client_id;
    END IF;
  ELSE
    -- One-off client (still needed for FK)
    INSERT INTO public.clients (barbershop_id, full_name, phone, email)
    VALUES (p_barbershop_id, v_name, v_phone, '')
    RETURNING id INTO v_client_id;
  END IF;

  -- ─── 6. INSERT APPOINTMENT ─────────────────────────────────────────────
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

COMMIT;
