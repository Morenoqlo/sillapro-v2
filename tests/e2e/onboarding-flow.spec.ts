import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, type TestUser } from './helpers/auth-helpers';

let user: TestUser;

test.beforeAll(async () => {
  // Usuario sin onboarding (no tiene barbería todavía)
  user = await createTestUser({ onboard: false });
});

test.afterAll(async () => {
  await deleteTestUser(user.id);
});

test('newly registered user is redirected to /onboarding from /admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Correo').fill(user.email);
  await page.getByLabel('Contraseña').fill(user.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 });
  await expect(page.getByText('Vamos a configurar tu barbería')).toBeVisible();
});

test('user completes the 3-step wizard and lands on /admin/hoy', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Correo').fill(user.email);
  await page.getByLabel('Contraseña').fill(user.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 });

  // Step 1: shop
  await page.getByLabel('Nombre del local').fill('Test Wizard Shop');
  await page.getByRole('button', { name: 'Continuar' }).click();

  // Step 2: barber (label is just "Nombre")
  await expect(page.getByLabel('Nombre', { exact: true })).toBeVisible();
  await page.getByLabel('Nombre', { exact: true }).fill('Diego Test');
  await page.getByRole('button', { name: 'Continuar' }).click();

  // Step 3: service (same label "Nombre")
  await expect(page.getByLabel('Nombre', { exact: true })).toBeVisible();
  await page.getByLabel('Nombre', { exact: true }).fill('Corte Test');
  await page.getByRole('button', { name: 'Crear y empezar' }).click();

  // Should redirect to /admin/hoy
  await expect(page).toHaveURL(/\/admin\/hoy/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Hoy' })).toBeVisible();
});
