-- Migration 012 · RPC para que un barbero vea sus propias propinas del mes.
-- payments tiene RLS sólo para admin; sin esto un role 'barber' no puede ver tip_amount.

BEGIN;

CREATE OR REPLACE FUNCTION public.barber_tips_in_range(
  p_barber_id   UUID,
  p_range_start TIMESTAMPTZ,
  p_range_end   TIMESTAMPTZ
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop_id UUID;
  v_total   NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  -- Determine the barbershop of this barber
  SELECT barbershop_id INTO v_shop_id FROM public.barbers WHERE id = p_barber_id;
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'Barber not found' USING ERRCODE = '22023';
  END IF;

  -- Caller must be: owner/admin of the shop, OR the barber themselves
  IF NOT public.user_has_barbershop_role(v_shop_id, ARRAY['owner', 'admin'])
     AND public.user_barber_id(v_shop_id) IS DISTINCT FROM p_barber_id THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(SUM(pay.tip_amount), 0)
    INTO v_total
  FROM public.payments pay
  JOIN public.appointments a ON a.id = pay.appointment_id
  WHERE a.barber_id = p_barber_id
    AND pay.paid_at >= p_range_start
    AND pay.paid_at < p_range_end;

  RETURN v_total;
END;
$$;

GRANT EXECUTE ON FUNCTION public.barber_tips_in_range(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

COMMIT;
