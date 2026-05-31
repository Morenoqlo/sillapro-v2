import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { Select } from '@/ui/Select';
import { FormField } from '@/ui/FormField';
import { shopSchema, type ShopInput } from './schemas';

interface ShopStepProps {
  defaultValues?: Partial<ShopInput>;
  onSubmit: (values: ShopInput) => void;
}

const TIMEZONES = [
  'America/Santiago',
  'America/Punta_Arenas',
  'Pacific/Easter',
];

export function ShopStep({ defaultValues, onSubmit }: ShopStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShopInput>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      timezone: 'America/Santiago',
      openTime: '09:00',
      closeTime: '20:00',
      slotMinutes: 30,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormField label="Nombre del local" htmlFor="name" error={errors.name?.message}>
        <Input id="name" placeholder="Norte Fino Barbería" {...register('name')} />
      </FormField>
      <FormField label="Zona horaria" htmlFor="timezone" error={errors.timezone?.message}>
        <Select id="timezone" {...register('timezone')}>
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </Select>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Abre" htmlFor="openTime" error={errors.openTime?.message}>
          <Input id="openTime" type="time" {...register('openTime')} />
        </FormField>
        <FormField label="Cierra" htmlFor="closeTime" error={errors.closeTime?.message}>
          <Input id="closeTime" type="time" {...register('closeTime')} />
        </FormField>
      </div>
      <FormField
        label="Duración base de cita (minutos)"
        htmlFor="slotMinutes"
        error={errors.slotMinutes?.message}
        hint="Usado como base para el grid de la agenda"
      >
        <Select id="slotMinutes" {...register('slotMinutes', { valueAsNumber: true })}>
          {[10, 15, 20, 30, 45, 60].map((n) => (
            <option key={n} value={n}>
              {n} min
            </option>
          ))}
        </Select>
      </FormField>
      <Button type="submit" className="mt-4 w-full">
        Continuar
      </Button>
    </form>
  );
}
