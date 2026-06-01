-- Migration 006 · Cobrar y completar atómicamente
-- Inserta el payment + marca la cita completed en una transacción.
-- SECURITY DEFINER + verificación explícita de pertenencia evita que un
-- barber role complete citas que no le corresponden.

BEGIN;

CREATE OR REPLACE FUNCTION public.complete_and_charge(
  p_appointment_id UUID,
  p_method TEXT,
  p_tip_amount NUMERIC DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop_id UUID;
  v_status TEXT;
  v_price NUMERIC;
  v_payment_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF p_method NOT IN ('cash', 'card', 'transfer', 'other') THEN
    RAISE EXCEPTION 'Invalid payment method: %', p_method USING ERRCODE = '22023';
  END IF;

  IF p_tip_amount < 0 THEN
    RAISE EXCEPTION 'Tip must be >= 0' USING ERRCODE = '22023';
  END IF;

  -- Lock the appointment row and verify caller belongs to an admin-capable
  -- membership of its barbershop.
  SELECT barbershop_id, status, price_amount
    INTO v_shop_id, v_status, v_price
  FROM public.appointments
  WHERE id = p_appointment_id
  FOR UPDATE;

  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'Appointment not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_shop_id NOT IN (SELECT public.user_admin_barbershops()) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  IF v_status IN ('completed', 'cancelled', 'no_show') THEN
    RAISE EXCEPTION 'Appointment already in terminal state: %', v_status
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.payments (
    appointment_id, barbershop_id, method, amount, tip_amount, created_by
  )
  VALUES (
    p_appointment_id, v_shop_id, p_method, v_price, p_tip_amount, auth.uid()
  )
  RETURNING id INTO v_payment_id;

  UPDATE public.appointments
  SET status = 'completed', updated_at = now()
  WHERE id = p_appointment_id;

  RETURN v_payment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_and_charge(UUID, TEXT, NUMERIC) TO authenticated;

COMMIT;
