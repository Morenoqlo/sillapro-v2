import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, todayInSantiago, type TestUser } from './helpers/auth-helpers';

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

async function createAndChargeAppointment(
  page: import('@playwright/test').Page,
  clientName: string,
) {
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
  await comboInput.clear();
  await comboInput.fill(clientName);
  await page
    .getByRole('dialog')
    .getByRole('listitem')
    .filter({ hasText: clientName })
    .getByRole('button')
    .first()
    .click();

  await page.getByRole('dialog').getByLabel('Servicio').selectOption({ index: 1 });
  await page.getByRole('dialog').getByLabel('Barbero').selectOption({ index: 1 });
  const stamp = Date.now();
  const ymd = todayInSantiago();
  const hour = `19:${String(stamp % 60).padStart(2, '0')}`;
  await page.getByRole('dialog').getByLabel('Fecha').fill(ymd);
  await page.getByRole('dialog').getByLabel('Hora').fill(hour);
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar cita' }).click();
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 });
  // Reload to guarantee Hub Hoy shows the appointment before charging
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('main').getByText(clientName).first()).toBeVisible({ timeout: 30_000 });

  // Charge via header
  await page.getByRole('button', { name: '💳 Cobrar' }).click();
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Cobrar cita' }),
  ).toBeVisible({ timeout: 10_000 });
  await page
    .getByRole('dialog')
    .getByRole('listitem')
    .filter({ hasText: clientName })
    .getByRole('button', { name: 'Cobrar' })
    .click();
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Cobrar cita' }),
  ).toBeVisible({ timeout: 5_000 });
  await page.getByRole('button', { name: /Confirmar cobro/ }).click();
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 });
}

test('caja page shows payments and date range filter works', async ({ page }) => {
  const stamp = Date.now();
  const clientName = `Caja Range E2E ${stamp}`;

  await login(page);
  await createAndChargeAppointment(page, clientName);

  // Navigate to Caja
  await page.getByRole('link', { name: 'Caja' }).click();
  await expect(page).toHaveURL(/\/admin\/caja/);
  await page.waitForLoadState('networkidle');

  // Hoy is default — payment visible
  await expect(page.locator('main').getByText(clientName).first()).toBeVisible({
    timeout: 10_000,
  });
  // Day is open (not yet closed)
  await expect(page.getByText('Día abierto')).toBeVisible();

  // Switch to "Esta semana" — same payment still visible (same day = same week)
  await page.getByRole('button', { name: 'Esta semana' }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('main').getByText(clientName).first()).toBeVisible({
    timeout: 10_000,
  });

  // Switch back to "Hoy"
  await page.getByRole('button', { name: 'Hoy' }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('main').getByText(clientName).first()).toBeVisible();
});

test('admin can close the day and see the immutable summary', async ({ page }) => {
  const stamp = Date.now();
  const clientName = `Cierre E2E ${stamp}`;

  await login(page);
  await createAndChargeAppointment(page, clientName);

  // Navigate to Caja
  await page.getByRole('link', { name: 'Caja' }).click();
  await expect(page).toHaveURL(/\/admin\/caja/);
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Día abierto')).toBeVisible({ timeout: 10_000 });

  // Close the day
  await page.getByRole('button', { name: 'Cerrar día' }).click();
  await expect(page.getByText('✓ Día cerrado')).toBeVisible({ timeout: 15_000 });

  // Immutable summary fields appear inside the closed panel (green card)
  // Scope to the card that contains "Día cerrado" to avoid strict mode violations
  const closedCard = page.locator('.border-green-500').first();
  await expect(closedCard.getByText('Ingreso del local')).toBeVisible();
  await expect(closedCard.getByText('Comisiones')).toBeVisible();
  await expect(closedCard.getByText('Neto del dueño')).toBeVisible();
  await expect(closedCard.getByText('Propinas (barberos)')).toBeVisible();

  // The "Cerrar día" button is gone
  await expect(page.getByRole('button', { name: 'Cerrar día' })).not.toBeVisible();

  // After page reload the day is still shown as closed
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('✓ Día cerrado')).toBeVisible({ timeout: 10_000 });
});
