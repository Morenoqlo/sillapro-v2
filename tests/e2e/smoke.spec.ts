import { test, expect } from '@playwright/test';

test('admin shell loads with sidebar links', async ({ page }) => {
  await page.goto('/admin/hoy');
  await expect(page.getByText('SillaPro').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hoy' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Agenda' })).toBeVisible();
  await expect(page.getByRole('button', { name: '+ Cita' })).toBeVisible();
});

test('navigation works between admin sections', async ({ page }) => {
  await page.goto('/admin/hoy');
  await page.getByRole('link', { name: 'Agenda' }).click();
  await expect(page).toHaveURL(/\/admin\/agenda/);
  await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible();
});

test('barber shell loads with bottom nav', async ({ page }) => {
  await page.goto('/barbero/mi-dia');
  await expect(page.getByRole('heading', { name: 'Mi día' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Comisiones' })).toBeVisible();
});
