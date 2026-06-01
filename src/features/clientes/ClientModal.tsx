import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Dialog } from '@/ui/Dialog';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { FormField } from '@/ui/FormField';
import { clientFormSchema, type ClientFormInput } from './schemas';
import { useClientMutations } from './hooks/useClients';
import type { Client } from './types';

interface ClientModalProps {
  client: Client | null;
  onClose: () => void;
}

// Este modal se monta sólo cuando está abierto (render condicional en la página),
// por eso useForm inicializa con los valores correctos al montar — sin useEffect
// reset que pueda pisar lo que el usuario escribe justo tras abrir.
export function ClientModal({ client, onClose }: ClientModalProps) {
  const { create, update } = useClientMutations();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormInput>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: client
      ? { fullName: client.full_name, phone: client.phone, notes: client.notes }
      : { fullName: '', phone: '', notes: '' },
  });

  async function onSubmit(values: ClientFormInput) {
    try {
      if (client) {
        await update.mutateAsync({ id: client.id, input: values });
        toast.success('Cliente actualizado');
      } else {
        await create.mutateAsync(values);
        toast.success('Cliente creado');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    }
  }

  const submitting = create.isPending || update.isPending;

  return (
    <Dialog open onClose={onClose} title={client ? 'Editar cliente' : 'Nuevo cliente'}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="Nombre" htmlFor="fullName" error={errors.fullName?.message}>
          <Input id="fullName" placeholder="Carla Rodríguez" {...register('fullName')} />
        </FormField>
        <FormField label="Teléfono" htmlFor="phone" error={errors.phone?.message}>
          <Input id="phone" placeholder="+56 9 8765 4321" {...register('phone')} />
        </FormField>
        <FormField label="Notas" htmlFor="notes" error={errors.notes?.message}>
          <Input id="notes" placeholder="Prefiere mañana, alérgico a..." {...register('notes')} />
        </FormField>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
