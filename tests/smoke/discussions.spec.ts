import { test, expect } from '@playwright/test';

test('/discussions lists categories and threads', async ({ page }) => {
  await page.goto('/discussions');
  await expect(page.getByText('Announcements').first()).toBeVisible();
  await expect(page.getByText('Journal Club').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Group meeting moved/ })).toBeVisible();
});

test('discussion detail renders body and replies', async ({ page }) => {
  await page.goto('/discussions/d-001');
  await expect(page.getByRole('heading', { name: /Group meeting moved/ })).toBeVisible();
  await expect(page.getByText('Slides ready by Thu night')).toBeVisible();
});
