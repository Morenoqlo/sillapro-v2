import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Dialog } from '@/ui/Dialog';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { FormField } from '@/ui/FormField';
import { serviceFormSchema, type ServiceFormInput } from './schemas';
import { useServiceMutations } from './hooks/useServices';
import type { Service } from './types';

interface ServiceModalProps {
  open: boolean;
  service: Service | null;
  onClose: () => void;
}

export function ServiceModal({ open, service, onClose }: ServiceModalProps) {
  const { create, update } = useServiceMutations();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormInput>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: '',
      category: 'Corte',
      durationMinutes: 30,
      priceAmount: 12000,
      commissionPercent: 40,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        service
          ? {
              name: service.name,
              category: service.category,
              durationMinutes: service.duration_minutes,
              priceAmount: service.price_amount,
              commissionPercent: service.commission_percent,
            }
          : {
              name: '',
              category: 'Corte',
              durationMinutes: 30,
              priceAmount: 12000,
              commissionPercent: 40,
            },
      );
    }
  }, [open, service, reset]);

  async function onSubmit(values: ServiceFormInput) {
    try {
      if (service) {
        await update.mutateAsync({ id: service.id, input: values });
        toast.success('Servicio actualizado');
      } else {
        await create.mutateAsync(values);
        toast.success('Servicio creado');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    }
  }

  const submitting = create.isPending || update.isPending;

  return (
    <Dialog open={open} onClose={onClose} title={service ? 'Editar servicio' : 'Nuevo servicio'}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="Nombre" htmlFor="name" error={errors.name?.message}>
          <Input id="name" placeholder="Corte clásico" {...register('name')} />
        </FormField>
        <FormField label="Categoría" htmlFor="category" error={errors.category?.message}>
          <Input id="category" placeholder="Corte" {...register('category')} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Duración (min)"
            htmlFor="durationMinutes"
            error={errors.durationMinutes?.message}
          >
            <Input
              id="durationMinutes"
              type="number"
              min="10"
              max="240"
              {...register('durationMinutes', { valueAsNumber: true })}
            />
          </FormField>
          <FormField
            label="Precio (CLP)"
            htmlFor="priceAmount"
            error={errors.priceAmount?.message}
          >
            <Input
              id="priceAmount"
              type="number"
              min="0"
              step="500"
              {...register('priceAmount', { valueAsNumber: true })}
            />
          </FormField>
        </div>
        <FormField
          label="Comisión (%)"
          htmlFor="commissionPercent"
          error={errors.commissionPercent?.message}
        >
          <Input
            id="commissionPercent"
            type="number"
            min="0"
            max="100"
            {...register('commissionPercent', { valueAsNumber: true })}
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
