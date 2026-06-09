/**
 * Mapeo de errores de Supabase / RPCs a mensajes en español user-friendly.
 *
 * Por qué: hasta ahora mostrábamos `error.message` raw al usuario. Eso filtra
 * detalles técnicos en inglés ("Invalid login credentials", "AuthApiError",
 * códigos PG). Mala UX y leak menor de info interna.
 *
 * Estrategia: pattern-match defensivo. Si el mensaje no matchea, devolvemos
 * un fallback genérico — no propagamos texto técnico al user.
 */

interface ErrorLike {
  message?: string;
  code?: string;
  status?: number;
}

/**
 * Translates a Supabase Auth error (or any error with a message) to Spanish.
 * Returns a fallback message when no specific match is found instead of
 * leaking the raw English text.
 */
export function authErrorToSpanish(err: unknown): string {
  if (!err) return 'Algo salió mal. Inténtalo de nuevo.';

  const e = err as ErrorLike;
  const raw = (e.message ?? '').toLowerCase();

  // Login / credentials
  if (raw.includes('invalid login credentials') || raw.includes('invalid email or password')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (raw.includes('email not confirmed')) {
    return 'Confirma tu correo antes de entrar. Revisa tu bandeja de entrada (y spam).';
  }
  if (raw.includes('user not found') || raw.includes('user does not exist')) {
    return 'No encontramos una cuenta con ese correo.';
  }

  // Registro
  if (
    raw.includes('user already registered') ||
    raw.includes('already registered') ||
    raw.includes('email already exists')
  ) {
    return 'Ya existe una cuenta con este correo. ¿Olvidaste tu contraseña?';
  }
  if (raw.includes('password') && (raw.includes('short') || raw.includes('at least'))) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (raw.includes('signup is disabled') || raw.includes('signups not allowed')) {
    return 'Por ahora no estamos aceptando registros nuevos.';
  }

  // Rate limit / abuso
  if (raw.includes('rate limit') || raw.includes('too many requests')) {
    return 'Demasiados intentos. Espera unos minutos e intenta de nuevo.';
  }

  // Tokens / sesión
  if (raw.includes('expired') || raw.includes('invalid token')) {
    return 'El link expiró o ya fue usado. Pide uno nuevo.';
  }
  if (raw.includes('session') && raw.includes('not')) {
    return 'Tu sesión venció. Vuelve a iniciar sesión.';
  }

  // Formato email
  if (raw.includes('invalid email') || raw.includes('email format')) {
    return 'El correo no tiene un formato válido.';
  }

  // Network
  if (raw.includes('failed to fetch') || raw.includes('network')) {
    return 'No pudimos conectarnos. Revisa tu internet e intenta de nuevo.';
  }

  // Permisos
  if (raw.includes('not authenticated') || raw.includes('access denied') || e.status === 401) {
    return 'No tienes permiso para hacer esto.';
  }

  // Reservation-specific (book_appointment_public)
  if (raw.includes('demasiadas reservas') || raw.includes('demasiados intentos')) {
    // Already in Spanish from the RPC — pass through.
    return e.message!;
  }
  if (raw.includes('shop is closed')) {
    return 'El local está cerrado ese día. Elige otra fecha.';
  }
  if (raw.includes('overlap') || raw.includes('exclusion')) {
    return 'Ese horario ya fue reservado. Por favor elige otro.';
  }
  if (raw.includes('service not found') || raw.includes('barbershop not found')) {
    return 'El servicio o local no está disponible.';
  }

  // Fallback genérico — NO devolvemos err.message para no filtrar inglés / detalles
  return 'Algo salió mal. Inténtalo de nuevo.';
}
