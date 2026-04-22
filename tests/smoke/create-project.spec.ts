import { test, expect } from '@playwright/test';

test('/projects/new renders create form', async ({ page }) => {
  await page.goto('/projects/new');
  await expect(page.getByRole('heading', { name: 'New project' })).toBeVisible();
  await expect(page.getByLabel('Name')).toBeVisible();
  await expect(page.getByLabel('Description')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create project' })).toBeVisible();
});

test('create project flow creates and navigates to detail', async ({ page }) => {
  // Unique name for this test run to avoid slug collision across re-runs
  const timestamp = Date.now();
  const name = `test-project-${timestamp}`;

  await page.goto('/projects/new');
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Description').fill('Created by automated smoke test');
  await page.getByLabel('Tags').fill('test, automated');
  await page.getByRole('button', { name: 'Create project' }).click();

  await expect(page).toHaveURL(new RegExp(`/projects/${name}$`));
  // Two headings resolve to the same name (project header + README H1); target the first.
  await expect(page.getByRole('heading', { name }).first()).toBeVisible();
});
