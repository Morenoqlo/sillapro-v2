import { describe, expect, it } from 'vitest';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/features/auth/schemas';

describe('loginSchema', () => {
  it('accepts valid email + password', () => {
    const result = loginSchema.safeParse({
      email: 'dueno@barberia.cl',
      password: 'minimo8caracteres',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'pass1234' });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.cl', password: 'short' });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('accepts valid email + password + confirmation', () => {
    const result = registerSchema.safeParse({
      email: 'dueno@barberia.cl',
      password: 'minimo8caracteres',
      passwordConfirm: 'minimo8caracteres',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when passwords do not match', () => {
    const result = registerSchema.safeParse({
      email: 'dueno@barberia.cl',
      password: 'minimo8caracteres',
      passwordConfirm: 'otraDiferente',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path.join('.'));
      expect(fields).toContain('passwordConfirm');
    }
  });
});

describe('forgotPasswordSchema', () => {
  it('requires only email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.cl' }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('requires password and confirm matching', () => {
    expect(
      resetPasswordSchema.safeParse({
        password: 'minimo8caracteres',
        passwordConfirm: 'minimo8caracteres',
      }).success,
    ).toBe(true);
    expect(
      resetPasswordSchema.safeParse({
        password: 'minimo8caracteres',
        passwordConfirm: 'distinto',
      }).success,
    ).toBe(false);
  });
});
