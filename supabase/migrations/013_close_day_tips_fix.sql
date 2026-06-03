-- Migration 013 · Fix: cierre de caja inflaba el neto del dueño con propinas.
-- Antes: gross = v_gross + v_tips → net = (v_gross + v_tips) - v_commission
--   Esto reportaba propinas como ingreso del local — son del barbero, no del dueño.
-- Después: gross = v_gross solamente; tips se guardan en nueva columna tips_amount
-- y net = v_gross - v_commission.

BEGIN;

-- Add tips_amount column to preserve historical context per day
ALTER TABLE public.cash_closeouts
  ADD COLUMN IF NOT EXISTS tips_amount NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (tips_amount >= 0);

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

  SELECT barbershop_id INTO v_shop_id
  FROM public.memberships
  WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'staff')
    AND active = TRUE
  LIMIT 1;

  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No admin membership found' USING ERRCODE = '42501';
  END IF;

  v_day_start := (p_business_date::text || 'T00:00:00-04:00')::TIMESTAMPTZ;
  v_day_end   := (p_business_date::text || 'T24:00:00-04:00')::TIMESTAMPTZ;

  SELECT
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(tip_amount), 0)
  INTO v_gross, v_tips
  FROM public.payments
  WHERE barbershop_id = v_shop_id
    AND paid_at >= v_day_start
    AND paid_at <  v_day_end;

  SELECT COALESCE(SUM(price_amount * commission_percent / 100), 0)
  INTO v_commission
  FROM public.appointments
  WHERE barbershop_id = v_shop_id
    AND status = 'completed'
    AND starts_at >= v_day_start
    AND starts_at <  v_day_end;

  SELECT
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'no_show'),
    COUNT(*) FILTER (WHERE status = 'cancelled')
  INTO v_completed_count, v_no_show_count, v_cancelled_count
  FROM public.appointments
  WHERE barbershop_id = v_shop_id
    AND starts_at >= v_day_start
    AND starts_at <  v_day_end;

  INSERT INTO public.cash_closeouts (
    barbershop_id,
    business_date,
    gross_amount,
    commission_amount,
    net_amount,
    tips_amount,
    completed_count,
    no_show_count,
    cancelled_count,
    closed_by
  )
  VALUES (
    v_shop_id,
    p_business_date,
    v_gross,                   -- ingreso del local (sin propinas)
    v_commission,              -- comisión que va al barbero
    v_gross - v_commission,    -- neto del dueño
    v_tips,                    -- propinas, registradas pero pass-through
    v_completed_count,
    v_no_show_count,
    v_cancelled_count,
    auth.uid()
  )
  ON CONFLICT (barbershop_id, business_date)
  DO NOTHING
  RETURNING id INTO v_closeout_id;

  IF v_closeout_id IS NULL THEN
    SELECT id INTO v_closeout_id
    FROM public.cash_closeouts
    WHERE barbershop_id = v_shop_id AND business_date = p_business_date;
  END IF;

  RETURN v_closeout_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.close_business_day(DATE) TO authenticated;

COMMIT;
