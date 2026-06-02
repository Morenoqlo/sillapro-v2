import { test, expect } from '@playwright/test';
import { adminClient } from './helpers/supabase-admin';
import {
  createTestUser,
  createBarberUser,
  deleteTestUser,
  type TestUser,
} from './helpers/auth-helpers';

// Owner user that sets up the barbershop + barber for the test suite
let owner: TestUser;
// Barber user with role='barber' linked to the owner's barbershop
let barberUser: TestUser;
// IDs needed for cleanup
let shopId: string;
let barberId: string;

test.beforeAll(async () => {
  // Create owner + barbershop setup
  owner = await createTestUser({ onboard: true });

  // Retrieve the barbershop and barber IDs created by onboarding
  const { data: memberships } = await adminClient
    .from('memberships')
    .select('barbershop_id, barber_id')
    .eq('user_id', owner.id)
    .single();
  shopId = (memberships as { barbershop_id: string; barber_id: string }).barbershop_id;
  barberId = (memberships as { barbershop_id: string; barber_id: string }).barber_id;

  // Create a barber user for the same barbershop
  barberUser = await createBarberUser({ barbershopId: shopId, barberId });
});

test.afterAll(async () => {
  // Delete barber user (their membership cascades)
  await adminClient.auth.admin.deleteUser(barberUser.id);
  // Delete owner (cascades barbershop, barbers, services, etc.)
  await deleteTestUser(owner.id);
});

async function loginAs(
  page: import('@playwright/test').Page,
  user: TestUser,
  expectedPath: RegExp,
) {
  await page.goto('/login');
  await page.getByLabel('Correo').fill(user.email);
  await page.getByLabel('Contraseña').fill(user.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(expectedPath, { timeout: 15_000 });
  await page.waitForLoadState('networkidle');
}

test('barber user is automatically redirected to /barbero/mi-dia after login', async ({ page }) => {
  // The barber user logs in → RequireOnboarded detects role=barber on /admin → redirects
  await loginAs(page, barberUser, /\/barbero\/mi-dia/);
  // Barber layout renders with bottom nav
  await expect(page.getByText('Barbero', { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('link', { name: 'Mi día' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Comisiones' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Historial' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mi día' })).toBeVisible();
});

test('barber can navigate to Mis comisiones and see stats', async ({ page }) => {
  await loginAs(page, barberUser, /\/barbero\/mi-dia/);

  await page.getByRole('link', { name: 'Comisiones' }).click();
  await expect(page).toHaveURL(/\/barbero\/comisiones/);
  await expect(page.getByRole('heading', { name: 'Mis comisiones' })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText('Citas este mes')).toBeVisible();
  await expect(page.getByText('Facturado')).toBeVisible();
});

test('barber can navigate to Mi historial', async ({ page }) => {
  await loginAs(page, barberUser, /\/barbero\/mi-dia/);

  await page.getByRole('link', { name: 'Historial' }).click();
  await expect(page).toHaveURL(/\/barbero\/historial/);
  await expect(
    page.getByRole('heading', { name: 'Mi historial' }).or(page.getByText('Sin historial aún')),
  ).toBeVisible({ timeout: 10_000 });
});

test('owner is redirected to /admin/hoy (not /barbero) after login', async ({ page }) => {
  // Verify role routing works in the opposite direction too
  await loginAs(page, owner, /\/admin\/hoy/);
  await expect(page.getByText('Caja del día')).toBeVisible({ timeout: 10_000 });
});
