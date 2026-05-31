import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { FormField } from '@/ui/FormField';
import { AuthCard } from './AuthCard';
import { resetPasswordSchema, type ResetPasswordInput } from './schemas';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordInput) {
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Contraseña actualizada');
    navigate('/admin', { replace: true });
  }

  return (
    <AuthCard title="Nueva contraseña" subtitle="Elige una nueva contraseña para tu cuenta">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField
          label="Nueva contraseña"
          htmlFor="password"
          error={errors.password?.message}
          hint="Mínimo 8 caracteres"
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
          />
        </FormField>
        <FormField
          label="Confirmar contraseña"
          htmlFor="passwordConfirm"
          error={errors.passwordConfirm?.message}
        >
          <Input
            id="passwordConfirm"
            type="password"
            autoComplete="new-password"
            {...register('passwordConfirm')}
          />
        </FormField>
        <Button type="submit" className="mt-4 w-full" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar contraseña'}
        </Button>
      </form>
    </AuthCard>
  );
}
