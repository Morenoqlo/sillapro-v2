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
  // Esperar que Hoy cargue sus queries iniciales (tenant + day appointments + barbers)
  await expect(page.getByText('Caja del día')).toBeVisible({ timeout: 10_000 });
  await page.waitForLoadState('networkidle');
}

test('admin can create a client and an appointment from + Cita header button', async ({
  page,
}) => {
  const stamp = Date.now();
  const clientName = `Cita E2E ${stamp}`;

  await login(page);

  // Abrir modal de Nueva cita desde el header global
  await page.getByRole('button', { name: '+ Cita' }).click();
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Nueva cita' }),
  ).toBeVisible();
  await page.waitForLoadState('networkidle');

  // Crear cliente inline desde el combobox
  await page
    .getByRole('dialog')
    .getByPlaceholder('Buscar por nombre o teléfono...')
    .fill(clientName);
  await page.getByRole('button', { name: `+ Crear "${clientName}"` }).click();
  // Esperar que el toast de éxito aparezca (confirma que la creación completó
  // y la query se invalidó); evita una race con el refetch.
  await expect(page.getByText(/creado/i)).toBeVisible({ timeout: 10_000 });
  // Seleccionar el item del dropdown (su texto comienza con el nombre del cliente,
  // a diferencia del botón "+ Crear ..." que ahora ya desapareció).
  await page
    .getByRole('button', { name: new RegExp(`^${clientName}`) })
    .first()
    .click();

  // Seleccionar el servicio y barbero del onboarding
  // Selecciona la primera opción real (índice 1; índice 0 es "Selecciona...").
  // El usuario de test sólo tiene un servicio + barbero del onboarding.
  await page.getByRole('dialog').getByLabel('Servicio').selectOption({ index: 1 });
  await page.getByRole('dialog').getByLabel('Barbero').selectOption({ index: 1 });

  // Una fecha 7 días en el futuro evita colisionar con citas previas del día
  const future = new Date();
  future.setDate(future.getDate() + 7);
  const ymd = future.toISOString().slice(0, 10);
  await page.getByRole('dialog').getByLabel('Fecha').fill(ymd);
  await page.getByRole('dialog').getByLabel('Hora').fill('11:00');

  await page.getByRole('dialog').getByRole('button', { name: 'Guardar cita' }).click();
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 });

  // Verificar que la cita aparece en la agenda semanal
  await page.getByRole('link', { name: 'Agenda' }).click();
  await expect(page).toHaveURL(/\/admin\/agenda/);
  // Navegar a la semana que contiene esa fecha
  const today = new Date();
  const weeksAhead = Math.max(
    1,
    Math.ceil((future.getTime() - today.getTime()) / (7 * 24 * 3600 * 1000)),
  );
  for (let i = 0; i < weeksAhead; i++) {
    await page.getByRole('button', { name: 'Siguiente →' }).click();
    await page.waitForTimeout(300);
  }
  // Scope al <main> para excluir toasts (sonner los pone fuera del main)
  await expect(page.locator('main').getByText(clientName)).toBeVisible({ timeout: 10_000 });
});

test('admin can confirm a pending appointment from the detail modal', async ({ page }) => {
  const stamp = Date.now();
  const clientName = `Conf E2E ${stamp}`;

  await login(page);

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
  await expect(page.getByText(/creado/i)).toBeVisible({ timeout: 10_000 });
  await page
    .getByRole('button', { name: new RegExp(`^${clientName}`) })
    .first()
    .click();

  // Selecciona la primera opción real (índice 1; índice 0 es "Selecciona...").
  // El usuario de test sólo tiene un servicio + barbero del onboarding.
  await page.getByRole('dialog').getByLabel('Servicio').selectOption({ index: 1 });
  await page.getByRole('dialog').getByLabel('Barbero').selectOption({ index: 1 });

  // Use Santiago date (not UTC) to match useDayAppointments query range
  const ymd = todayInSantiago();
  // Hora tarde con minutos derivados del stamp para evitar colisiones
  const hour = `19:${String(stamp % 60).padStart(2, '0')}`;
  await page.getByRole('dialog').getByLabel('Fecha').fill(ymd);
  await page.getByRole('dialog').getByLabel('Hora').fill(hour);
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar cita' }).click();
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 });

  // Reload to guarantee Hub Hoy shows the appointment (avoids React Query refetch race)
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('main').getByText(clientName).last()).toBeVisible({ timeout: 30_000 });

  // Abrir el detalle de la cita desde la lista del Hub Hoy. El nombre del cliente
  // aparece dos veces en <main> (NextAppointmentCard arriba + TodayAgendaList abajo);
  // .last() toma la fila de la lista cuyo <li> tiene el onClick que abre el modal.
  await page.locator('main').getByText(clientName).last().click();
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Detalle de cita' }),
  ).toBeVisible();

  // Confirmar (el modal se cierra al confirmar para que la lista muestre el estado fresco).
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 });
  // El badge de estado en la lista de Hoy debe pasar a "Confirmada".
  await expect(page.locator('main').getByText('Confirmada').first()).toBeVisible({
    timeout: 10_000,
  });
});
