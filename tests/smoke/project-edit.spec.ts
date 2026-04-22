import { test, expect } from '@playwright/test';

test('edit project description via form', async ({ page }) => {
  // Seed: create a fresh project so we don't mutate shared fixtures
  const ts = Date.now();
  const slug = `edit-test-${ts}`;
  await page.goto('/projects/new');
  await page.getByLabel('Name').fill(`Edit test ${ts}`);
  await page.getByLabel('Slug').fill(slug);
  await page.getByLabel('Description').fill('original description');
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page).toHaveURL(new RegExp(`/projects/${slug}$`));

  // Navigate to edit
  await page.goto(`/projects/${slug}/edit`);
  await page.getByLabel('Description').fill('updated description');
  await page.getByRole('button', { name: /Save changes/ }).click();

  await expect(page).toHaveURL(new RegExp(`/projects/${slug}$`));
  await expect(page.getByText('updated description')).toBeVisible();
});
