import { test, expect } from '@playwright/test';

test('create run via project-scoped form', async ({ page }) => {
  const ts = Date.now();
  const name = `smoke run ${ts}`;
  await page.goto('/projects/reasoning-bench-v2/experiments/new');
  await expect(page.getByRole('heading', { name: 'New run' })).toBeVisible();
  await page.getByLabel('Name').fill(name);
  // Project is locked to reasoning-bench-v2 via hidden input; no select to interact with.
  await page.getByLabel('Status').selectOption('success');
  await page.getByLabel(/Triggered by/).selectOption('dgu');
  await page.getByLabel('Started at').fill('2026-04-23T10:00');
  await page.getByLabel(/Duration/).fill('3600');
  await page.getByLabel(/Summary/).fill('smoke test run');
  await page.getByRole('button', { name: 'Create run' }).click();
  // Redirected to the project-scoped run detail page.
  await expect(page).toHaveURL(/\/projects\/reasoning-bench-v2\/experiments\/exp-/);
  await expect(page.getByRole('heading', { name })).toBeVisible();
});

test('global experiments page links to project-scoped New run picker', async ({ page }) => {
  await page.goto('/experiments');
  await expect(page.getByRole('link', { name: /New run/ })).toBeVisible();
});

test('/experiments/new shows project picker when no slug', async ({ page }) => {
  await page.goto('/experiments/new');
  await expect(page.getByRole('heading', { name: 'New run' })).toBeVisible();
  await expect(page.getByText(/Pick a project/)).toBeVisible();
  await expect(page.getByRole('link', { name: /reasoning-bench-v2/ }).first()).toBeVisible();
});
