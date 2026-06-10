import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { authErrorToSpanish } from '@/lib/auth-errors';

interface InviteInfo {
  barbershop: { name: string } | null;
  barber: { full_name: string } | null;
}

export function UnirsePage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvite() {
      if (!token) {
        setInviteError('Token inválido');
        setLoadingInvite(false);
        return;
      }
      // Uses get_public_invite_info RPC (SECURITY DEFINER).
      // The previous approach selected from `barber_invites` directly, which
      // — combined with an over-permissive policy — let any anon enumerate
      // every valid token in the system.
      const { data, error } = await supabase.rpc('get_public_invite_info', {
        p_token: token,
      });
      setLoadingInvite(false);
      const row = Array.isArray(data) ? data[0] : data;
      if (error || !row) {
        setInviteError('Invitación no válida o ya utilizada.');
        return;
      }
      const typed = row as { barbershop_name: string; barber_name: string };
      setInvite({
        barbershop: { name: typed.barbershop_name },
        barber: { full_name: typed.barber_name },
      });
    }
    void loadInvite();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { error } = await supabase.rpc('accept_barber_invite', { p_token: token });
      if (!error) {
        navigate('/barbero/mi-dia', { replace: true });
      } else if (error.message.includes('already has access')) {
        navigate('/barbero/mi-dia', { replace: true });
      }
    });
  }, [token, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setFormError('Completa todos los campos.');
      return;
    }
    if (password.length < 8) {
      setFormError('Mínimo 8 caracteres.');
      return;
    }
    setSubmitting(true);
    setFormError(null);

    const { error: signUpErr } = await supabase.auth.signUp({ email, password });
    if (signUpErr) {
      setFormError(authErrorToSpanish(signUpErr));
      setSubmitting(false);
      return;
    }

    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) {
      setFormError('Cuenta creada. Revisa tu correo para confirmarla, luego vuelve aquí con el mismo link.');
      setSubmitting(false);
      return;
    }

    const { error: acceptErr } = await supabase.rpc('accept_barber_invite', { p_token: token });
    if (acceptErr) {
      setFormError(authErrorToSpanish(acceptErr));
      setSubmitting(false);
      return;
    }

    navigate('/barbero/mi-dia', { replace: true });
  }

  if (loadingInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Cargando invitación...</p>
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-900">Invitación no válida</p>
          <p className="mt-2 text-gray-500">{inviteError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-2xl font-bold text-brand">SillaPro</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Unirte a tu equipo</h1>
          {invite && (
            <div className="mt-2 rounded-md bg-brand/5 px-3 py-2 text-sm">
              <p className="font-semibold text-brand">{invite.barbershop?.name}</p>
              <p className="text-gray-600">Perfil: {invite.barber?.full_name}</p>
            </div>
          )}
          <p className="mt-3 text-sm text-gray-500">
            Crea tu cuenta para acceder a tu agenda como barbero.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Correo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.cl"
                maxLength={100}
                autoComplete="email"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                maxLength={72}
                autoComplete="new-password"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
              />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? 'Creando cuenta...' : 'Crear cuenta y unirme'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
