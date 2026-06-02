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
  await expect(page.getByText('Caja del día')).toBeVisible({ timeout: 10_000 });
  await page.waitForLoadState('networkidle');
}

test('pressing / opens the command palette', async ({ page }) => {
  await login(page);

  // Ensure no input is focused before pressing /
  await page.locator('body').click();
  await page.keyboard.press('/');
  await expect(
    page.getByPlaceholder('Buscar clientes, citas o acciones...'),
  ).toBeVisible({ timeout: 5_000 });

  // Quick actions visible
  await expect(page.getByText('Nueva cita', { exact: true })).toBeVisible();
  await expect(page.getByText('Cobrar', { exact: true })).toBeVisible();

  // Esc closes palette
  await page.keyboard.press('Escape');
  await expect(
    page.getByPlaceholder('Buscar clientes, citas o acciones...'),
  ).not.toBeVisible();
});

test('search button in header opens the command palette', async ({ page }) => {
  await login(page);

  // The search button has title="Buscar (/)" — locate by title attribute
  await page.locator('button[title="Buscar (/)"]').click();
  await expect(
    page.getByPlaceholder('Buscar clientes, citas o acciones...'),
  ).toBeVisible({ timeout: 5_000 });
  await page.keyboard.press('Escape');
  await expect(
    page.getByPlaceholder('Buscar clientes, citas o acciones...'),
  ).not.toBeVisible();
});

test('pressing N opens the new appointment modal', async ({ page }) => {
  await login(page);

  // Click body to make sure no input is focused
  await page.locator('body').click();
  await page.keyboard.press('n');
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Nueva cita' }),
  ).toBeVisible({ timeout: 5_000 });

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5_000 });
});
