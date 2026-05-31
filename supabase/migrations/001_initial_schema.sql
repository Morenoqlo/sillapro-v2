-- SillaPro initial Supabase/PostgreSQL schema
-- Designed for internal barbershop operations: agenda, clients, services,
-- barbers, cash, payments, commissions and daily closeouts.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE public.barbershops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  timezone TEXT NOT NULL DEFAULT 'America/Santiago',
  currency TEXT NOT NULL DEFAULT 'CLP',
  seats BIGINT NOT NULL DEFAULT 1 CHECK (seats > 0),
  open_time TIME NOT NULL DEFAULT '09:00',
  close_time TIME NOT NULL DEFAULT '20:00',
  slot_minutes BIGINT NOT NULL DEFAULT 30 CHECK (slot_minutes IN (10, 15, 20, 30, 45, 60)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (open_time < close_time)
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (length(trim(full_name)) > 0),
  chair_label TEXT NOT NULL DEFAULT 'Silla',
  commission_default NUMERIC(5,2) NOT NULL DEFAULT 40 CHECK (commission_default >= 0 AND commission_default <= 100),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, barbershop_id)
);

CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'barber', 'staff')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (barbershop_id, user_id)
);

CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  category TEXT NOT NULL DEFAULT 'Servicio',
  duration_minutes BIGINT NOT NULL CHECK (duration_minutes >= 10 AND duration_minutes <= 240),
  price_amount NUMERIC(12,2) NOT NULL CHECK (price_amount >= 0),
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 40 CHECK (commission_percent >= 0 AND commission_percent <= 100),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, barbershop_id),
  UNIQUE (barbershop_id, name)
);

CREATE TABLE public.barber_services (
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL,
  service_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (barber_id, service_id),
  FOREIGN KEY (barber_id, barbershop_id) REFERENCES public.barbers(id, barbershop_id) ON DELETE CASCADE,
  FOREIGN KEY (service_id, barbershop_id) REFERENCES public.services(id, barbershop_id) ON DELETE CASCADE
);

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (length(trim(full_name)) > 0),
  phone TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, barbershop_id)
);

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL,
  client_id UUID NOT NULL,
  service_id UUID NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_chair', 'completed', 'cancelled', 'no_show')),
  price_amount NUMERIC(12,2) NOT NULL CHECK (price_amount >= 0),
  commission_percent NUMERIC(5,2) NOT NULL CHECK (commission_percent >= 0 AND commission_percent <= 100),
  note TEXT NOT NULL DEFAULT '',
  status_reason TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, barbershop_id),
  CHECK (ends_at > starts_at),
  FOREIGN KEY (barber_id, barbershop_id) REFERENCES public.barbers(id, barbershop_id) ON DELETE RESTRICT,
  FOREIGN KEY (client_id, barbershop_id) REFERENCES public.clients(id, barbershop_id) ON DELETE RESTRICT,
  FOREIGN KEY (service_id, barbershop_id) REFERENCES public.services(id, barbershop_id) ON DELETE RESTRICT,
  EXCLUDE USING gist (
    barbershop_id WITH =,
    barber_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status IN ('pending', 'confirmed', 'in_chair'))
);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('cash', 'card', 'transfer', 'other')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (appointment_id, barbershop_id) REFERENCES public.appointments(id, barbershop_id) ON DELETE CASCADE
);

CREATE TABLE public.cash_closeouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  business_date DATE NOT NULL,
  gross_amount NUMERIC(12,2) NOT NULL CHECK (gross_amount >= 0),
  commission_amount NUMERIC(12,2) NOT NULL CHECK (commission_amount >= 0),
  net_amount NUMERIC(12,2) NOT NULL CHECK (net_amount >= 0),
  completed_count BIGINT NOT NULL DEFAULT 0 CHECK (completed_count >= 0),
  no_show_count BIGINT NOT NULL DEFAULT 0 CHECK (no_show_count >= 0),
  cancelled_count BIGINT NOT NULL DEFAULT 0 CHECK (cancelled_count >= 0),
  note TEXT NOT NULL DEFAULT '',
  closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (barbershop_id, business_date)
);

CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX memberships_user_id_idx ON public.memberships (user_id);
CREATE INDEX memberships_barbershop_id_idx ON public.memberships (barbershop_id);
CREATE INDEX barbers_barbershop_id_idx ON public.barbers (barbershop_id);
CREATE INDEX services_barbershop_id_active_idx ON public.services (barbershop_id, active);
CREATE INDEX barber_services_barbershop_id_idx ON public.barber_services (barbershop_id);
CREATE INDEX barber_services_service_id_idx ON public.barber_services (service_id);
CREATE INDEX clients_barbershop_id_name_idx ON public.clients (barbershop_id, lower(full_name));
CREATE UNIQUE INDEX clients_unique_phone_per_shop_idx ON public.clients (barbershop_id, phone)
  WHERE phone <> '';
CREATE INDEX appointments_shop_day_idx ON public.appointments (barbershop_id, starts_at);
CREATE INDEX appointments_barber_day_idx ON public.appointments (barber_id, starts_at);
CREATE INDEX appointments_client_id_idx ON public.appointments (client_id);
CREATE INDEX appointments_service_id_idx ON public.appointments (service_id);
CREATE INDEX appointments_status_idx ON public.appointments (barbershop_id, status);
CREATE INDEX payments_appointment_id_idx ON public.payments (appointment_id);
CREATE INDEX payments_shop_paid_at_idx ON public.payments (barbershop_id, paid_at);
CREATE INDEX cash_closeouts_shop_date_idx ON public.cash_closeouts (barbershop_id, business_date DESC);
CREATE INDEX audit_events_shop_created_idx ON public.audit_events (barbershop_id, created_at DESC);
CREATE INDEX audit_events_metadata_gin_idx ON public.audit_events USING GIN (metadata);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER barbershops_set_updated_at
BEFORE UPDATE ON public.barbershops
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER barbers_set_updated_at
BEFORE UPDATE ON public.barbers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER memberships_set_updated_at
BEFORE UPDATE ON public.memberships
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER services_set_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER clients_set_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER appointments_set_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.user_has_barbershop_role(
  target_barbershop_id UUID,
  allowed_roles TEXT[] DEFAULT ARRAY['owner', 'admin', 'barber', 'staff']
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships
    WHERE barbershop_id = target_barbershop_id
      AND user_id = auth.uid()
      AND active = TRUE
      AND role = ANY(allowed_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.user_barber_id(target_barbershop_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT barber_id
  FROM public.memberships
  WHERE barbershop_id = target_barbershop_id
    AND user_id = auth.uid()
    AND active = TRUE
  LIMIT 1;
$$;

ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_closeouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_self_select ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY profiles_self_insert ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY profiles_self_update ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY barbershops_member_select ON public.barbershops
  FOR SELECT USING (public.user_has_barbershop_role(id));
CREATE POLICY barbershops_admin_update ON public.barbershops
  FOR UPDATE USING (public.user_has_barbershop_role(id, ARRAY['owner', 'admin']))
  WITH CHECK (public.user_has_barbershop_role(id, ARRAY['owner', 'admin']));

CREATE POLICY memberships_member_select ON public.memberships
  FOR SELECT USING (public.user_has_barbershop_role(barbershop_id));
CREATE POLICY memberships_admin_write ON public.memberships
  FOR ALL USING (public.user_has_barbershop_role(barbershop_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.user_has_barbershop_role(barbershop_id, ARRAY['owner', 'admin']));

CREATE POLICY barbers_member_select ON public.barbers
  FOR SELECT USING (public.user_has_barbershop_role(barbershop_id));
CREATE POLICY barbers_admin_write ON public.barbers
  FOR ALL USING (public.user_has_barbershop_role(barbershop_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.user_has_barbershop_role(barbershop_id, ARRAY['owner', 'admin']));

CREATE POLICY services_member_select ON public.services
  FOR SELECT USING (public.user_has_barbershop_role(barbershop_id));
CREATE POLICY services_admin_write ON public.services
  FOR ALL USING (public.user_has_barbershop_role(barbershop_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.user_has_barbershop_role(barbershop_id, ARRAY['owner', 'admin']));

CREATE POLICY barber_services_member_select ON public.barber_services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.barbers
      WHERE barbers.id = barber_services.barber_id
        AND public.user_has_barbershop_role(barbers.barbershop_id)
    )
  );
CREATE POLICY barber_services_admin_write ON public.barber_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.barbers
      WHERE barbers.id = barber_services.barber_id
        AND public.user_has_barbershop_role(barbers.barbershop_id, ARRAY['owner', 'admin'])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.barbers
      WHERE barbers.id = barber_services.barber_id
        AND public.user_has_barbershop_role(barbers.barbershop_id, ARRAY['owner', 'admin'])
    )
  );

CREATE POLICY clients_member_select ON public.clients
  FOR SELECT USING (public.user_has_barbershop_role(barbershop_id));
CREATE POLICY clients_staff_write ON public.clients
  FOR ALL USING (public.user_has_barbershop_role(barbershop_id, ARRAY['owner', 'admin', 'staff']))
  WITH CHECK (public.user_has_barbershop_role(barbershop_id, ARRAY['owner', 'admin', 'staff']));

CREATE POLICY appointments_member_select ON public.appointments
  FOR SELECT USING (
    public.user_has_barbershop_role(barbershop_id, ARRAY['owner', 'admin', 'staff'])
    OR (
      public.user_has_barbershop_role(barbershop_id, ARRAY['barber'])
      AND barber_id = public.user_barber_id(barbershop_id)
    )
  );
CREATE POLICY appointments_staff_write ON public.appointments
  FOR ALL USING (
    public.user_has_barbershop_role(barbershop_id, ARRAY['owner', 'admin', 'staff'])
    OR (
      public.user_has_barbershop_role(barbershop_id, ARRAY['barber'])
      AND barber_id = public.user_barber_id(barbershop_id)
    )
  )
  WITH CHECK (
    public.user_has_barbershop_role(barbershop_id, ARRAY['owner', 'admin', 'staff'])
    OR (
      public.user_has_barbershop_role(barbershop_id, ARRAY['barber'])
      AND barber_id = public.user_barber_id(barbershop_id)
    )
  );

CREATE POLICY payments_admin_select ON public.payments
  FOR SELECT USING (public.user_has_barbershop_role(barbershop_id, ARRAY['owner', 'admin']));
CREATE POLICY payments_admin_write ON public.payments
  FOR ALL USING (public.user_has_barbershop_role(barbershop_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.user_has_barbershop_role(barbershop_id, ARRAY['owner', 'admin']));

CREATE POLICY closeouts_admin_select ON public.cash_closeouts
  FOR SELECT USING (public.user_has_barbershop_role(barbershop_id, ARRAY['owner', 'admin']));
CREATE POLICY closeouts_admin_write ON public.cash_closeouts
  FOR ALL USING (public.user_has_barbershop_role(barbershop_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.user_has_barbershop_role(barbershop_id, ARRAY['owner', 'admin']));

CREATE POLICY audit_admin_select ON public.audit_events
  FOR SELECT USING (public.user_has_barbershop_role(barbershop_id, ARRAY['owner', 'admin']));
CREATE POLICY audit_member_insert ON public.audit_events
  FOR INSERT WITH CHECK (public.user_has_barbershop_role(barbershop_id));

CREATE VIEW public.daily_cash_summary
WITH (security_invoker = true) AS
SELECT
  a.barbershop_id,
  (a.starts_at AT TIME ZONE b.timezone)::date AS business_date,
  count(*) FILTER (WHERE a.status = 'completed') AS completed_count,
  count(*) FILTER (WHERE a.status = 'no_show') AS no_show_count,
  count(*) FILTER (WHERE a.status = 'cancelled') AS cancelled_count,
  coalesce(sum(a.price_amount) FILTER (WHERE a.status = 'completed'), 0) AS gross_amount,
  coalesce(sum(a.price_amount * (a.commission_percent / 100)) FILTER (WHERE a.status = 'completed'), 0) AS commission_amount,
  coalesce(sum(a.price_amount - (a.price_amount * (a.commission_percent / 100))) FILTER (WHERE a.status = 'completed'), 0) AS net_amount
FROM public.appointments a
JOIN public.barbershops b ON b.id = a.barbershop_id
GROUP BY a.barbershop_id, (a.starts_at AT TIME ZONE b.timezone)::date;

COMMIT;
