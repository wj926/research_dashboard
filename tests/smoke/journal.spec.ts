import { test, expect } from '@playwright/test';

test('/projects/lldm-unlearning renders journal overview', async ({ page }) => {
  await page.goto('/projects/lldm-unlearning');
  await expect(page.getByText('연구 흐름')).toBeVisible();
  await expect(page.getByText('단기 (1주)')).toBeVisible();
  await expect(page.getByText(/NOW/)).toBeVisible();
  await expect(page.getByText(/planner 방향 확정/)).toBeVisible();
});

test('/projects/reasoning-bench-v2 renders empty journal state', async ({ page }) => {
  await page.goto('/projects/reasoning-bench-v2');
  await expect(
    page.getByText(/No journal entries yet|연구 흐름/),
  ).toBeVisible();
});

test('journal filter chip narrows entry grid', async ({ page }) => {
  await page.goto('/projects/lldm-unlearning');
  const cards = page.locator('[data-entry-card]');
  await expect(cards.first()).toBeVisible();
  const allBefore = await cards.count();
  await page.getByRole('button', { name: /실험 결과/ }).click();
  const afterFilter = await cards.count();
  expect(afterFilter).toBeLessThan(allBefore);
  expect(afterFilter).toBeGreaterThan(0);
});

test('entry modal opens on 더보기', async ({ page }) => {
  await page.goto('/projects/lldm-unlearning');
  await page
    .getByRole('button', { name: /더보기/ })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});
