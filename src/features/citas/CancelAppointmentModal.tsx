import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Dialog } from '@/ui/Dialog';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { FormField } from '@/ui/FormField';
import { cancelReasonSchema, type CancelReasonInput } from './schemas';
import { useAppointmentMutations } from './hooks/useAppointmentMutations';

interface CancelAppointmentModalProps {
  appointmentId: string;
  onClose: () => void;
  onDone: () => void;
}

export function CancelAppointmentModal({
  appointmentId,
  onClose,
  onDone,
}: CancelAppointmentModalProps) {
  const { cancel } = useAppointmentMutations();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CancelReasonInput>({
    resolver: zodResolver(cancelReasonSchema),
    defaultValues: { reason: '' },
  });

  async function onSubmit(values: CancelReasonInput) {
    try {
      await cancel.mutateAsync({ id: appointmentId, reason: values.reason });
      toast.success('Cita cancelada');
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  }

  return (
    <Dialog open onClose={onClose} title="Cancelar cita">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <p className="mb-3 text-sm text-gray-600">
          La cita pasará a estado "Cancelada". Esta acción se registra en auditoría.
        </p>
        <FormField label="Razón" htmlFor="reason" error={errors.reason?.message}>
          <Input
            id="reason"
            placeholder="Cliente avisó, doble reserva, etc."
            {...register('reason')}
          />
        </FormField>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={cancel.isPending}
          >
            Volver
          </Button>
          <Button type="submit" variant="danger" disabled={cancel.isPending}>
            {cancel.isPending ? 'Cancelando...' : 'Cancelar cita'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
