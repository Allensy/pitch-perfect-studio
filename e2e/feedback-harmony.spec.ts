import { test, expect } from '@playwright/test';

for (const width of [390, 1320]) {
  test(`wrong answers remain clear and retryable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.addInitScript(() => {
      Math.random = () => 0;
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Play note', exact: true }).click();
    await expect(page.getByText('What did you hear? Choose your answer.')).toBeVisible();
    await page.getByRole('button', { name: 'D answer', exact: true }).click();
    const feedback = page.locator('.feedback');
    await expect(feedback).toContainText('Not quite');
    await expect(feedback).toContainText('Attempt 1 · Your choice: D');
    const wrong = page.getByRole('button', {
      name: 'D answer, incorrect previous answer',
      exact: true,
    });
    await expect(wrong).toHaveClass(/is-wrong/);
    await expect(wrong).toBeEnabled();
    await wrong.click();
    await expect(feedback).toContainText('Attempt 2');
    await page.screenshot({ path: `test-results/wrong-answer-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'C answer', exact: true }).click();
    await expect(feedback).toContainText('Locked in.');
    await expect(page.locator('.is-wrong')).toHaveCount(0);
  });
}

test('Harmony explains practice and exposes changing targets on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Harmony', exact: true }).click();
  await expect(page.getByRole('button', { name: 'How to practice', exact: true })).toBeVisible();
  const root = page.locator('.harmony-context > div').nth(0).locator('strong');
  const target = page.locator('.harmony-context > div').nth(1).locator('strong');
  const firstRoot = await root.innerText();
  const firstTarget = await target.innerText();
  await page.getByRole('button', { name: 'Next target', exact: true }).click();
  await expect(root).not.toHaveText(firstRoot);
  await expect(target).not.toHaveText(firstTarget);
  await page.getByRole('button', { name: 'Vary notes in key', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Root practice', exact: true })).toHaveValue(
    'scale',
  );
  await expect(
    page.getByText('targets fit your range and challenge.', { exact: false }),
  ).toBeVisible();
  await page.screenshot({ path: 'test-results/harmony-guidance-phone.png', fullPage: true });
  await page.getByRole('button', { name: 'Setup', exact: true }).click();
  const select = page.getByRole('combobox', { name: 'Root key', exact: true });
  const spacing = await select.evaluate((el) => {
    const css = getComputedStyle(el);
    return {
      appearance: css.appearance,
      padding: parseFloat(css.paddingInlineEnd),
      background: css.backgroundPositionX,
    };
  });
  expect(spacing.appearance).toBe('none');
  expect(spacing.padding).toBeGreaterThanOrEqual(40);
  expect(spacing.background).toContain('14px');
  await page.screenshot({ path: 'test-results/dropdowns-phone.png', fullPage: true });
});

for (const width of [320, 1320]) {
  test(`Harmony help is on demand, keyboard accessible and preserves practice at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 740 });
    await page.goto('/');
    await page.getByRole('tab', { name: 'Harmony', exact: true }).click();
    const help = page.getByRole('button', { name: 'How to practice', exact: true });
    const before = await page.locator('.harmony-context').innerText();
    const saved = await page.evaluate(() => localStorage.getItem('pitch_perfect_studio_v2'));
    await expect(page.getByText('Listen to the backing', { exact: true })).toHaveCount(0);
    await help.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Find your harmony', exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('list', { name: 'Practice steps' })).toBeVisible();
    await expect(dialog).toContainText('1.5 continuous seconds');
    await expect(dialog).toContainText('Notes in this key');
    await expect(dialog.getByRole('button', { name: 'Got it', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Close dialog', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Got it', exact: true })).toBeFocused();
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await page.screenshot({ path: `test-results/harmony-help-${width}.png`, fullPage: true });
    await dialog.locator('.help-dialog-body').evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await expect(
      dialog.getByRole('heading', { name: 'Just exploring?', exact: true }),
    ).toBeInViewport();
    await expect(dialog.getByRole('button', { name: 'Got it', exact: true })).toBeInViewport();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(help).toBeFocused();
    await help.click();
    await page.getByRole('button', { name: 'Got it', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(help).toBeFocused();
    await expect(page.locator('.harmony-context')).toHaveText(before, { useInnerText: true });
    expect(await page.evaluate(() => localStorage.getItem('pitch_perfect_studio_v2'))).toBe(saved);
  });
}

test('Harmony explains a single feasible target instead of pretending to advance', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Harmony', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Harmony challenge', exact: true })
    .selectOption('major3');
  await page.getByRole('button', { name: 'Setup', exact: true }).click();
  await page.getByRole('combobox', { name: 'Low note', exact: true }).selectOption('60');
  await page.getByRole('combobox', { name: 'High note', exact: true }).selectOption('64');
  await page.getByRole('button', { name: 'Apply setup', exact: false }).click();
  await expect(page.getByRole('button', { name: 'Next target', exact: true })).toBeDisabled();
  await expect(
    page.getByText('Only one target fits, so there is nowhere to move.', { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit range', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vary notes in key', exact: true })).toBeVisible();
});
