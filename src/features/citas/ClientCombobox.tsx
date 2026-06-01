import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { useClients, useClientMutations } from '@/features/clientes/hooks/useClients';
import type { Client } from '@/features/clientes/types';

interface ClientComboboxProps {
  value: string;
  /** Optional initial display name (when editing an existing appointment). */
  initialDisplayName?: string;
  onChange: (clientId: string, client: Client) => void;
  error?: string;
}

export function ClientCombobox({
  value: _value,
  initialDisplayName,
  onChange,
  error,
}: ClientComboboxProps) {
  // The displayed text in the input. Seeded once from initialDisplayName so
  // edit mode shows the current client's name; subsequent typing replaces it.
  const [search, setSearch] = useState(initialDisplayName ?? '');
  const [showList, setShowList] = useState(false);
  const [creating, setCreating] = useState(false);
  const { list } = useClients(search);
  const { create } = useClientMutations();

  const results = (list.data ?? []).slice(0, 5);
  const exactMatch = results.find((c) => c.full_name.toLowerCase() === search.toLowerCase());

  async function handleCreateNew() {
    if (!search.trim()) return;
    setCreating(true);
    try {
      await create.mutateAsync({ fullName: search.trim(), phone: '', notes: '' });
      toast.success(`Cliente "${search.trim()}" creado — selecciónalo abajo`);
      setShowList(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear cliente');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="relative">
      <Input
        placeholder="Buscar por nombre o teléfono..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setShowList(true);
        }}
        onFocus={() => setShowList(true)}
        onBlur={() => setTimeout(() => setShowList(false), 150)}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {showList && search.trim() && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          {results.length > 0 && (
            <ul className="max-h-60 overflow-y-auto">
              {results.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(c.id, c);
                      setSearch(c.full_name);
                      setShowList(false);
                    }}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <span className="font-medium">{c.full_name}</span>
                    {c.phone && <span className="ml-2 text-gray-500">· {c.phone}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!exactMatch && search.trim().length >= 2 && (
            <div className="border-t border-gray-100 px-3 py-2">
              <p className="text-xs text-gray-500">¿No existe?</p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleCreateNew}
                disabled={creating}
                onMouseDown={(e) => e.preventDefault()}
              >
                {creating ? 'Creando...' : `+ Crear "${search.trim()}"`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
