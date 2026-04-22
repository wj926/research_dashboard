import { test, expect } from '@playwright/test';

test('/ renders without error and shows top nav', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('banner')).toBeVisible();
});
