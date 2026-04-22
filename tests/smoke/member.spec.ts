import { test, expect } from '@playwright/test';

test('member profile renders', async ({ page }) => {
  await page.goto('/members/dgu');
  await expect(page.getByRole('heading', { name: 'Dongyu' })).toBeVisible();
  await expect(page.getByText('PhD')).toBeVisible();
});
