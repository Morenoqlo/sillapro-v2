import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, type TestUser } from './helpers/auth-helpers';

let user: TestUser;

test.beforeAll(async () => {
  // Usuario con barbería ya creada (onboarded) para entrar directo al admin
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
}

// Nombres/teléfonos únicos por ejecución: evita colisiones con los UNIQUE
// constraints (services.name, clients.phone) cuando un retry reusa el mismo
// usuario/barbería (los datos persisten entre intentos).

test('admin can create a service and see it in the list', async ({ page }) => {
  const name = `Corte Fade E2E ${Date.now()}`;
  await login(page);
  await page.getByRole('link', { name: 'Servicios' }).click();
  await expect(page).toHaveURL(/\/admin\/servicios/);
  // Esperar a que cargue la data inicial (servicio del onboarding) → garantiza
  // que el tenant query resolvió y barbershopId está disponible para el insert.
  await expect(page.getByText('Test Service')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: '+ Servicio' }).first().click();
  await page.getByRole('dialog').getByLabel('Nombre').fill(name);
  await page.getByRole('dialog').getByLabel('Categoría').fill('Corte');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();

  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 });
  await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });
});

test('admin can create a barber and see it in the list', async ({ page }) => {
  const name = `Barbero E2E ${Date.now()}`;
  await login(page);
  await page.getByRole('link', { name: 'Equipo' }).click();
  await expect(page).toHaveURL(/\/admin\/equipo/);
  // Esperar data inicial (barbero del onboarding) → tenant listo.
  await expect(page.getByText('Test Barber')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: '+ Barbero' }).first().click();
  await page.getByRole('dialog').getByLabel('Nombre').fill(name);
  await page.getByRole('dialog').getByLabel('Silla').fill('Silla 9');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();

  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 });
  await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });
});

test('admin can create a client and find it via search', async ({ page }) => {
  const stamp = Date.now();
  const name = `Cliente E2E ${stamp}`;
  const phone = `+56 9 ${String(stamp).slice(-8)}`;
  await login(page);
  await page.getByRole('link', { name: 'Clientes' }).click();
  await expect(page).toHaveURL(/\/admin\/clientes/);
  // Clientes arranca vacío para el usuario onboard → esperar el empty state
  // confirma que el tenant query resolvió y la lista cargó.
  await expect(page.getByText('Sin clientes aún')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: '+ Cliente' }).first().click();
  await page.getByRole('dialog').getByLabel('Nombre').fill(name);
  await page.getByRole('dialog').getByLabel('Teléfono').fill(phone);
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();

  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 });
  await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });

  // Search filters the list
  await page.getByPlaceholder('Buscar por nombre o teléfono...').fill(String(stamp));
  await expect(page.getByText(name)).toBeVisible();
});
