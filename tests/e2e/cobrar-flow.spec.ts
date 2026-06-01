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

async function createAppointmentForToday(
  page: import('@playwright/test').Page,
  clientName: string,
) {
  await page.getByRole('button', { name: '+ Cita' }).click();
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Nueva cita' }),
  ).toBeVisible();
  await page.waitForLoadState('networkidle');

  await page
    .getByRole('dialog')
    .getByPlaceholder('Buscar por nombre o teléfono...')
    .fill(clientName);
  await page.getByRole('button', { name: `+ Crear "${clientName}"` }).click();
  // Wait for the toast confirming creation, then re-type into the combobox to
  // reopen the dropdown and click the new client item (not the "+ Crear" button).
  await expect(page.getByText(/creado/i)).toBeVisible({ timeout: 10_000 });
  // Re-fill the input to trigger a fresh search that shows the newly created client.
  const comboInput = page.getByRole('dialog').getByPlaceholder('Buscar por nombre o teléfono...');
  await comboInput.clear();
  await comboInput.fill(clientName);
  // The list item button (inside <li>) contains only the name, not "+ Crear"
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
  const ymd = new Date().toISOString().slice(0, 10);
  const hour = `19:${String(stamp % 60).padStart(2, '0')}`;
  await page.getByRole('dialog').getByLabel('Fecha').fill(ymd);
  await page.getByRole('dialog').getByLabel('Hora').fill(hour);
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar cita' }).click();
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 });
}

test('admin can charge an appointment from the global 💳 Cobrar button', async ({ page }) => {
  const stamp = Date.now();
  const clientName = `Cobrar E2E ${stamp}`;

  await login(page);
  await createAppointmentForToday(page, clientName);

  // Open the chargeable list from the header
  await page.getByRole('button', { name: '💳 Cobrar' }).click();
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Cobrar cita' }),
  ).toBeVisible({ timeout: 10_000 });

  // Our appointment must be in the list
  await expect(page.getByRole('dialog').getByText(clientName)).toBeVisible();

  // Click the "Cobrar" action button in the row
  await page
    .getByRole('dialog')
    .getByRole('listitem')
    .filter({ hasText: clientName })
    .getByRole('button', { name: 'Cobrar' })
    .click();

  // Now in ChargeAppointmentModal — default cash, no tip
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Cobrar cita' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Confirmar cobro/ })).toBeVisible();
  await page.getByRole('button', { name: /Confirmar cobro/ }).click();
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 });

  // The "Caja del día" KPI should reflect the payment (Test Service price = 10000)
  await expect(page.locator('main').getByText('$10.000').first()).toBeVisible({
    timeout: 10_000,
  });
});

test('admin can charge with a 10% tip from the appointment detail modal', async ({ page }) => {
  const stamp = Date.now();
  const clientName = `Tip E2E ${stamp}`;

  await login(page);
  await createAppointmentForToday(page, clientName);

  // Open the appointment detail from Hoy agenda list (last() picks the list row, not NextAppointmentCard)
  await page.locator('main').getByText(clientName).last().click();
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Detalle de cita' }),
  ).toBeVisible();

  // Click "✓ Marcar + cobrar" inside the detail dialog (not the NextAppointmentCard)
  await page.getByRole('dialog').getByRole('button', { name: /Marcar \+ cobrar/ }).click();
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Cobrar cita' }),
  ).toBeVisible({ timeout: 5_000 });

  // Pick 10% tip
  await page.getByRole('button', { name: '10%' }).click();
  await expect(page.getByText(/Total a cobrar/)).toBeVisible();

  await page.getByRole('button', { name: /Confirmar cobro/ }).click();
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 });

  // Navigate to Caja to verify the payment is listed with tip
  await page.getByRole('link', { name: 'Caja' }).click();
  await expect(page).toHaveURL(/\/admin\/caja/);
  await expect(page.locator('main').getByText(clientName).first()).toBeVisible({ timeout: 10_000 });
  // Tip column shows $1.000 (10% of $10.000)
  await expect(page.locator('main').getByText('$1.000').first()).toBeVisible();
});
