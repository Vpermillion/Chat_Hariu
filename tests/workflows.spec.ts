import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Change language / Хэл солих' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
async function route(page: Page, path: string) {
  await page.goto(`/app${path}`);
}

test('marketing demo entry, industry tabs, FAQ, pricing and password-free demo access', async ({
  page,
}) => {
  await page.getByRole('tab', { name: 'Beauty', exact: true }).click();
  await expect(page.locator('.industry-preview')).toContainText('daily serum');
  await page.getByRole('button', { name: 'Is this connected to Facebook?', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Is this connected to Facebook?', exact: true }),
  ).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('link', { name: 'Try the demo', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Your day, at a glance.' })).toBeVisible();
  await expect(page.getByTestId('metric-orders')).toHaveText('4');
  await page.goto('/pricing');
  await page.getByRole('button', { name: 'Get a quote', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toContainText('Contact information is not configured');
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await page.goto('/register');
  await expect(page.locator('input[type=password]')).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Your name' }).fill('Demo Owner');
  await page.getByRole('textbox', { name: 'Business name' }).fill('Demo Shop');
  await page.getByRole('textbox', { name: 'Demo email' }).fill('demo@example.com');
  await page.getByRole('button', { name: 'Enter demo' }).click();
  await expect(page).toHaveURL(/\/app$/);
});

test('bot create, rename, persistence, archive and recovery', async ({ page }) => {
  await route(page, '/bots');
  await page.getByRole('button', { name: 'Create bot', exact: true }).click();
  await page.getByRole('textbox', { name: 'Bot name' }).fill('Test assistant');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  let card = page
    .locator('.bot-card')
    .filter({ has: page.getByRole('heading', { name: 'Test assistant', exact: true }) });
  await card.getByRole('button', { name: 'Rename', exact: true }).click();
  await page.getByRole('textbox', { name: 'Bot name' }).fill('Renamed assistant');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();
  card = page
    .locator('.bot-card')
    .filter({ has: page.getByRole('heading', { name: 'Renamed assistant', exact: true }) });
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(card).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('archived');
  await card.getByRole('button', { name: 'Restore', exact: true }).click();
  await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('active');
  await expect(card).toBeVisible();
});

test('published FAQ updates simulator; Latin, Cyrillic and unknown questions work', async ({
  page,
}) => {
  await route(page, '/knowledge');
  const entry = page
    .locator('.knowledge-entry')
    .filter({ has: page.getByRole('heading', { name: 'Хүргэлт хэд вэ?', exact: true }) });
  await entry.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByRole('textbox', { name: 'Answer / content' }).fill('Шинэ хүргэлт 8,000₮.');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await entry.getByRole('button', { name: 'Publish', exact: true }).click();
  for (const query of ['hurgelt', 'Хүргэлт хэд вэ?']) {
    await page.getByRole('textbox', { name: 'Ask a question…' }).fill(query);
    await page.getByRole('button', { name: 'Ask', exact: true }).click();
  }
  await expect(
    page.getByRole('log').getByText('Шинэ хүргэлт 8,000₮.', { exact: true }),
  ).toHaveCount(2);
  await page.getByRole('textbox', { name: 'Ask a question…' }).fill('Deliver to the moon');
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
  await expect(page.getByRole('log')).toContainText('I do not have confirmed information');
  await expect(page.getByRole('log')).toContainText('Human help suggested');
});

test('product edits affect matching replies and imported CSV reports invalid rows', async ({
  page,
}) => {
  await route(page, '/products');
  await page.getByRole('button', { name: /Essential футболк/ }).click();
  await page.getByRole('spinbutton', { name: 'Price · ₮' }).fill('99000');
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
  await route(page, '/knowledge');
  await page.getByRole('textbox', { name: 'Ask a question…' }).fill('tsamts');
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
  await expect(page.getByRole('log')).toContainText('99,000₮');
  await route(page, '/products');
  await page.getByRole('button', { name: 'Import CSV', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'CSV', exact: true })
    .fill(
      'name,category,price,size,color,sku,stock\nTest bag,Цүнх,10000,M,Beige,NEW-BAG,3\nInvalid,Cat,100,M,Red,INVALID,-1',
    );
  await page.getByRole('button', { name: 'Preview import', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Row errors');
  await page.getByRole('button', { name: 'Import valid rows', exact: true }).click();
  await expect(page.getByRole('table')).toContainText('Test bag');
});

test('inbox preserves drafts; sends local replies and notes; takeover pauses assistant until resumed', async ({
  page,
}) => {
  await route(page, '/inbox?conversation=conv1');
  const composer = page.getByRole('textbox', { name: 'Write a reply…' });
  await composer.fill('Persistent draft');
  await page.reload();
  await expect(composer).toHaveValue('Persistent draft');
  await page.getByRole('button', { name: 'Send locally', exact: true }).click();
  await expect(page.locator('.thread-messages')).toContainText('Persistent draft');
  await page.getByRole('button', { name: 'Note', exact: true }).click();
  await page.getByRole('textbox', { name: 'Write a private note…' }).fill('Internal only');
  await page.getByRole('button', { name: 'Send locally', exact: true }).click();
  await expect(page.locator('.message-note')).toContainText('Internal only');
  await page.getByRole('button', { name: 'Take over', exact: true }).click();
  await page.getByRole('button', { name: 'Local test', exact: true }).click();
  const count = await page.locator('.thread-messages .message-bot').count();
  await page.getByRole('textbox', { name: 'Simulate customer message' }).fill('hurgelt');
  await page.getByRole('button', { name: 'Simulate', exact: true }).click();
  await expect(page.locator('.thread-messages .message-bot')).toHaveCount(count);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Resume assistant', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Resume assistant', exact: true }).click();
  await page.getByRole('button', { name: 'Local test', exact: true }).click();
  await page.getByRole('textbox', { name: 'Simulate customer message' }).fill('hurgelt');
  await page.getByRole('button', { name: 'Simulate', exact: true }).click();
  await expect(page.locator('.thread-messages .message-bot')).toHaveCount(count + 1);
  await page.getByRole('combobox', { name: 'Channel', exact: true }).selectOption('instagram');
  await expect(page.locator('.conversation-row')).toHaveCount(2);
  await page.getByRole('combobox', { name: 'Channel', exact: true }).selectOption('all');
  await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('unread');
  await expect(page.locator('.conversation-row')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Choose a conversation' })).toBeVisible();
  await page.locator('.conversation-row').click();
  await expect(page.locator('.conversation-row')).toHaveCount(0);
});

test('conversation order updates totals, related customer history and dashboard count', async ({
  page,
}) => {
  await route(page, '/inbox?conversation=conv1');
  await page.getByRole('button', { name: 'Customer details', exact: true }).click();
  await page.getByRole('button', { name: 'Create order draft', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Quantity', exact: true }).fill('2');
  await expect(page.getByRole('dialog').locator('.order-total')).toContainText('98,000₮');
  await page.getByRole('dialog').getByRole('button', { name: 'Create', exact: true }).click();
  const link = page.locator('.customer-orders>a').first();
  await expect(link).toContainText('98,000₮');
  await link.click();
  await expect(page.getByRole('dialog').locator('.order-total')).toContainText('98,000₮');
  await expect(page.getByRole('dialog')).toContainText('Unverified');
  await page
    .getByRole('combobox', { name: 'Fulfillment', exact: true })
    .last()
    .selectOption('confirmed');
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await route(page, '/contacts');
  const contactRow = page
    .getByRole('row')
    .filter({ has: page.getByRole('button', { name: 'Анужин', exact: true }) });
  await contactRow.getByRole('button', { name: 'Contact history', exact: true }).click();
  await page.getByRole('tab', { name: 'Orders', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('98,000₮');
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await route(page, '');
  await expect(page.getByTestId('metric-orders')).toHaveText('5');
});

test('flow validates missing connections, publishes, previews and separates saved drafts', async ({
  page,
}) => {
  await route(page, '/flows');
  await page.getByRole('combobox', { name: 'Next block', exact: true }).selectOption('');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Fix missing or broken block connections.');
  await page.getByRole('combobox', { name: 'Next block', exact: true }).selectOption('welcome');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page
    .locator('.flow-block-list')
    .getByRole('button', { name: 'Мэндчилгээ', exact: true })
    .click();
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Unpublished welcome');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await page.getByRole('button', { name: 'Run published preview', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toContainText('Unpublished welcome');
  await page.getByRole('textbox', { name: 'Reply to continue' }).fill('hurgelt');
  await page.getByRole('dialog').getByRole('button', { name: 'Send locally', exact: true }).click();
  await expect(page.getByRole('log')).toContainText('5,000₮');
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page.getByRole('button', { name: 'Run published preview', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Unpublished welcome');
});

test('form and survey accept responses and persist response tables', async ({ page }) => {
  await route(page, '/forms');
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await page.getByRole('textbox', { name: 'Нэр *', exact: true }).fill('Demo Customer');
  await page.getByRole('textbox', { name: 'И-мэйл *', exact: true }).fill('customer@example.com');
  await page.getByRole('button', { name: 'Submit demo response', exact: true }).click();
  await page.getByRole('tab', { name: /Responses/ }).click();
  await expect(page.getByRole('table')).toContainText('Demo Customer');
  await page.reload();
  await page.getByRole('tab', { name: /Responses/ }).click();
  await expect(page.getByRole('table')).toContainText('customer@example.com');
  await route(page, '/surveys');
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await page.getByRole('radio', { name: 'Маш сайн', exact: true }).check();
  await page.getByRole('textbox', { name: 'Санал хүсэлт *', exact: true }).fill('Helpful demo');
  await page.getByRole('button', { name: 'Submit demo response', exact: true }).click();
  await page.getByRole('tab', { name: /Responses/ }).click();
  await expect(page.getByRole('table')).toContainText('Helpful demo');
});

test('booking conflict is rejected, cancellation frees the same staff slot', async ({ page }) => {
  await route(page, '/bookings');
  await page.getByRole('button', { name: 'New booking', exact: true }).click();
  await expect(page.locator('.booking-records article')).toHaveCount(1);
  await page.getByRole('button', { name: 'New booking', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('already has an active booking');
  await expect(page.locator('.booking-records article')).toHaveCount(1);
  await page.getByRole('button', { name: 'Cancel booking', exact: true }).click();
  await expect(page.locator('.booking-records article')).toHaveCount(0);
  await page.getByRole('button', { name: 'New booking', exact: true }).click();
  await expect(page.locator('.booking-records article')).toHaveCount(1);
});

test('business records are isolated and selected workspace persists', async ({ page }) => {
  await route(page, '/products');
  await expect(page.getByRole('table')).toContainText('Essential футболк');
  await page.getByRole('combobox', { name: 'Choose business', exact: true }).selectOption('goo');
  await expect(page.getByRole('table')).toContainText('Чийгшүүлэгч серум');
  await expect(page.getByRole('table')).not.toContainText('Essential футболк');
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Choose business', exact: true })).toHaveValue(
    'goo',
  );
  await expect(page.getByRole('table')).not.toContainText('Essential футболк');
  await page.getByRole('combobox', { name: 'Choose business', exact: true }).selectOption('nuudel');
  await expect(page.getByRole('table')).toContainText('Essential футболк');
});

test('post rule, messaging draft, static page and settings have working saves', async ({
  page,
}) => {
  await route(page, '/posts');
  await page.getByRole('textbox', { name: 'Test comment', exact: true }).fill('үнэ');
  await page.getByRole('button', { name: 'Simulate', exact: true }).click();
  await expect(page.locator('.post-test-result')).toContainText('Rule matched');
  await route(page, '/messaging');
  await page.getByRole('textbox', { name: 'Campaign name', exact: true }).fill('Autumn draft');
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('A local draft only');
  await page.getByRole('button', { name: 'Save as draft', exact: true }).click();
  await page.reload();
  await expect(page.locator('.campaign-row')).toContainText('Autumn draft');
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toHaveCount(0);
  await route(page, '/pages');
  await page.getByRole('textbox', { name: 'Content', exact: true }).fill('Saved delivery details');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page.getByRole('button', { name: 'Published preview', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Saved delivery details');
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await route(page, '/settings');
  await page
    .getByRole('textbox', { name: 'Message', exact: true })
    .fill('Hello from saved settings');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue(
    'Hello from saved settings',
  );
});

test('all dashboard routes render without runtime errors and recover malformed data', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const path of [
    '',
    '/bots',
    '/inbox',
    '/live-agent',
    '/contacts',
    '/flows',
    '/knowledge',
    '/posts',
    '/products',
    '/orders',
    '/bookings',
    '/pages',
    '/forms',
    '/surveys',
    '/analytics',
    '/messaging',
    '/channels',
    '/settings',
    '/billing',
  ]) {
    await route(page, path);
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.getByText('Something went wrong', { exact: false })).toHaveCount(0);
  }
  expect(errors).toEqual([]);
  await page.evaluate(() => localStorage.setItem('tuslah.demo.v1', '{malformed'));
  await page.reload();
  await expect(page.locator('.recovery-banner')).toBeVisible();
});

for (const width of [1440, 1024, 390]) {
  test(`responsive layouts at ${width}px: no page overflow, dialogs, inbox and navigation`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const path of [
      '/',
      '/app',
      '/app/inbox',
      '/app/products',
      '/app/flows',
      '/app/knowledge',
      '/app/settings',
      '/app/forms',
      '/app/billing',
    ]) {
      await page.goto(path);
      await expect(page.locator('main h1')).toBeVisible();
      if (path === '/app/flows') {
        await page.getByRole('button', { name: 'Add block', exact: true }).click();
        await expect(page.getByRole('dialog')).toBeInViewport();
        await page.keyboard.press('Escape');
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${path} fits ${width}px`,
      ).toBe(true);
    }
    await page.goto('/app/bots');
    await page.getByRole('button', { name: 'Create bot', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeInViewport();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    if (width === 390) {
      await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
      await expect(page.locator('.sidebar')).toBeInViewport();
      await page
        .getByRole('link', { name: /Conversations/ })
        .first()
        .click();
      await page.locator('.conversation-row').first().click();
      await expect(page.getByRole('textbox', { name: 'Write a reply…' })).toBeVisible();
      await page.getByRole('button', { name: 'Customer details', exact: true }).click();
      await expect(page.locator('.customer-pane')).toBeInViewport();
      await page
        .locator('.customer-pane')
        .getByRole('button', { name: 'Close', exact: true })
        .click();
      await page.getByRole('button', { name: 'Back to conversations', exact: true }).click();
      await expect(page.locator('.conversation-list')).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
}
