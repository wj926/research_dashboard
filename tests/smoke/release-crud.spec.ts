import { test, expect } from '@playwright/test';

test('create release via form', async ({ page }) => {
  const ts = Date.now();
  const name = `smoke-release-${ts}`;
  await page.goto('/projects/reasoning-bench-v2/data/new');
  await expect(page.getByRole('heading', { name: /New release/i })).toBeVisible();

  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Kind').selectOption('dataset');
  await page.getByLabel('Version').fill('v0.1.0');
  await page.getByLabel('Published date').fill('2026-04-23');
  await page.getByLabel('Description').fill('Automated test release.');
  await page.getByRole('button', { name: /Create release/ }).click();

  await expect(page).toHaveURL(/\/projects\/reasoning-bench-v2\/data$/);
  await expect(page.getByText(name)).toBeVisible();
});

test('edit release updates description', async ({ page }) => {
  // Use r-001 (reasoning-bench dataset v2.0 from seed)
  await page.goto('/projects/reasoning-bench-v2/data/r-001/edit');
  const ts = Date.now();
  const desc = `updated desc ${ts}`;
  await page.getByLabel('Description').fill(desc);
  await page.getByRole('button', { name: /Save changes/ }).click();
  await expect(page).toHaveURL(/\/projects\/reasoning-bench-v2\/data$/);
  await expect(page.getByText(desc)).toBeVisible();
});

test('delete release requires two clicks', async ({ page }) => {
  // First create a throwaway release
  const ts = Date.now();
  const name = `delete-release-${ts}`;
  await page.goto('/projects/reasoning-bench-v2/data/new');
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Kind').selectOption('tool');
  await page.getByLabel('Version').fill('v0.0.1');
  await page.getByLabel('Published date').fill('2026-04-23');
  await page.getByRole('button', { name: /Create release/ }).click();
  await expect(page.getByText(name)).toBeVisible();

  // Hover the row, then click Delete twice
  const row = page.getByRole('listitem').filter({ hasText: name }).first();
  await row.hover();
  const delBtn = row.getByRole('button', { name: /Delete release|Click again/ });
  await delBtn.click();
  await delBtn.click();

  await expect(page.getByText(name)).not.toBeVisible();
});
