import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !serviceKey || !anonKey) {
  throw new Error('Faltan env vars de Supabase para tests E2E');
}

// Cliente con service role: bypasses RLS, usado para setup/teardown
export const adminClient: SupabaseClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Cliente anon usado para simular un usuario autenticado
export function anonClientForUser() {
  return createClient(url!, anonKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
