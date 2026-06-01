import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, type TestUser } from './helpers/auth-helpers';

let user: TestUser;

test.beforeAll(async () => {
  user = await createTestUser({ onboard: true });
});

test.afterAll(async () => {
  await deleteTestUser(user.id);
});

async function loginAsBarber(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Correo').fill(user.email);
  await page.getByLabel('Contraseña').fill(user.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  // Owner defaults to /admin — navigate to /barbero manually
  await expect(page).toHaveURL(/\/admin\/hoy/, { timeout: 10_000 });
  await page.goto('/barbero/mi-dia');
  await expect(page).toHaveURL(/\/barbero\/mi-dia/, { timeout: 5_000 });
  await page.waitForLoadState('networkidle');
}

test('barber Mi día page renders with shop name header and bottom nav', async ({ page }) => {
  await loginAsBarber(page);

  // Header shows "Barbero" label
  await expect(page.getByText('Barbero', { exact: true })).toBeVisible({ timeout: 10_000 });
  // Bottom nav tabs
  await expect(page.getByRole('link', { name: 'Mi día' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Comisiones' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Historial' })).toBeVisible();
  // Page heading
  await expect(page.getByRole('heading', { name: 'Mi día' })).toBeVisible({ timeout: 10_000 });
});

test('barber can navigate to Mis comisiones and see stats', async ({ page }) => {
  await loginAsBarber(page);

  await page.getByRole('link', { name: 'Comisiones' }).click();
  await expect(page).toHaveURL(/\/barbero\/comisiones/);
  await expect(page.getByRole('heading', { name: 'Mis comisiones' })).toBeVisible({
    timeout: 10_000,
  });
  // Stats cards appear — use role heading to avoid strict mode violation
  // ("Mis comisiones" appears in both the h2 and a card label)
  await expect(page.getByRole('heading', { name: 'Mis comisiones' })).toBeVisible();
  await expect(page.getByText('Citas este mes')).toBeVisible();
  await expect(page.getByText('Facturado')).toBeVisible();
});

test('barber can navigate to Mi historial', async ({ page }) => {
  await loginAsBarber(page);

  await page.getByRole('link', { name: 'Historial' }).click();
  await expect(page).toHaveURL(/\/barbero\/historial/);
  // Page shows either the h2 (with data) or the EmptyState (without data).
  // Either way, loading is done when either element is visible.
  await expect(
    page.getByRole('heading', { name: 'Mi historial' }).or(
      page.getByText('Sin historial aún'),
    ),
  ).toBeVisible({ timeout: 10_000 });
});
