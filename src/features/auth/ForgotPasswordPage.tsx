import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { FormField } from '@/ui/FormField';
import { AuthCard } from './AuthCard';
import { forgotPasswordSchema, type ForgotPasswordInput } from './schemas';

export function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthCard
        title="Revisa tu correo"
        subtitle={`Te enviamos un link para restablecer tu contraseña a ${getValues('email')}.`}
        footer={
          <Link to="/login" className="font-medium text-brand">
            Volver a iniciar sesión
          </Link>
        }
      >
        <p className="text-sm text-gray-600">
          Haz click en el link y elige una nueva contraseña.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Recuperar contraseña"
      subtitle="Ingresa tu correo y te enviamos un link"
      footer={
        <Link to="/login" className="font-medium text-brand">
          Volver a iniciar sesión
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="Correo" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
        </FormField>
        <Button type="submit" className="mt-4 w-full" disabled={submitting}>
          {submitting ? 'Enviando...' : 'Enviar link'}
        </Button>
      </form>
    </AuthCard>
  );
}
