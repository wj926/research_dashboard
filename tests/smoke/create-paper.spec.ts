import { test, expect } from '@playwright/test';

test('/projects/reasoning-bench-v2/papers/new renders form', async ({ page }) => {
  await page.goto('/projects/reasoning-bench-v2/papers/new');
  await expect(page.getByRole('heading', { name: /New paper/ })).toBeVisible();
  await expect(page.getByLabel('Title')).toBeVisible();
  await expect(page.getByLabel(/Authors/)).toBeVisible();
});

test('create paper flow creates and lists in project', async ({ page }) => {
  const ts = Date.now();
  const title = `Smoke test paper ${ts}`;
  await page.goto('/projects/reasoning-bench-v2/papers/new');
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Stage').selectOption('idea');
  await page.getByLabel(/Authors/).selectOption({ value: 'dgu' });
  await page.getByRole('button', { name: 'Create paper' }).click();
  await expect(page).toHaveURL(/\/projects\/reasoning-bench-v2\/papers$/);
  await expect(page.getByText(title)).toBeVisible();
});
