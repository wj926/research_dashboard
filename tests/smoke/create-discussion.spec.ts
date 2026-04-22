import { test, expect } from '@playwright/test';

test('/discussions/new renders create form', async ({ page }) => {
  await page.goto('/discussions/new');
  await expect(page.getByRole('heading', { name: 'New discussion' })).toBeVisible();
  await expect(page.getByLabel('Title')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create discussion' })).toBeVisible();
});

test('create discussion flow creates and shows detail', async ({ page }) => {
  const ts = Date.now();
  const title = `Smoke test discussion ${ts}`;
  await page.goto('/discussions/new');
  await page.getByLabel('Title').fill(title);
  await page.getByLabel(/Body/).fill('Automated test body\n\nWith markdown.');
  await page.getByRole('button', { name: 'Create discussion' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
});

test('reply form creates a reply', async ({ page }) => {
  const ts = Date.now();
  const title = `Reply test ${ts}`;
  await page.goto('/discussions/new');
  await page.getByLabel('Title').fill(title);
  await page.getByLabel(/Body/).fill('Starting thread.');
  await page.getByRole('button', { name: 'Create discussion' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  await page.getByLabel('Reply').fill('This is a reply.');
  await page.getByRole('button', { name: 'Post reply' }).click();
  await expect(page.getByText('This is a reply.')).toBeVisible();
});
