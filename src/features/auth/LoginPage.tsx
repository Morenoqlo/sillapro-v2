import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { FormField } from '@/ui/FormField';
import { AuthCard } from './AuthCard';
import { loginSchema, type LoginInput } from './schemas';

export function LoginPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    setSubmitting(false);
    if (error) {
      toast.error('Correo o contraseña incorrectos');
      return;
    }
    navigate('/admin', { replace: true });
  }

  return (
    <AuthCard
      title="Iniciar sesión"
      subtitle="Entra a tu consola SillaPro"
      footer={
        <>
          ¿Sin cuenta? <Link to="/register" className="font-medium text-brand">Crear cuenta</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="Correo" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="dueno@barberia.cl"
            {...register('email')}
          />
        </FormField>
        <FormField label="Contraseña" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
        </FormField>
        <div className="mt-2 text-right text-sm">
          <Link to="/forgot-password" className="text-brand">¿Olvidaste tu contraseña?</Link>
        </div>
        <Button type="submit" className="mt-4 w-full" disabled={submitting}>
          {submitting ? 'Entrando...' : 'Entrar'}
        </Button>
        <div className="my-4 text-center text-xs text-gray-500">o</div>
        <Link to="/magic-link" className="block">
          <Button type="button" variant="secondary" className="w-full">
            Recibir link por correo
          </Button>
        </Link>
      </form>
    </AuthCard>
  );
}
