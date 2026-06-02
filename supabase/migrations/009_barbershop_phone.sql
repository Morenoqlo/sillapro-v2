-- Migration 009 · Teléfono del local para notificaciones vía WhatsApp

BEGIN;

ALTER TABLE public.barbershops
  ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';

COMMIT;
