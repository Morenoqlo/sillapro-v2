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

test('client detail page shows metrics and history', async ({ page }) => {
  const stamp = Date.now();
  const clientName = `Detail E2E ${stamp}`;

  await login(page);

  // Create a client via + Cita modal (just fill name and cancel)
  await page.getByRole('button', { name: '+ Cita' }).click();
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Nueva cita' }),
  ).toBeVisible();
  await page.waitForLoadState('networkidle');

  const comboInput = page
    .getByRole('dialog')
    .getByPlaceholder('Buscar por nombre o teléfono...');
  await comboInput.fill(clientName);
  await page.getByRole('button', { name: `+ Crear "${clientName}"` }).click();
  await expect(page.getByText(/creado/i)).toBeVisible({ timeout: 10_000 });
  // Close modal without saving
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5_000 });

  // Navigate to Clientes list
  await page.getByRole('link', { name: 'Clientes' }).click();
  await expect(page).toHaveURL(/\/admin\/clientes$/);
  await page.waitForLoadState('networkidle');

  // Find the client row and click "Ver detalle"
  await expect(page.getByText(clientName)).toBeVisible({ timeout: 10_000 });
  await page
    .getByRole('row')
    .filter({ hasText: clientName })
    .getByRole('link', { name: 'Ver detalle' })
    .click();

  await expect(page).toHaveURL(/\/admin\/clientes\/.+/);
  await expect(page.getByRole('heading', { level: 2 }).filter({ hasText: clientName })).toBeVisible({
    timeout: 10_000,
  });

  // Metrics cards
  await expect(page.getByText('Visitas')).toBeVisible();
  await expect(page.getByText('Ticket promedio')).toBeVisible();

  // Back button returns to list
  await page.getByRole('button', { name: '← Clientes' }).click();
  await expect(page).toHaveURL(/\/admin\/clientes$/);
});

test('barber detail page shows month stats and services tab', async ({ page }) => {
  await login(page);

  // Navigate to Equipo
  await page.getByRole('link', { name: 'Equipo' }).click();
  await expect(page).toHaveURL(/\/admin\/equipo$/);
  await page.waitForLoadState('networkidle');

  // Click "Ver detalle" on the seeded barber (Test Barber from onboarding)
  await expect(page.getByText('Test Barber')).toBeVisible({ timeout: 10_000 });
  await page
    .getByRole('row')
    .filter({ hasText: 'Test Barber' })
    .getByRole('link', { name: 'Ver detalle' })
    .click();

  await expect(page).toHaveURL(/\/admin\/equipo\/.+/);
  await expect(page.getByRole('heading', { level: 2 }).filter({ hasText: 'Test Barber' })).toBeVisible({
    timeout: 10_000,
  });

  // Stats cards (exact: true avoids matching EmptyState "Sin citas este mes")
  await expect(page.getByText('Citas este mes', { exact: true })).toBeVisible();
  await expect(page.getByText('Comisiones', { exact: true })).toBeVisible();

  // Switch to Services tab and see Test Service
  await page.getByRole('button', { name: 'Servicios asignados' }).click();
  await expect(page.getByText('Test Service')).toBeVisible({ timeout: 10_000 });

  // Back button returns to list
  await page.getByRole('button', { name: '← Equipo' }).click();
  await expect(page).toHaveURL(/\/admin\/equipo$/);
});
