import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { StatusBadge } from '@/ui/StatusBadge';
import { useUpdateBarberLevel } from './hooks/useUpdateBarberLevel';
import { useCreateBarberInvite } from './hooks/useBarberInvite';
import type { Barber } from './types';

interface Props {
  barber: Barber;
}

/**
 * Title + status + chair + base commission + editable level + invite link.
 * Extracted from BarberDetailPage so the parent stays focused on orchestrating
 * tabs and data.
 */
export function BarberDetailHeader({ barber }: Props) {
  const updateLevel = useUpdateBarberLevel(barber.id);
  const createInvite = useCreateBarberInvite();
  const [inviteCopied, setInviteCopied] = useState(false);
  const [levelDraft, setLevelDraft] = useState<string | null>(null);

  async function handleGenerateInvite() {
    try {
      const token = await createInvite.mutateAsync(barber.id);
      const url = `${window.location.origin}/unirse?token=${token}`;
      await navigator.clipboard.writeText(url);
      setInviteCopied(true);
      toast.success('¡Link copiado! Envíalo al barbero por WhatsApp.');
      setTimeout(() => setInviteCopied(false), 3000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar el link');
    }
  }

  async function handleLevelBlur() {
    if (levelDraft != null && levelDraft !== barber.experience_level) {
      try {
        await updateLevel.mutateAsync(levelDraft);
        toast.success('Nivel actualizado');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error');
      }
    }
    setLevelDraft(null);
  }

  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h2 className="text-2xl font-bold text-gray-900">{barber.full_name}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <StatusBadge tone={barber.active ? 'active' : 'inactive'}>
            {barber.active ? 'Activo' : 'Inactivo'}
          </StatusBadge>
          <span className="text-sm text-gray-500">{barber.chair_label}</span>
          <span className="text-sm text-gray-500">
            · Comisión base {barber.commission_default}%
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <label className="text-xs text-gray-600">Nivel:</label>
          <Input
            className="!w-44"
            placeholder="Ej: Senior, Junior…"
            value={levelDraft ?? barber.experience_level}
            onChange={(e) => setLevelDraft(e.target.value)}
            onBlur={handleLevelBlur}
          />
        </div>
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={handleGenerateInvite}
        disabled={createInvite.isPending}
      >
        {inviteCopied ? '✓ Link copiado' : '🔗 Generar enlace de acceso'}
      </Button>
    </div>
  );
}
