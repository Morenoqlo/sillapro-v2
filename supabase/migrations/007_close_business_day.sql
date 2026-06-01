-- Migration 007 · Cierre de día de caja
-- Calcula los totales del día a partir de payments y appointments,
-- los almacena en cash_closeouts (inmutable) y devuelve el closeout_id.
-- La UNIQUE constraint en (barbershop_id, business_date) garantiza idempotencia.

BEGIN;

CREATE OR REPLACE FUNCTION public.close_business_day(
  p_business_date DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop_id UUID;
  v_gross NUMERIC := 0;
  v_tips  NUMERIC := 0;
  v_commission NUMERIC := 0;
  v_completed_count BIGINT := 0;
  v_no_show_count BIGINT := 0;
  v_cancelled_count BIGINT := 0;
  v_closeout_id UUID;
  v_day_start TIMESTAMPTZ;
  v_day_end   TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  -- Verify caller is admin/owner of a barbershop
  SELECT barbershop_id INTO v_shop_id
  FROM public.memberships
  WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'staff')
    AND active = TRUE
  LIMIT 1;

  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No admin membership found' USING ERRCODE = '42501';
  END IF;

  -- Day window in America/Santiago
  v_day_start := (p_business_date::text || 'T00:00:00-04:00')::TIMESTAMPTZ;
  v_day_end   := (p_business_date::text || 'T24:00:00-04:00')::TIMESTAMPTZ;

  -- Aggregate payments for the day
  SELECT
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(tip_amount), 0)
  INTO v_gross, v_tips
  FROM public.payments
  WHERE barbershop_id = v_shop_id
    AND paid_at >= v_day_start
    AND paid_at <  v_day_end;

  -- Commission = sum of (price_amount * commission_percent / 100) for completed appointments
  SELECT COALESCE(SUM(price_amount * commission_percent / 100), 0)
  INTO v_commission
  FROM public.appointments
  WHERE barbershop_id = v_shop_id
    AND status = 'completed'
    AND starts_at >= v_day_start
    AND starts_at <  v_day_end;

  -- Appointment counts
  SELECT
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'no_show'),
    COUNT(*) FILTER (WHERE status = 'cancelled')
  INTO v_completed_count, v_no_show_count, v_cancelled_count
  FROM public.appointments
  WHERE barbershop_id = v_shop_id
    AND starts_at >= v_day_start
    AND starts_at <  v_day_end;

  -- Insert closeout (UNIQUE on barbershop_id + business_date prevents double-close)
  INSERT INTO public.cash_closeouts (
    barbershop_id,
    business_date,
    gross_amount,
    commission_amount,
    net_amount,
    completed_count,
    no_show_count,
    cancelled_count,
    closed_by
  )
  VALUES (
    v_shop_id,
    p_business_date,
    v_gross + v_tips,
    v_commission,
    (v_gross + v_tips) - v_commission,
    v_completed_count,
    v_no_show_count,
    v_cancelled_count,
    auth.uid()
  )
  ON CONFLICT (barbershop_id, business_date)
  DO NOTHING
  RETURNING id INTO v_closeout_id;

  IF v_closeout_id IS NULL THEN
    -- Already closed — return existing id
    SELECT id INTO v_closeout_id
    FROM public.cash_closeouts
    WHERE barbershop_id = v_shop_id AND business_date = p_business_date;
  END IF;

  RETURN v_closeout_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.close_business_day(DATE) TO authenticated;

COMMIT;
