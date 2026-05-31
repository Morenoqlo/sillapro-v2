import { test, expect } from '@playwright/test';

test('login page renders for unauthenticated user', async ({ page }) => {
  await page.goto('/admin/hoy');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await expect(page.getByLabel('Correo')).toBeVisible();
  await expect(page.getByLabel('Contraseña')).toBeVisible();
});

test('navigation from login to register works', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: 'Crear cuenta' }).click();
  await expect(page).toHaveURL(/\/register/);
  await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toBeVisible();
});

test('navigation from login to forgot password works', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: /olvidaste/i }).click();
  await expect(page).toHaveURL(/\/forgot-password/);
});
