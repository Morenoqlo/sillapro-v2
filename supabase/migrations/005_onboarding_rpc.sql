-- Migration 005 · Onboarding atómico
-- Resuelve el chicken-and-egg de RLS: un usuario nuevo no tiene memberships,
-- por lo tanto user_admin_barbershops() devuelve vacío, por lo tanto no puede
-- insertar en barbershops/memberships/etc bajo RLS.
-- Esta función corre con privilegios elevados (SECURITY DEFINER) y crea todo
-- en una transacción. Verifica que el caller no tenga memberships previas
-- (un usuario solo puede usar onboarding 1 vez).

BEGIN;

CREATE OR REPLACE FUNCTION public.create_initial_barbershop(
  shop_name TEXT,
  shop_timezone TEXT DEFAULT 'America/Santiago',
  shop_open_time TIME DEFAULT '09:00',
  shop_close_time TIME DEFAULT '20:00',
  shop_slot_minutes BIGINT DEFAULT 30,
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
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  -- Prevenir abuso: un usuario solo crea un barbershop via onboarding
  SELECT COUNT(*) INTO existing_count
  FROM public.memberships
  WHERE user_id = caller_id AND active = TRUE;

  IF existing_count > 0 THEN
    RAISE EXCEPTION 'User already has a barbershop' USING ERRCODE = '42501';
  END IF;

  -- Crear barbershop
  INSERT INTO public.barbershops (
    name, timezone, open_time, close_time, slot_minutes
  )
  VALUES (
    shop_name, shop_timezone, shop_open_time, shop_close_time, shop_slot_minutes
  )
  RETURNING id INTO new_shop_id;

  -- Crear primer barbero
  INSERT INTO public.barbers (barbershop_id, full_name, commission_default)
  VALUES (new_shop_id, barber_full_name, barber_commission_default)
  RETURNING id INTO new_barber_id;

  -- Crear membership owner para el caller, ligado al barbero recién creado
  INSERT INTO public.memberships (barbershop_id, user_id, barber_id, role)
  VALUES (new_shop_id, caller_id, new_barber_id, 'owner');

  -- Crear primer servicio
  INSERT INTO public.services (
    barbershop_id, name, duration_minutes, price_amount, commission_percent
  )
  VALUES (
    new_shop_id, service_name, service_duration_minutes,
    service_price_amount, service_commission_percent
  );

  -- Crear profile si no existe
  INSERT INTO public.profiles (id)
  VALUES (caller_id)
  ON CONFLICT (id) DO NOTHING;

  RETURN new_shop_id;
END;
$$;

-- Permitir que cualquier usuario autenticado llame esta función
GRANT EXECUTE ON FUNCTION public.create_initial_barbershop(
  TEXT, TEXT, TIME, TIME, BIGINT, TEXT, NUMERIC, TEXT, BIGINT, NUMERIC, NUMERIC
) TO authenticated;

COMMIT;
