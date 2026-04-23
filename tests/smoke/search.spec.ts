import { test, expect } from '@playwright/test';

// Wait for the client-side search index fetch to complete before typing.
async function waitForIndex(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForResponse((r) => r.url().includes('/api/search-index') && r.status() === 200);
}

test('search box finds a project by name', async ({ page }) => {
  await waitForIndex(page);
  const input = page.getByPlaceholder(/Search projects, papers, people/);
  await input.fill('reasoning');
  await expect(page.getByRole('link', { name: /reasoning-bench-v2/ }).first()).toBeVisible();
});

test('search box finds a member', async ({ page }) => {
  await waitForIndex(page);
  await page.getByPlaceholder(/Search projects/).fill('dongyu');
  // Scope to the Members group heading inside the dropdown to avoid matches
  // elsewhere on the page (e.g. the activity feed).
  await expect(page.getByText('Members', { exact: true })).toBeVisible();
});

test('enter key navigates to first result', async ({ page }) => {
  await waitForIndex(page);
  await page.getByPlaceholder(/Search projects/).fill('reasoning');
  // wait for dropdown
  await expect(page.getByText('Projects', { exact: true }).first()).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/projects\/reasoning-bench-v2/);
});

test('escape closes dropdown', async ({ page }) => {
  await waitForIndex(page);
  await page.getByPlaceholder(/Search projects/).fill('reasoning');
  await page.keyboard.press('Escape');
  await expect(page.getByText(/No matches/)).not.toBeVisible();
});
