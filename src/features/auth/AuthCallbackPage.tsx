import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const errorDesc = params.get('error_description');
    if (errorDesc) {
      navigate(`/login?error=${encodeURIComponent(errorDesc)}`, { replace: true });
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      const type = new URLSearchParams(window.location.hash.slice(1)).get('type');
      if (type === 'recovery') {
        navigate('/reset-password', { replace: true });
        return;
      }
      if (data.session) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    });
  }, [navigate, params]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-500">Procesando...</p>
    </div>
  );
}
