-- Migration 010 · Sistema de invitación de barberos

BEGIN;

CREATE TABLE public.barber_invites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  barber_id     UUID NOT NULL,
  token         UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  used_at       TIMESTAMPTZ,
  used_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (barber_id, barbershop_id) REFERENCES public.barbers(id, barbershop_id) ON DELETE CASCADE
);

CREATE INDEX barber_invites_token_idx ON public.barber_invites (token);
CREATE INDEX barber_invites_shop_idx  ON public.barber_invites (barbershop_id);

ALTER TABLE public.barber_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY barber_invites_admin ON public.barber_invites
  FOR ALL USING (barbershop_id IN (SELECT public.user_admin_barbershops()))
  WITH CHECK (barbershop_id IN (SELECT public.user_admin_barbershops()));

CREATE POLICY barber_invites_token_read ON public.barber_invites
  FOR SELECT TO anon, authenticated
  USING (used_at IS NULL AND expires_at > now());

CREATE OR REPLACE FUNCTION public.create_barber_invite(p_barber_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop_id UUID;
  v_token   UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT barbershop_id INTO v_shop_id
  FROM public.memberships
  WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'staff')
    AND active = TRUE
    AND barbershop_id IN (
      SELECT barbershop_id FROM public.barbers WHERE id = p_barber_id
    )
  LIMIT 1;

  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'Access denied or barber not found' USING ERRCODE = '42501';
  END IF;

  UPDATE public.barber_invites
  SET used_at = now(), used_by = auth.uid()
  WHERE barber_id = p_barber_id
    AND barbershop_id = v_shop_id
    AND used_at IS NULL;

  INSERT INTO public.barber_invites (barbershop_id, barber_id, created_by)
  VALUES (v_shop_id, p_barber_id, auth.uid())
  RETURNING token INTO v_token;

  RETURN v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_barber_invite(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_barber_invite(p_token UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_invite
  FROM public.barber_invites
  WHERE token = p_token
    AND used_at IS NULL
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found, already used, or expired' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid() AND barbershop_id = v_invite.barbershop_id AND active = TRUE
  ) THEN
    RAISE EXCEPTION 'User already has access to this barbershop' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.memberships (barbershop_id, user_id, barber_id, role)
  VALUES (v_invite.barbershop_id, auth.uid(), v_invite.barber_id, 'barber');

  INSERT INTO public.profiles (id) VALUES (auth.uid()) ON CONFLICT DO NOTHING;

  UPDATE public.barber_invites
  SET used_at = now(), used_by = auth.uid()
  WHERE id = v_invite.id;

  RETURN 'ok';
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_barber_invite(UUID) TO authenticated;

COMMIT;
GRANT SELECT ON public.barber_invites TO anon, authenticated;
