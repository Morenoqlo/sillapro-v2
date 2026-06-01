import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Dialog } from '@/ui/Dialog';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { FormField } from '@/ui/FormField';
import { barberFormSchema, type BarberFormInput } from './schemas';
import { useBarberMutations } from './hooks/useBarbers';
import type { Barber } from './types';

interface BarberModalProps {
  barber: Barber | null;
  onClose: () => void;
}

// Se monta sólo cuando está abierto (render condicional en la página): useForm
// inicializa con los valores correctos al montar, sin useEffect reset que pueda
// pisar lo que el usuario escribe justo tras abrir.
export function BarberModal({ barber, onClose }: BarberModalProps) {
  const { create, update } = useBarberMutations();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BarberFormInput>({
    resolver: zodResolver(barberFormSchema),
    defaultValues: barber
      ? {
          fullName: barber.full_name,
          chairLabel: barber.chair_label,
          commissionDefault: barber.commission_default,
        }
      : { fullName: '', chairLabel: 'Silla', commissionDefault: 40 },
  });

  async function onSubmit(values: BarberFormInput) {
    try {
      if (barber) {
        await update.mutateAsync({ id: barber.id, input: values });
        toast.success('Barbero actualizado');
      } else {
        await create.mutateAsync(values);
        toast.success('Barbero creado');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    }
  }

  const submitting = create.isPending || update.isPending;

  return (
    <Dialog open onClose={onClose} title={barber ? 'Editar barbero' : 'Nuevo barbero'}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="Nombre" htmlFor="fullName" error={errors.fullName?.message}>
          <Input id="fullName" placeholder="Diego" {...register('fullName')} />
        </FormField>
        <FormField label="Silla" htmlFor="chairLabel" error={errors.chairLabel?.message}>
          <Input id="chairLabel" placeholder="Silla 1" {...register('chairLabel')} />
        </FormField>
        <FormField
          label="Comisión por defecto (%)"
          htmlFor="commissionDefault"
          error={errors.commissionDefault?.message}
          hint="Se usa cuando un servicio no tiene comisión propia."
        >
          <Input
            id="commissionDefault"
            type="number"
            min="0"
            max="100"
            {...register('commissionDefault', { valueAsNumber: true })}
          />
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
