import { test, expect } from '@playwright/test';

test('/experiments lists runs with status icons', async ({ page }) => {
  await page.goto('/experiments');
  await expect(page.getByRole('heading', { name: /Experiments/i })).toBeVisible();
  await expect(page.getByText('sweep-context-len #1428')).toBeVisible();
});
