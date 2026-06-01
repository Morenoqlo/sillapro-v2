/* eslint-disable react-hooks/incompatible-library -- react-hook-form's `watch` is not compatible with React Compiler; functionality is correct */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Dialog } from '@/ui/Dialog';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { Select } from '@/ui/Select';
import { FormField } from '@/ui/FormField';
import { formatCLP } from '@/lib/money';
import { todayBusinessDate } from '@/lib/dates';
import { useServices } from '@/features/servicios/hooks/useServices';
import { useBarbers } from '@/features/equipo/hooks/useBarbers';
import { ClientCombobox } from './ClientCombobox';
import { appointmentFormSchema, type AppointmentFormInput } from './schemas';
import { useAppointmentMutations } from './hooks/useAppointmentMutations';
import type { AppointmentWithRefs } from './types';

export interface PrefilledSlot {
  date?: string;
  time?: string;
  barberId?: string;
}

interface NewAppointmentModalProps {
  appointment: AppointmentWithRefs | null;
  prefilled?: PrefilledSlot;
  onClose: () => void;
}

export function NewAppointmentModal({ appointment, prefilled, onClose }: NewAppointmentModalProps) {
  const { create, update } = useAppointmentMutations();
  const { list: servicesQ } = useServices();
  const { list: barbersQ } = useBarbers();
  const [selectedClient, setSelectedClient] = useState<{ id: string; full_name: string } | null>(
    appointment?.client
      ? { id: appointment.client.id, full_name: appointment.client.full_name }
      : null,
  );

  const activeServices = (servicesQ.data ?? []).filter((s) => s.active);
  const activeBarbers = (barbersQ.data ?? []).filter((b) => b.active);

  const startsAt = appointment ? new Date(appointment.starts_at) : null;
  const defaultDate = appointment
    ? todayBusinessDate(startsAt!)
    : (prefilled?.date ?? todayBusinessDate());
  const defaultTime = appointment
    ? new Intl.DateTimeFormat('es-CL', {
        timeZone: 'America/Santiago',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(startsAt!)
    : (prefilled?.time ?? '');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AppointmentFormInput>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      clientId: appointment?.client_id ?? '',
      serviceId: appointment?.service_id ?? '',
      barberId: appointment?.barber_id ?? prefilled?.barberId ?? '',
      date: defaultDate,
      time: defaultTime,
      note: appointment?.note ?? '',
    },
  });

  const selectedServiceId = watch('serviceId');
  const selectedService = activeServices.find((s) => s.id === selectedServiceId);

  async function onSubmit(values: AppointmentFormInput) {
    if (!selectedService) {
      toast.error('Selecciona un servicio');
      return;
    }
    try {
      if (appointment) {
        await update.mutateAsync({
          ...values,
          id: appointment.id,
          servicePriceAmount: selectedService.price_amount,
          serviceCommissionPercent: selectedService.commission_percent,
          serviceDurationMinutes: selectedService.duration_minutes,
        });
        toast.success('Cita actualizada');
      } else {
        await create.mutateAsync({
          ...values,
          servicePriceAmount: selectedService.price_amount,
          serviceCommissionPercent: selectedService.commission_percent,
          serviceDurationMinutes: selectedService.duration_minutes,
        });
        toast.success('Cita creada');
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      if (msg.includes('exclusion') || msg.includes('overlap')) {
        toast.error('Este barbero ya tiene otra cita en ese horario');
      } else {
        toast.error(msg);
      }
    }
  }

  const submitting = create.isPending || update.isPending;

  return (
    <Dialog open onClose={onClose} title={appointment ? 'Editar cita' : 'Nueva cita'}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="Cliente" htmlFor="clientId" error={errors.clientId?.message}>
          <ClientCombobox
            value={watch('clientId')}
            initialDisplayName={appointment?.client?.full_name ?? ''}
            onChange={(id, client) => {
              setValue('clientId', id, { shouldValidate: true });
              setSelectedClient({ id, full_name: client.full_name });
            }}
          />
          {selectedClient && (
            <p className="mt-1 text-xs text-gray-500">Seleccionado: {selectedClient.full_name}</p>
          )}
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Servicio" htmlFor="serviceId" error={errors.serviceId?.message}>
            <Select id="serviceId" {...register('serviceId')}>
              <option value="">Selecciona...</option>
              {activeServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {formatCLP(s.price_amount)} · {s.duration_minutes}min
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Barbero" htmlFor="barberId" error={errors.barberId?.message}>
            <Select id="barberId" {...register('barberId')}>
              <option value="">Selecciona...</option>
              {activeBarbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.full_name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Fecha" htmlFor="date" error={errors.date?.message}>
            <Input id="date" type="date" {...register('date')} />
          </FormField>
          <FormField label="Hora" htmlFor="time" error={errors.time?.message}>
            <Input id="time" type="time" {...register('time')} />
          </FormField>
        </div>

        <FormField label="Nota (opcional)" htmlFor="note" error={errors.note?.message}>
          <Input id="note" placeholder="Detalles para el barbero..." {...register('note')} />
        </FormField>

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar cita'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
