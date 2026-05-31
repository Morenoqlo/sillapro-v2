import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { FormField } from '@/ui/FormField';
import { serviceSchema, type ServiceInput } from './schemas';

interface ServiceStepProps {
  defaultValues?: Partial<ServiceInput>;
  onSubmit: (values: ServiceInput) => void;
  onBack: () => void;
  submitting?: boolean;
}

export function ServiceStep({ defaultValues, onSubmit, onBack, submitting }: ServiceStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      durationMinutes: 30,
      priceAmount: 12000,
      commissionPercent: 40,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <p className="mb-3 text-sm text-gray-600">
        Define tu primer servicio. Después puedes agregar más en Servicios.
      </p>
      <FormField label="Nombre" htmlFor="name" error={errors.name?.message}>
        <Input id="name" placeholder="Corte clásico" {...register('name')} />
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
        <FormField label="Precio (CLP)" htmlFor="priceAmount" error={errors.priceAmount?.message}>
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
        label="Comisión del barbero (%)"
        htmlFor="commissionPercent"
        error={errors.commissionPercent?.message}
        hint="Heredada del barbero por defecto. Cambiable por servicio."
      >
        <Input
          id="commissionPercent"
          type="number"
          min="0"
          max="100"
          {...register('commissionPercent', { valueAsNumber: true })}
        />
      </FormField>
      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          className="flex-1"
          disabled={submitting}
        >
          Atrás
        </Button>
        <Button type="submit" className="flex-1" disabled={submitting}>
          {submitting ? 'Creando...' : 'Crear y empezar'}
        </Button>
      </div>
    </form>
  );
}
