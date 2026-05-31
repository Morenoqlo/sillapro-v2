import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { FormField } from '@/ui/FormField';
import { barberSchema, type BarberInput } from './schemas';

interface BarberStepProps {
  defaultValues?: Partial<BarberInput>;
  onSubmit: (values: BarberInput) => void;
  onBack: () => void;
}

export function BarberStep({ defaultValues, onSubmit, onBack }: BarberStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BarberInput>({
    resolver: zodResolver(barberSchema),
    defaultValues: {
      commissionDefault: 40,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <p className="mb-3 text-sm text-gray-600">
        Empieza por ti. Después puedes agregar más barberos en Equipo.
      </p>
      <FormField label="Nombre" htmlFor="fullName" error={errors.fullName?.message}>
        <Input id="fullName" placeholder="Diego" {...register('fullName')} />
      </FormField>
      <FormField
        label="Comisión por defecto (%)"
        htmlFor="commissionDefault"
        error={errors.commissionDefault?.message}
        hint="Porcentaje que el barbero gana por servicio. Editable después."
      >
        <Input
          id="commissionDefault"
          type="number"
          min="0"
          max="100"
          {...register('commissionDefault', { valueAsNumber: true })}
        />
      </FormField>
      <div className="mt-4 flex gap-2">
        <Button type="button" variant="secondary" onClick={onBack} className="flex-1">
          Atrás
        </Button>
        <Button type="submit" className="flex-1">
          Continuar
        </Button>
      </div>
    </form>
  );
}
