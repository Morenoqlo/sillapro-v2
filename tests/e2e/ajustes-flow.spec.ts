import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, type TestUser } from './helpers/auth-helpers';

let user: TestUser;

test.beforeAll(async () => {
  user = await createTestUser({ onboard: true });
});

test.afterAll(async () => {
  await deleteTestUser(user.id);
});

async function loginAndGoToAjustes(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Correo').fill(user.email);
  await page.getByLabel('Contraseña').fill(user.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/admin\/hoy/, { timeout: 10_000 });
  await page.waitForLoadState('networkidle');
  // Navigate directly — avoids extra click timing issues
  await page.goto('/admin/ajustes');
  // Wait for useTenant + useShopSettings to resolve and form to mount
  await expect(page.getByLabel('Nombre del local')).toBeVisible({ timeout: 20_000 });
}

test('admin can view and edit shop name', async ({ page }) => {
  await loginAndGoToAjustes(page);

  // Section headings confirm form is mounted
  await expect(page.getByText('Datos generales')).toBeVisible();
  await expect(page.getByText('Horario de atención')).toBeVisible();

  // Current shop name pre-populated (from onboarding: "Test Shop ...")
  const nameInput = page.getByLabel('Nombre del local');
  const currentName = await nameInput.inputValue();
  expect(currentName).toContain('Test Shop');

  // Edit the name and save
  const newName = `Barbería E2E ${Date.now()}`;
  await nameInput.fill(newName);
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Ajustes guardados')).toBeVisible({ timeout: 10_000 });

  // The saved name persists after a reload
  await page.reload();
  await expect(page.getByLabel('Nombre del local')).toHaveValue(newName, { timeout: 20_000 });
});

test('admin can update shop opening hours', async ({ page }) => {
  await loginAndGoToAjustes(page);

  // Change opening and closing time
  await page.getByLabel('Abre').fill('08:00');
  await page.getByLabel('Cierra').fill('21:00');

  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Ajustes guardados')).toBeVisible({ timeout: 10_000 });

  // Persists after reload
  await page.reload();
  await expect(page.getByLabel('Abre')).toHaveValue('08:00', { timeout: 20_000 });
  await expect(page.getByLabel('Cierra')).toHaveValue('21:00');
});
