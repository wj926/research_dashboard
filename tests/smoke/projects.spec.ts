import { test, expect } from '@playwright/test';

test('/projects lists all projects', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.getByRole('heading', { name: /Projects/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /agentic-tool-use/ })).toBeVisible();
});
