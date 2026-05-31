-- Migration 002 · Ajustes para SillaPro v2
-- Aditivos sobre 001_initial_schema.sql. No rompen estructura existente.

BEGIN;

-- 1. Propinas en pagos
ALTER TABLE public.payments
  ADD COLUMN tip_amount NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (tip_amount >= 0);

-- 2. Recordatorio enviado (para WhatsApp futuro)
ALTER TABLE public.appointments
  ADD COLUMN reminder_sent_at TIMESTAMPTZ;

-- 3. Slug por barbería para URLs públicas /reservar/:slug
ALTER TABLE public.barbershops
  ADD COLUMN slug TEXT UNIQUE
    CHECK (slug IS NULL OR slug ~ '^[a-z0-9-]+$');

-- 4. Multi-servicio por cita (cita tiene N items)
CREATE TABLE public.appointment_items (
  appointment_id UUID NOT NULL,
  service_id UUID NOT NULL,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  price_amount NUMERIC(12,2) NOT NULL CHECK (price_amount >= 0),
  commission_percent NUMERIC(5,2) NOT NULL CHECK (commission_percent >= 0 AND commission_percent <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (appointment_id, service_id),
  FOREIGN KEY (appointment_id, barbershop_id)
    REFERENCES public.appointments(id, barbershop_id) ON DELETE CASCADE,
  FOREIGN KEY (service_id, barbershop_id)
    REFERENCES public.services(id, barbershop_id) ON DELETE RESTRICT
);

CREATE INDEX appointment_items_shop_idx ON public.appointment_items (barbershop_id);

-- 5. Vista materializada para KPIs del día
CREATE MATERIALIZED VIEW public.day_kpis_mv AS
SELECT
  barbershop_id,
  (starts_at AT TIME ZONE 'America/Santiago')::date AS business_date,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending,
  COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
  COUNT(*) FILTER (WHERE status = 'no_show') AS no_show,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
  COALESCE(SUM(price_amount) FILTER (WHERE status = 'completed'), 0) AS gross
FROM public.appointments
GROUP BY barbershop_id, (starts_at AT TIME ZONE 'America/Santiago')::date;

CREATE UNIQUE INDEX day_kpis_mv_unique_idx
  ON public.day_kpis_mv (barbershop_id, business_date);

COMMIT;
