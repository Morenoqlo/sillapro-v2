import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { authErrorToSpanish } from '@/lib/auth-errors';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { FormField } from '@/ui/FormField';
import { AuthCard } from './AuthCard';
import { registerSchema, type RegisterInput } from './schemas';

export function RegisterPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(authErrorToSpanish(error));
      return;
    }
    if (data.session) {
      navigate('/onboarding', { replace: true });
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthCard
        title="Revisa tu correo"
        subtitle={`Te enviamos un link de confirmación a ${getValues('email')}. Haz click en el link para activar tu cuenta.`}
        footer={
          <>
            ¿No te llegó? <Link to="/register" className="font-medium text-brand">Volver a intentar</Link>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Una vez confirmado, podrás entrar y configurar tu barbería.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Crear cuenta"
      subtitle="14 días gratis. Sin tarjeta."
      footer={
        <>
          ¿Ya tienes cuenta? <Link to="/login" className="font-medium text-brand">Iniciar sesión</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="Correo" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
        </FormField>
        <FormField
          label="Contraseña"
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
          {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>
      </form>
    </AuthCard>
  );
}
