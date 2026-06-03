import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, type TestUser } from './helpers/auth-helpers';

let user: TestUser;

test.beforeAll(async () => {
  user = await createTestUser({ onboard: true });
});

test.afterAll(async () => {
  await deleteTestUser(user.id);
});

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Correo').fill(user.email);
  await page.getByLabel('Contraseña').fill(user.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/admin\/hoy/, { timeout: 10_000 });
  await page.waitForLoadState('networkidle');
}

test('reportes page renders with range toggle and summary KPIs', async ({ page }) => {
  await login(page);

  await page.getByRole('link', { name: 'Reportes' }).click();
  await expect(page).toHaveURL(/\/admin\/reportes/);
  await page.waitForLoadState('networkidle');

  // Range toggle buttons visible
  await expect(page.getByRole('button', { name: 'Esta semana' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: 'Este mes' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Últimos 30 días' })).toBeVisible();

  // KPI cards
  await expect(page.getByText('Ingresos del local')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Comisiones', { exact: true })).toBeVisible();
  await expect(page.getByText('Citas completadas')).toBeVisible();

  // Section labels for charts and tables
  await expect(page.getByText('Ingresos diarios')).toBeVisible();
  await expect(page.getByText('Comisiones por barbero')).toBeVisible();
  await expect(page.getByText('Top servicios')).toBeVisible();
  await expect(page.getByText('Clientes frecuentes')).toBeVisible();
});

test('range toggle switches period without errors', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Reportes' }).click();
  await expect(page).toHaveURL(/\/admin\/reportes/);
  await expect(page.getByText('Ingresos del local')).toBeVisible({ timeout: 10_000 });

  // Switch to Este mes
  await page.getByRole('button', { name: 'Este mes' }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Ingresos del local')).toBeVisible();

  // Switch to Últimos 30 días
  await page.getByRole('button', { name: 'Últimos 30 días' }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Ingresos del local')).toBeVisible();

  // Switch back to Esta semana
  await page.getByRole('button', { name: 'Esta semana' }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Ingresos del local')).toBeVisible();
});
