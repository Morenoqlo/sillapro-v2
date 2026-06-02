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

test('user can set a slug during onboarding and access the public booking page', async ({ page }) => {
  // Create a fresh user without onboarding
  const { createTestUser: createFresh, deleteTestUser: deleteFresh } =
    await import('./helpers/auth-helpers');
  const freshUser = await createFresh({ onboard: false });
  const slug = `e2e-slug-${Date.now()}`;

  try {
    await page.goto('/login');
    await page.getByLabel('Correo').fill(freshUser.email);
    await page.getByLabel('Contraseña').fill(freshUser.password);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 });

    // Step 1: shop with slug
    await page.getByLabel('Nombre del local').fill('Test Onboarding Shop');
    await page.getByLabel('URL de reserva (opcional)').fill(slug);
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Step 2: barber
    await expect(page.getByLabel('Nombre', { exact: true })).toBeVisible({ timeout: 5_000 });
    await page.getByLabel('Nombre', { exact: true }).fill('Test Barber Slug');
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Step 3: service
    await expect(page.getByLabel('Nombre', { exact: true })).toBeVisible({ timeout: 5_000 });
    await page.getByLabel('Nombre', { exact: true }).fill('Test Service Slug');
    await page.getByRole('button', { name: 'Crear y empezar' }).click();

    // Lands on /admin/hoy
    await expect(page).toHaveURL(/\/admin\/hoy/, { timeout: 15_000 });

    // Public booking page is accessible via the slug
    await page.goto(`/reservar/${slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Test Onboarding Shop')).toBeVisible();
    await expect(page.getByText('Test Service Slug')).toBeVisible();
  } finally {
    await deleteFresh(freshUser.id);
  }
});
