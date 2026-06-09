import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import type { Client, ClientStatus } from '../types';
import type { ClientFormInput } from '../schemas';

/**
 * Hard cap to avoid pulling 10k+ rows into the browser. Tested as
 * generous-enough for small barbershops (1-3 chairs, <1y of clients).
 * Beyond this, the search box drives filtering server-side.
 */
export const CLIENTS_MAX = 200;

export function useClients(search: string) {
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  const list = useQuery({
    queryKey: ['clients', barbershopId, search],
    queryFn: async (): Promise<Client[]> => {
      let query = supabase
        .from('clients')
        .select('id, barbershop_id, full_name, phone, email, notes, status, created_at, updated_at')
        .eq('barbershop_id', barbershopId!)
        .order('full_name')
        .limit(CLIENTS_MAX);
      if (search.trim()) {
        // Escape % and _ to avoid wildcard injection. (Already authed
        // RLS-protected but better to keep the literal search.)
        const escaped = search.replace(/[\\%_]/g, (m) => `\\${m}`);
        query = query.or(`full_name.ilike.%${escaped}%,phone.ilike.%${escaped}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Client[];
    },
    enabled: !!barbershopId,
  });

  return { list, barbershopId };
}

export function useClientMutations() {
  const qc = useQueryClient();
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['clients', barbershopId] });
  }

  const create = useMutation({
    mutationFn: async (input: ClientFormInput) => {
      const { error } = await supabase.from('clients').insert({
        barbershop_id: barbershopId,
        full_name: input.fullName,
        phone: input.phone,
        notes: input.notes,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ClientFormInput }) => {
      const { error } = await supabase
        .from('clients')
        .update({ full_name: input.fullName, phone: input.phone, notes: input.notes })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ClientStatus }) => {
      const { error } = await supabase.from('clients').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { create, update, setStatus };
}
