import { test, expect } from '@playwright/test';
import { adminClient } from './helpers/supabase-admin';
import { createTestUser, deleteTestUser, type TestUser } from './helpers/auth-helpers';

let owner: TestUser;
let shopId: string;
let barberId: string;

test.beforeAll(async () => {
  owner = await createTestUser({ onboard: true });
  const { data: m } = await adminClient
    .from('memberships')
    .select('barbershop_id, barber_id')
    .eq('user_id', owner.id)
    .single();
  shopId = (m as { barbershop_id: string; barber_id: string }).barbershop_id;
  barberId = (m as { barbershop_id: string; barber_id: string }).barber_id;
});

test.afterAll(async () => {
  await deleteTestUser(owner.id);
});

test('owner can generate a barber invite link from BarberDetailPage', async ({ page }) => {
  // Grant clipboard permission for this test
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

  await page.goto('/login');
  await page.getByLabel('Correo').fill(owner.email);
  await page.getByLabel('Contraseña').fill(owner.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/admin\/hoy/, { timeout: 10_000 });
  await page.waitForLoadState('networkidle');

  await page.goto(`/admin/equipo/${barberId}`);
  await expect(page.getByRole('heading', { level: 2 })).toBeVisible({ timeout: 10_000 });

  // Generate invite link button is visible
  await expect(page.getByRole('button', { name: /Generar enlace/ })).toBeVisible();
  await page.getByRole('button', { name: /Generar enlace/ }).click();
  // Button text changes to "✓ Link copiado" OR toast appears
  // (clipboard may or may not work depending on browser permissions)
  // Button text changes to "✓ Link copiado" after click
  await expect(
    page.getByRole('button', { name: /Link copiado/ }).first(),
  ).toBeVisible({ timeout: 10_000 });
});

test('/unirse page shows invite info for a valid token (unauthenticated)', async ({ browser }) => {
  // Use a fresh browser context to avoid owner's auth session
  const context = await browser.newContext({ baseURL: 'http://localhost:5173' });
  const page = await context.newPage();

  try {
    // Create an invite directly via admin client
    const { data: inv } = await adminClient
      .from('barber_invites')
      .insert({ barbershop_id: shopId, barber_id: barberId, created_by: owner.id })
      .select('token')
      .single();
    const token = (inv as { token: string }).token;

    // Visit as unauthenticated user in fresh context
    await page.goto(`/unirse?token=${token}`);
    await expect(page.getByText('Unirte a tu equipo')).toBeVisible({ timeout: 20_000 });
    // Barber name visible
    await expect(page.getByText('Test Barber')).toBeVisible();
    // Registration form present
    await expect(page.getByPlaceholder('tu@correo.cl')).toBeVisible();
    await expect(page.getByRole('button', { name: /Crear cuenta/ })).toBeVisible();

    // Cleanup
    await adminClient
      .from('barber_invites')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);
  } finally {
    await context.close();
  }
});
