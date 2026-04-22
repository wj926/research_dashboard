import { test, expect } from '@playwright/test';

test('dashboard shows pinned projects and activity feed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Pinned projects')).toBeVisible();
  await expect(page.getByText('Upcoming')).toBeVisible();
  await expect(page.getByText('Recent activity')).toBeVisible();
  await expect(page.getByRole('link', { name: /reasoning-bench-v2/ }).first()).toBeVisible();
});
