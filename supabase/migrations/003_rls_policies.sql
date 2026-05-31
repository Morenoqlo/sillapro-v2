-- Migration 003 · Row Level Security para multi-tenancy
-- Cada usuario solo ve datos de las barberías a las que pertenece via memberships.

BEGIN;

-- Helper: qué barberías puede acceder el usuario actual
CREATE OR REPLACE FUNCTION public.user_barbershops()
RETURNS SETOF UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT barbershop_id
  FROM public.memberships
  WHERE user_id = auth.uid() AND active = TRUE
$$;

-- Helper: qué barberías puede MODIFICAR (owner/admin/staff, no barber)
CREATE OR REPLACE FUNCTION public.user_admin_barbershops()
RETURNS SETOF UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT barbershop_id
  FROM public.memberships
  WHERE user_id = auth.uid()
    AND active = TRUE
    AND role IN ('owner', 'admin', 'staff')
$$;

-- Helper: barber_ids del usuario actual (para que barbero solo vea sus citas)
CREATE OR REPLACE FUNCTION public.user_barber_ids()
RETURNS SETOF UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT barber_id
  FROM public.memberships
  WHERE user_id = auth.uid()
    AND active = TRUE
    AND barber_id IS NOT NULL
$$;

-- Activar RLS en todas las tablas
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_closeouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- barbershops
CREATE POLICY barbershops_select ON public.barbershops
  FOR SELECT USING (id IN (SELECT public.user_barbershops()));
CREATE POLICY barbershops_modify ON public.barbershops
  FOR ALL USING (id IN (SELECT public.user_admin_barbershops()))
  WITH CHECK (id IN (SELECT public.user_admin_barbershops()));

-- profiles (cada usuario solo ve y modifica el suyo)
CREATE POLICY profiles_self ON public.profiles
  FOR ALL USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- memberships (ver las propias y las de mis barberías)
CREATE POLICY memberships_select ON public.memberships
  FOR SELECT USING (
    user_id = auth.uid()
    OR barbershop_id IN (SELECT public.user_admin_barbershops())
  );
CREATE POLICY memberships_modify ON public.memberships
  FOR ALL USING (barbershop_id IN (SELECT public.user_admin_barbershops()))
  WITH CHECK (barbershop_id IN (SELECT public.user_admin_barbershops()));

-- barbers
CREATE POLICY barbers_select ON public.barbers
  FOR SELECT USING (barbershop_id IN (SELECT public.user_barbershops()));
CREATE POLICY barbers_modify ON public.barbers
  FOR ALL USING (barbershop_id IN (SELECT public.user_admin_barbershops()))
  WITH CHECK (barbershop_id IN (SELECT public.user_admin_barbershops()));

-- services
CREATE POLICY services_select ON public.services
  FOR SELECT USING (barbershop_id IN (SELECT public.user_barbershops()));
CREATE POLICY services_modify ON public.services
  FOR ALL USING (barbershop_id IN (SELECT public.user_admin_barbershops()))
  WITH CHECK (barbershop_id IN (SELECT public.user_admin_barbershops()));

-- barber_services
CREATE POLICY barber_services_select ON public.barber_services
  FOR SELECT USING (barbershop_id IN (SELECT public.user_barbershops()));
CREATE POLICY barber_services_modify ON public.barber_services
  FOR ALL USING (barbershop_id IN (SELECT public.user_admin_barbershops()))
  WITH CHECK (barbershop_id IN (SELECT public.user_admin_barbershops()));

-- clients
CREATE POLICY clients_select ON public.clients
  FOR SELECT USING (barbershop_id IN (SELECT public.user_barbershops()));
CREATE POLICY clients_modify ON public.clients
  FOR ALL USING (barbershop_id IN (SELECT public.user_admin_barbershops()))
  WITH CHECK (barbershop_id IN (SELECT public.user_admin_barbershops()));

-- appointments
CREATE POLICY appointments_select_admin ON public.appointments
  FOR SELECT USING (barbershop_id IN (SELECT public.user_admin_barbershops()));
CREATE POLICY appointments_select_barber ON public.appointments
  FOR SELECT USING (barber_id IN (SELECT public.user_barber_ids()));
CREATE POLICY appointments_modify_admin ON public.appointments
  FOR ALL USING (barbershop_id IN (SELECT public.user_admin_barbershops()))
  WITH CHECK (barbershop_id IN (SELECT public.user_admin_barbershops()));

-- appointment_items
CREATE POLICY appointment_items_select ON public.appointment_items
  FOR SELECT USING (barbershop_id IN (SELECT public.user_barbershops()));
CREATE POLICY appointment_items_modify ON public.appointment_items
  FOR ALL USING (barbershop_id IN (SELECT public.user_admin_barbershops()))
  WITH CHECK (barbershop_id IN (SELECT public.user_admin_barbershops()));

-- payments (solo admin)
CREATE POLICY payments_admin ON public.payments
  FOR ALL USING (barbershop_id IN (SELECT public.user_admin_barbershops()))
  WITH CHECK (barbershop_id IN (SELECT public.user_admin_barbershops()));

-- cash_closeouts (solo admin)
CREATE POLICY cash_closeouts_admin ON public.cash_closeouts
  FOR ALL USING (barbershop_id IN (SELECT public.user_admin_barbershops()))
  WITH CHECK (barbershop_id IN (SELECT public.user_admin_barbershops()));

-- audit_events (lectura admin, escritura via SECURITY DEFINER en RPCs)
CREATE POLICY audit_events_select ON public.audit_events
  FOR SELECT USING (barbershop_id IN (SELECT public.user_admin_barbershops()));

COMMIT;
