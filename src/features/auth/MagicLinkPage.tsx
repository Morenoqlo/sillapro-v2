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
import { magicLinkSchema, type MagicLinkInput } from './schemas';

export function MagicLinkPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<MagicLinkInput>({ resolver: zodResolver(magicLinkSchema) });

  async function onSubmit(values: MagicLinkInput) {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
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
        subtitle={`Te enviamos un link mágico a ${getValues('email')}. Haz click y entrarás directo.`}
        footer={
          <Link to="/login" className="font-medium text-brand">
            Volver a iniciar sesión
          </Link>
        }
      >
        <p className="text-sm text-gray-600">El link expira en 1 hora.</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Link por correo"
      subtitle="Te enviamos un link para entrar sin contraseña"
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
