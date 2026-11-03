import { test, expect } from '@playwright/test';
const modes = ['Notes', 'Intervals', 'Chords', 'Harmony', 'Tuner'];
for (const width of [320, 390, 900, 1320]) {
  test(`five modes and Setup reflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Listen. Trust your ears.' })).toBeVisible();
    await page.screenshot({ path: `test-results/notes-${width}.png`, fullPage: true });
    for (const mode of modes) {
      const tab = page.getByRole('tab', { name: mode, exact: true });
      await expect(tab).toBeVisible();
      await tab.click();
      await expect(tab).toHaveAttribute('data-state', 'active');
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
    }
    await page.getByRole('button', { name: 'Setup', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('combobox', { name: 'Instrument', exact: true }).selectOption('sine');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Setup', exact: true })).toBeFocused();
    expect(errors).toEqual([]);
    await page.screenshot({ path: `test-results/studio-${width}.png`, fullPage: true });
  });
}
test('real quiz playback, exact answers, closed replay and saved progress', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 740 });
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Setup', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('checkbox', { name: 'Auto-advance', exact: false })
    .uncheck();
  await page.getByRole('button', { name: 'Apply setup', exact: false }).click();
  await page.getByRole('button', { name: 'Play note', exact: true }).click();
  await expect(page.getByText('What did you hear? Choose your answer.')).toBeVisible({
    timeout: 10000,
  });
  await page.screenshot({ path: 'test-results/notes-active-phone.png', fullPage: true });
  await page.getByRole('button', { name: 'C answer', exact: true }).click();
  await expect(page.getByText(/Locked in. That was C3/)).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('pitch_perfect_studio_v2')!).progress.quizzes.notes.correct,
    ),
  ).toBe(1);
  await page.getByRole('button', { name: 'Replay', exact: true }).click();
  await expect(page.getByRole('button', { name: 'D answer', exact: true })).toBeDisabled();
  await page.getByRole('checkbox', { name: 'Exact octave', exact: true }).check();
  await page.getByRole('button', { name: 'Play note', exact: true }).click();
  await expect(page.getByText('What did you hear? Choose your answer.')).toBeVisible();
  await page.getByRole('combobox', { name: 'Note', exact: true }).selectOption('0');
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(page.getByText(/Choose both a note and an octave/)).toBeVisible();
  await page.getByRole('combobox', { name: 'Octave', exact: true }).selectOption('3');
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(page.getByText(/Locked in. That was C3/)).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('pitch_perfect_studio_v2')!).progress.quizzes.notes
          .attempts,
    ),
  ).toBe(2);
});
test('chord context and unearned simulated tuner remain distinct', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Chords', exact: true }).click();
  await page.getByRole('button', { name: 'Setup', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Inversion practice', exact: true })
    .selectOption('guess_inv');
  await page.getByRole('button', { name: 'Apply setup', exact: false }).click();
  await expect(page.getByText('Reference root', { exact: false }).first()).toBeVisible();
  await page.getByRole('tab', { name: 'Tuner', exact: true }).click();
  await page.getByRole('button', { name: 'Preview input', exact: false }).click();
  await expect(page.getByText(/Simulated input only/)).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('pitch_perfect_studio_v2')!).progress.xpEarned,
    ),
  ).toBe(0);
  await page.getByRole('button', { name: 'Free tuner', exact: true }).click();
  await expect(page.getByText('Up next', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('progressbar', { name: /hold/i })).toHaveCount(0);
});

test('keyboard dialog Escape preserves draft and restores focus', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Setup', exact: true }).click();
  await page.getByRole('combobox', { name: 'Root key', exact: true }).selectOption('1');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Setup', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Setup', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Root key', exact: true })).toHaveValue('0');
});

test('pending microphone request can be cancelled inside Setup without revival', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      value: () => new Promise<MediaStream>(() => {}),
    });
  });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Tuner', exact: true }).click();
  await page.getByRole('button', { name: 'Start microphone', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Cancel microphone request', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Setup', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Cancel request', exact: true })
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start microphone', exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('pitch_perfect_studio_v2')!).progress.vocal
          .completedTargets,
    ),
  ).toBe(0);
});
test('microphone denial explains recovery without fabricating live input', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      value: () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError')),
    });
  });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Tuner', exact: true }).click();
  await page.getByRole('button', { name: 'Start microphone', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry microphone', exact: true })).toBeVisible();
  await expect(page.locator('.capture-message')).toContainText(/permission|allow|blocked/i);
  await expect(page.locator('.pitch-note')).toHaveText('—');
});
