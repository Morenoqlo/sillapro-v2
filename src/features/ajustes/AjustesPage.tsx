import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { Select } from '@/ui/Select';
import { FormField } from '@/ui/FormField';
import { useShopSettings, useUpdateShopSettings } from './hooks/useShopSettings';
import { shopSettingsSchema, type ShopSettingsInput } from './schemas';

const TIMEZONES = ['America/Santiago', 'America/Punta_Arenas', 'Pacific/Easter'];

function AjustesForm({ initial }: { initial: ShopSettingsInput }) {
  const update = useUpdateShopSettings();
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ShopSettingsInput>({
    resolver: zodResolver(shopSettingsSchema),
    defaultValues: initial,
  });

  async function onSubmit(values: ShopSettingsInput) {
    try {
      await update.mutateAsync(values);
      toast.success('Ajustes guardados');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* Datos generales */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Datos generales
        </h3>
        <FormField label="Nombre del local" htmlFor="name" error={errors.name?.message}>
          <Input id="name" {...register('name')} />
        </FormField>
        <FormField
          label="Slug (URL pública)"
          htmlFor="slug"
          error={errors.slug?.message}
          hint={
            initial.slug
              ? `Tu URL de reserva será /reservar/${initial.slug}`
              : 'Ej: norte-fino — se usará en tu URL de reserva pública'
          }
        >
          <Input
            id="slug"
            placeholder="norte-fino"
            {...register('slug', {
              setValueAs: (v: unknown) => {
                if (v === null || v === undefined) return null;
                const s = String(v).trim();
                return s === '' ? null : s;
              },
            })}
          />
        </FormField>
        <FormField
          label="Teléfono del local (WhatsApp)"
          htmlFor="phone"
          error={errors.phone?.message}
          hint="Con código de país. Ej: +56912345678 — para recibir notificaciones de reservas."
        >
          <Input id="phone" type="tel" placeholder="+56912345678" {...register('phone')} />
        </FormField>
      </Card>

      {/* Horario de atención */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Horario de atención
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Abre" htmlFor="openTime" error={errors.openTime?.message}>
            <Input id="openTime" type="time" {...register('openTime')} />
          </FormField>
          <FormField label="Cierra" htmlFor="closeTime" error={errors.closeTime?.message}>
            <Input id="closeTime" type="time" {...register('closeTime')} />
          </FormField>
        </div>
        <FormField
          label="Duración base de slot (minutos)"
          htmlFor="slotMinutes"
          error={errors.slotMinutes?.message}
          hint="Controla el grid de la agenda y los huecos libres visibles."
        >
          <Select id="slotMinutes" {...register('slotMinutes', { valueAsNumber: true })}>
            {[10, 15, 20, 30, 45, 60].map((n) => (
              <option key={n} value={n}>
                {n} min
              </option>
            ))}
          </Select>
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
      </Card>

      {/* Métodos de pago — stub */}
      <Card className="opacity-60">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Métodos de pago aceptados
        </h3>
        <p className="text-sm text-gray-400">
          Efectivo · Tarjeta · Transferencia — configuración disponible próximamente.
        </p>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={!isDirty || update.isPending}>
          {update.isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}

export function AjustesPage() {
  const { query } = useShopSettings();

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-gray-500">Configuración</p>
        <h2 className="text-2xl font-bold text-gray-900">Ajustes</h2>
      </div>

      {query.isLoading && <p className="text-sm text-gray-500">Cargando ajustes...</p>}

      {query.data && (
        <AjustesForm
          initial={{
            name: query.data.name,
            slug: query.data.slug,
            timezone: query.data.timezone,
            openTime: query.data.open_time,
            closeTime: query.data.close_time,
            slotMinutes: query.data.slot_minutes,
            phone: query.data.phone,
          }}
        />
      )}
    </div>
  );
}
