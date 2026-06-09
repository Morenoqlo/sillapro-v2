-- Migration 019 · Auditoría automática de eventos críticos.
--
-- Problema (A9): la tabla audit_events existe desde 001 pero nunca se
-- escribe en ella. Sin audit log, ante incidente (cliente reclama un
-- cobro inexistente, propina mal asignada, barbero "fantasma" en el
-- equipo) no hay forma de reconstruir qué pasó.
--
-- Estrategia: triggers solo en eventos de bajo volumen pero alto valor
-- forense. No log de payments/appointments individuales (alto volumen,
-- los closeouts diarios dan la trazabilidad necesaria).
--
-- Eventos logueados:
--   - barbershops INSERT (signup)
--   - memberships INSERT/UPDATE/DELETE (cambios de equipo)
--   - cash_closeouts INSERT (cierre de día — irreversible, financiero)
--   - barber_invites UPDATE cuando used_at pasa de NULL a NOT NULL
--     (invitación consumida)

BEGIN;

-- ─── Helper: insertar audit event con metadata segura ──────────────────
CREATE OR REPLACE FUNCTION public.audit_log(
  p_barbershop_id UUID,
  p_entity_type   TEXT,
  p_entity_id     UUID,
  p_action        TEXT,
  p_metadata      JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Silently no-op if no shop context (e.g., trigger fires from system query)
  IF p_barbershop_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.audit_events (
    barbershop_id, actor_id, entity_type, entity_id, action, metadata
  )
  VALUES (
    p_barbershop_id, auth.uid(), p_entity_type, p_entity_id, p_action,
    COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$$;

-- ─── Trigger: barbershop signup ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.tg_audit_barbershop_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public.audit_log(
    NEW.id, 'barbershop', NEW.id, 'created',
    jsonb_build_object('name', NEW.name, 'slug', NEW.slug, 'timezone', NEW.timezone)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_barbershop_insert ON public.barbershops;
CREATE TRIGGER audit_barbershop_insert
AFTER INSERT ON public.barbershops
FOR EACH ROW EXECUTE FUNCTION public.tg_audit_barbershop_insert();

-- ─── Trigger: memberships changes (equipo) ─────────────────────────────
CREATE OR REPLACE FUNCTION public.tg_audit_memberships()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.audit_log(
      NEW.barbershop_id, 'membership', NEW.id, 'added',
      jsonb_build_object('role', NEW.role, 'user_id', NEW.user_id, 'barber_id', NEW.barber_id)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log meaningful changes (active toggle, role change)
    IF OLD.role <> NEW.role OR OLD.active <> NEW.active THEN
      PERFORM public.audit_log(
        NEW.barbershop_id, 'membership', NEW.id, 'updated',
        jsonb_build_object(
          'old_role', OLD.role, 'new_role', NEW.role,
          'old_active', OLD.active, 'new_active', NEW.active
        )
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.audit_log(
      OLD.barbershop_id, 'membership', OLD.id, 'removed',
      jsonb_build_object('role', OLD.role, 'user_id', OLD.user_id)
    );
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_memberships ON public.memberships;
CREATE TRIGGER audit_memberships
AFTER INSERT OR UPDATE OR DELETE ON public.memberships
FOR EACH ROW EXECUTE FUNCTION public.tg_audit_memberships();

-- ─── Trigger: cash_closeouts INSERT (cierre de día) ────────────────────
CREATE OR REPLACE FUNCTION public.tg_audit_closeout_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public.audit_log(
    NEW.barbershop_id, 'cash_closeout', NEW.id, 'created',
    jsonb_build_object(
      'business_date',  NEW.business_date,
      'gross_amount',   NEW.gross_amount,
      'commission',     NEW.commission_amount,
      'net_amount',     NEW.net_amount,
      'tips_amount',    NEW.tips_amount,
      'completed',      NEW.completed_count
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_closeout_insert ON public.cash_closeouts;
CREATE TRIGGER audit_closeout_insert
AFTER INSERT ON public.cash_closeouts
FOR EACH ROW EXECUTE FUNCTION public.tg_audit_closeout_insert();

-- ─── Trigger: barber_invites consumed ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.tg_audit_invite_used()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF OLD.used_at IS NULL AND NEW.used_at IS NOT NULL THEN
    PERFORM public.audit_log(
      NEW.barbershop_id, 'barber_invite', NEW.id, 'accepted',
      jsonb_build_object('barber_id', NEW.barber_id, 'used_by', NEW.used_by)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_invite_used ON public.barber_invites;
CREATE TRIGGER audit_invite_used
AFTER UPDATE OF used_at ON public.barber_invites
FOR EACH ROW EXECUTE FUNCTION public.tg_audit_invite_used();

COMMIT;
