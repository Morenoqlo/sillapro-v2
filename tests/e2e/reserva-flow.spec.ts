import { test, expect } from '@playwright/test';
import { adminClient } from './helpers/supabase-admin';
import { createTestUser, deleteTestUser, type TestUser } from './helpers/auth-helpers';

let owner: TestUser;
let shopId: string;
const TEST_SLUG = `test-slug-${Date.now()}`;

test.beforeAll(async () => {
  owner = await createTestUser({ onboard: true });

  // Get the shop created during onboarding
  const { data: m } = await adminClient
    .from('memberships')
    .select('barbershop_id')
    .eq('user_id', owner.id)
    .single();
  shopId = (m as { barbershop_id: string }).barbershop_id;

  // Set a unique slug so the public page can be found
  await adminClient.from('barbershops').update({ slug: TEST_SLUG }).eq('id', shopId);
});

test.afterAll(async () => {
  await deleteTestUser(owner.id);
});

test('public booking page shows shop info and wizard', async ({ page }) => {
  // Visit as unauthenticated user (no login)
  await page.goto(`/reservar/${TEST_SLUG}`);
  await page.waitForLoadState('networkidle');

  // Shop name visible in header (h1)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });

  // Step 1 content visible
  await expect(page.getByText('¿Qué servicio necesitas?')).toBeVisible({ timeout: 10_000 });

  // Test Service from onboarding is listed
  await expect(page.getByText('Test Service')).toBeVisible();
});

test('client can complete the booking wizard end-to-end', async ({ page }) => {
  const clientName = `Reserva E2E ${Date.now()}`;

  await page.goto(`/reservar/${TEST_SLUG}`);
  await expect(page.getByText('¿Qué servicio necesitas?')).toBeVisible({ timeout: 15_000 });

  // Step 1: pick Test Service
  await page.getByText('Test Service').click();

  // Step 2: pick barber
  await expect(page.getByText('¿Con quién quieres reservar?')).toBeVisible({ timeout: 5_000 });
  await page.getByText('Test Barber').click();

  // Step 3: pick date/time — wait for slots to load, click first available
  await expect(page.getByText('Elige fecha y hora')).toBeVisible({ timeout: 10_000 });
  await page.waitForLoadState('networkidle');
  // Slot buttons have HH:MM text format
  const slotButtons = page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ });
  await expect(slotButtons.first()).toBeVisible({ timeout: 20_000 });
  await slotButtons.first().click();

  // Step 4: fill name + phone (now required) and confirm
  await expect(page.getByRole('heading', { name: 'Confirmar reserva' })).toBeVisible({ timeout: 5_000 });
  await page.getByPlaceholder('Ej: Carla Rodríguez').fill(clientName);
  await page.getByPlaceholder(/\+56/).fill('+56912345678');
  await page.getByRole('button', { name: 'Confirmar reserva' }).click();

  // Success screen
  await expect(page.getByText('¡Reserva confirmada!')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Test Barber')).toBeVisible();
  await expect(page.getByText('Test Service')).toBeVisible();
});
