-- Migration 017 · Cerrar fuga de tokens de invitación.
--
-- Problema (A10): la policy barber_invites_token_read permitía a anon hacer
-- `SELECT token FROM barber_invites WHERE used_at IS NULL`, listando todos
-- los tokens vigentes. Un script puede enumerarlos y aceptar invitaciones
-- antes que el barbero legítimo.
--
-- Solución:
--   - Crear RPC `get_public_invite_info(p_token UUID)` que devuelve solo
--     barbershop_name + barber_name si el token es válido (no lista tokens).
--   - Dropear la policy abierta.
--   - Revocar SELECT directo a barber_invites de anon (sigue authenticated
--     para que `accept_barber_invite` funcione vía SECURITY DEFINER).

BEGIN;

-- 1. RPC: solo devuelve info pública del invite, no expone tokens
CREATE OR REPLACE FUNCTION public.get_public_invite_info(
  p_token UUID
)
RETURNS TABLE (
  barbershop_name TEXT,
  barber_name     TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.name      AS barbershop_name,
    b.full_name AS barber_name
  FROM public.barber_invites i
  JOIN public.barbershops s ON s.id = i.barbershop_id
  JOIN public.barbers b     ON b.id = i.barber_id
  WHERE i.token       = p_token
    AND i.used_at     IS NULL
    AND i.expires_at  > now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_invite_info(UUID) TO anon, authenticated;

-- 2. Dropear policy abierta
DROP POLICY IF EXISTS barber_invites_token_read ON public.barber_invites;

-- 3. Revocar SELECT directo de anon en la tabla (authenticated puede mantener
--    para que accept_barber_invite funcione sin sorpresa, aunque internamente
--    la RPC es SECURITY DEFINER y no depende de este GRANT).
REVOKE SELECT ON public.barber_invites FROM anon;

-- (No tocamos los GRANTs de authenticated: la policy barber_invites_admin
-- sigue protegiendo via RLS para el dueño.)

COMMIT;
