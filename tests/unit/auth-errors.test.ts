import { describe, it, expect } from 'vitest';
import { authErrorToSpanish } from '@/lib/auth-errors';

describe('authErrorToSpanish', () => {
  it('returns fallback for null/undefined', () => {
    expect(authErrorToSpanish(null)).toBe('Algo salió mal. Inténtalo de nuevo.');
    expect(authErrorToSpanish(undefined)).toBe('Algo salió mal. Inténtalo de nuevo.');
  });

  describe('login errors', () => {
    it('maps invalid credentials', () => {
      const out = authErrorToSpanish({ message: 'Invalid login credentials' });
      expect(out).toBe('Correo o contraseña incorrectos.');
    });

    it('maps email not confirmed', () => {
      const out = authErrorToSpanish({ message: 'Email not confirmed' });
      expect(out).toMatch(/Confirma tu correo/);
    });

    it('maps user not found', () => {
      const out = authErrorToSpanish({ message: 'User not found' });
      expect(out).toMatch(/No encontramos/);
    });
  });

  describe('registration errors', () => {
    it('maps already-registered', () => {
      expect(authErrorToSpanish({ message: 'User already registered' })).toMatch(
        /Ya existe una cuenta/,
      );
      expect(authErrorToSpanish({ message: 'email already exists' })).toMatch(
        /Ya existe una cuenta/,
      );
    });

    it('maps password too short', () => {
      const out = authErrorToSpanish({
        message: 'Password should be at least 6 characters',
      });
      expect(out).toMatch(/al menos 8 caracteres/);
    });

    it('maps signup disabled', () => {
      const out = authErrorToSpanish({ message: 'Signup is disabled' });
      expect(out).toMatch(/no estamos aceptando/);
    });
  });

  describe('rate limit + tokens', () => {
    it('maps rate limit', () => {
      const out = authErrorToSpanish({ message: 'Email rate limit exceeded' });
      expect(out).toMatch(/Demasiados intentos/);
    });

    it('maps too many requests', () => {
      const out = authErrorToSpanish({ message: 'Too many requests' });
      expect(out).toMatch(/Demasiados intentos/);
    });

    it('maps expired token', () => {
      const out = authErrorToSpanish({ message: 'Token has expired' });
      expect(out).toMatch(/expiró/);
    });
  });

  describe('reservation errors (book_appointment_public)', () => {
    it('maps shop closed', () => {
      const out = authErrorToSpanish({ message: 'Shop is closed on 2026-06-15' });
      expect(out).toMatch(/cerrado/);
    });

    it('maps slot overlap', () => {
      const out = authErrorToSpanish({ message: 'overlap detected' });
      expect(out).toMatch(/horario ya fue reservado/);
    });

    it('passes through Spanish messages from the RPC', () => {
      const out = authErrorToSpanish({
        message: 'Demasiadas reservas recientes desde este teléfono. Espera 1 hora.',
      });
      expect(out).toMatch(/Demasiadas reservas/);
    });
  });

  describe('network + permissions', () => {
    it('maps fetch failure', () => {
      const out = authErrorToSpanish({ message: 'Failed to fetch' });
      expect(out).toMatch(/No pudimos conectarnos/);
    });

    it('maps 401 status', () => {
      const out = authErrorToSpanish({ status: 401, message: 'unauthorized' });
      expect(out).toMatch(/No tienes permiso/);
    });

    it('maps "not authenticated"', () => {
      const out = authErrorToSpanish({ message: 'Not authenticated' });
      expect(out).toMatch(/No tienes permiso/);
    });
  });

  describe('fallback (no English leak)', () => {
    it('returns generic Spanish for unknown messages', () => {
      // This is the key safety property: if a new Supabase error message
      // appears that we haven't mapped, we never show the raw English to
      // the user. The fallback is in Spanish.
      const cases = [
        'Something obscure went wrong with FooBarBaz',
        'PGRST116: row not found',
        'AuthApiError: requested path is not found',
      ];
      for (const c of cases) {
        const out = authErrorToSpanish({ message: c });
        expect(out).toBe('Algo salió mal. Inténtalo de nuevo.');
        // Belt-and-suspenders: never contains the raw English fragment
        expect(out).not.toContain('FooBarBaz');
        expect(out).not.toContain('PGRST');
        expect(out).not.toContain('AuthApiError');
      }
    });

    it('returns fallback for empty message', () => {
      expect(authErrorToSpanish({ message: '' })).toBe('Algo salió mal. Inténtalo de nuevo.');
    });
  });
});
