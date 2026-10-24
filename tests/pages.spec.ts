import { test, expect } from '@playwright/test';

test('GitHub Pages production assets, marketing links, hash navigation and persisted demo work under repository path', async ({
  page,
}) => {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('./');
  await expect(page.locator('main h1')).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator('.brand img')
        .first()
        .evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Change language / Хэл солих' }).click();
  await page.getByRole('link', { name: 'Pricing', exact: true }).first().click();
  await expect(page).toHaveURL(/Chat_Hariu\/#\/pricing$/);
  await page.getByRole('link', { name: 'Features', exact: true }).click();
  await expect(page).toHaveURL(/Chat_Hariu\/#\/\?section=features$/);
  await expect(page.locator('#features')).toBeInViewport();
  await page.getByRole('link', { name: 'Try the demo', exact: true }).first().click();
  await expect(page).toHaveURL(/Chat_Hariu\/#\/app$/);
  await page.getByRole('link', { name: 'Bots', exact: true }).click();
  await page.getByRole('button', { name: 'Create bot', exact: true }).click();
  await page.getByRole('textbox', { name: 'Bot name' }).fill('Pages assistant');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pages assistant', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Orders', exact: true }).click();
  await page.reload();
  await expect(page.locator('main h1')).toHaveText('Orders');
  await expect(page.getByRole('table')).toContainText('ORD-1001');
  expect(failures).toEqual([]);
});

test('GitHub Pages direct mobile links, skip link and flow controls survive refresh', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./#/app/flows');
  await expect(page.locator('main h1')).toBeVisible();
  await page.locator('.skip-link').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/Chat_Hariu\/#\/app\/flows$/);
  await page.getByRole('button', { name: 'Блок нэмэх', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeInViewport();
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('main h1')).toHaveText('Урсгал засварлах');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
