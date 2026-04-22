import { test, expect } from '@playwright/test';

test('edit paper stage via edit form', async ({ page }) => {
  // Use p-001 which is in stage 'writing'
  await page.goto('/projects/reasoning-bench-v2/papers/p-001/edit');
  await expect(page.getByRole('heading', { name: /Edit paper/ })).toBeVisible();
  // Change stage to 'review'
  await page.getByLabel('Stage').selectOption('review');
  await page.getByRole('button', { name: /Save changes/ }).click();
  // Should land back on papers tab with paper now grouped under "Under review"
  await expect(page).toHaveURL(/\/projects\/reasoning-bench-v2\/papers$/);
});
