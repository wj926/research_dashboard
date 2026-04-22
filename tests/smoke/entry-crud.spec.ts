import { test, expect } from '@playwright/test';

test('create entry via form', async ({ page }) => {
  const ts = Date.now();
  const title = `Smoke entry ${ts}`;
  await page.goto('/projects/lldm-unlearning/entries/new');
  await expect(page.getByRole('heading', { name: 'New journal entry' })).toBeVisible();

  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Summary').fill('Automated test summary');
  await page.getByLabel(/Body/).fill('## Heading\n\nSome content.');

  // Add one slide
  await page.getByRole('button', { name: /Add slide/ }).click();
  const slideSection = page.locator('section[data-section="slides"]');
  await slideSection.getByPlaceholder('Slide title').fill('test slide title');
  await slideSection.getByPlaceholder('Slide body').fill('test slide body');

  await page.getByRole('button', { name: /Create entry/ }).click();

  // Redirected back to project page; new entry card visible
  await expect(page).toHaveURL(/\/projects\/lldm-unlearning$/);
  await expect(page.getByText(title).first()).toBeVisible();
});

test('edit entry preserves existing and updates title', async ({ page }) => {
  // Seed an entry first through the create flow
  const ts = Date.now();
  const originalTitle = `Edit test original ${ts}`;
  await page.goto('/projects/lldm-unlearning/entries/new');
  await page.getByLabel('Title').fill(originalTitle);
  await page.getByLabel('Summary').fill('original summary');
  await page.getByRole('button', { name: /Create entry/ }).click();
  await expect(page.getByText(originalTitle).first()).toBeVisible();

  // Open modal on the newly created card
  const card = page
    .locator('[data-entry-card]')
    .filter({ hasText: originalTitle })
    .first();
  await card.getByRole('button', { name: /더보기/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.getByRole('dialog').getByRole('link', { name: /Edit/ }).click();
  await expect(page.getByRole('heading', { name: 'Edit journal entry' })).toBeVisible();

  const newTitle = `Edit test updated ${ts}`;
  await page.getByLabel('Title').fill(newTitle);
  await page.getByRole('button', { name: /Save changes/ }).click();

  await expect(page).toHaveURL(/\/projects\/lldm-unlearning$/);
  await expect(page.getByText(newTitle).first()).toBeVisible();
  await expect(page.getByText(originalTitle)).toHaveCount(0);
});

test('delete entry requires confirmation click', async ({ page }) => {
  // Seed an entry
  const ts = Date.now();
  const title = `Delete test ${ts}`;
  await page.goto('/projects/lldm-unlearning/entries/new');
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Summary').fill('to be deleted');
  await page.getByRole('button', { name: /Create entry/ }).click();
  await expect(page.getByText(title).first()).toBeVisible();

  // Open modal
  const card = page
    .locator('[data-entry-card]')
    .filter({ hasText: title })
    .first();
  await card.getByRole('button', { name: /더보기/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  // First click arms confirmation, second click performs delete
  const deleteBtn = page.getByRole('button', { name: /^Delete$/ });
  await deleteBtn.click();
  const confirmBtn = page.getByRole('button', { name: /Click again to confirm/ });
  await expect(confirmBtn).toBeVisible();
  await confirmBtn.click();

  // Modal closes and card is gone
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText(title)).toHaveCount(0);
});
