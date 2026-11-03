import { test, expect } from '@playwright/test';

async function saved(page: import('@playwright/test').Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('pitch_perfect_studio_v2')!));
}

test('Setup shares typed controls across all mode drafts and commits once', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Setup', exact: true }).click();
  const select = (name: string) => page.getByRole('combobox', { name, exact: true });
  await select('Root key').selectOption('2');
  await select('Instrument').selectOption('sine');
  await page.getByRole('spinbutton', { name: 'Tuning A4 · Hz', exact: true }).fill('443');
  await select('Configure mode').selectOption('notes');
  await page.getByRole('checkbox', { name: 'Require exact octave', exact: true }).check();
  await page
    .getByRole('checkbox', { name: 'Auto-advance after correct feedback', exact: true })
    .uncheck();
  await select('Configure mode').selectOption('intervals');
  await select('Direction').selectOption('desc');
  await page.getByRole('checkbox', { name: 'Fix lower anchor to tonic', exact: true }).uncheck();
  await select('Configure mode').selectOption('chords');
  await select('Playback').selectOption('arp');
  await select('Inversion practice').selectOption('guess_inv');
  await select('Configure mode').selectOption('harmony');
  await select('Activity').selectOption('mixer');
  await select('Challenge').selectOption('major3');
  await select('Root practice').selectOption('scale');
  await select('Progression').selectOption('jazz');
  await page.getByRole('checkbox', { name: 'Soprano · mute / You Sing', exact: true }).check();
  await select('Configure mode').selectOption('tuner');
  await select('Drill').selectOption('scale_walk');
  await select('Tolerance').selectOption('12');
  await select('Arpeggio quality').selectOption('minor');
  // Nothing in these musical drafts commits before Apply.
  expect((await saved(page)).settings.global.a4).toBe(440);
  await page.getByRole('button', { name: 'Apply setup', exact: false }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const { settings } = await saved(page);
  expect(settings.global).toMatchObject({ rootKey: 2, timbre: 'sine', a4: 443 });
  expect(settings.notes).toMatchObject({ exactOctave: true, autoNext: false });
  expect(settings.intervals).toMatchObject({ direction: 'desc', fixedRoot: false });
  expect(settings.chords).toMatchObject({ playback: 'arp', inversionMode: 'guess_inv' });
  expect(settings.harmony).toMatchObject({
    submode: 'mixer',
    challengeId: 'major3',
    rootPolicy: 'scale',
    progressionId: 'jazz',
    mutedVoices: [true, false, false, false],
  });
  expect(settings.tuner).toMatchObject({
    drillMode: 'scale_walk',
    toleranceCents: 12,
    arpeggioQuality: 'minor',
  });
});

test('exact note form resets on a new round and piano preserves exact-octave grading', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('/');
  await page.getByRole('checkbox', { name: 'Exact octave', exact: true }).check();
  await page.getByRole('button', { name: 'Play note', exact: true }).click();
  await expect(page.getByText('What did you hear? Choose your answer.')).toBeVisible();
  await page.getByRole('combobox', { name: 'Note', exact: true }).selectOption('2');
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Choose both a note and an octave');
  await page.getByRole('button', { name: 'Skip note', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Note', exact: true })).toHaveValue('');
  await expect(page.getByRole('combobox', { name: 'Octave', exact: true })).toHaveValue('');
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect((await saved(page)).progress.quizzes.notes.attempts).toBe(0);
  await page.getByRole('button', { name: 'Play note', exact: true }).click();
  await expect(page.getByText('What did you hear? Choose your answer.')).toBeVisible();
  await page.locator('.piano-disclosure > summary').click();
  await page.getByRole('button', { name: 'Audition C4', exact: true }).click();
  expect((await saved(page)).progress.quizzes.notes.attempts).toBe(0);
  await page
    .getByRole('group', { name: 'Keyboard action' })
    .getByRole('button', { name: 'Answer', exact: true })
    .click();
  await page.getByRole('button', { name: 'Answer C4', exact: true }).click();
  await expect(page.locator('.feedback')).toContainText('Not quite');
  await page.getByRole('button', { name: 'Previous keyboard octave', exact: true }).click();
  await page.getByRole('button', { name: 'Answer C3', exact: true }).click();
  expect((await saved(page)).progress.quizzes.notes).toMatchObject({ attempts: 2, correct: 1 });
});

for (const width of [390, 1320]) {
  test(`progress reset preserves dismiss/focus and applies only on confirmation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/');
    const progress = page.locator('.progress-section:visible');
    await progress.locator('details > summary').first().click();
    const reset = progress.getByRole('button', { name: 'Reset progress', exact: true });
    const before = await saved(page);
    await reset.click();
    await expect(
      page.getByRole('dialog', { name: 'Reset your progress?', exact: true }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(reset).toBeFocused();
    expect((await saved(page)).progress).toEqual(before.progress);
    await reset.click();
    await page.getByRole('button', { name: 'Keep progress', exact: true }).click();
    await expect(reset).toBeFocused();
    await reset.click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Reset progress', exact: true })
      .click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(reset).toBeFocused();
    await expect(progress.getByRole('status')).toContainText('Progress reset. Musical setup kept.');
    expect((await saved(page)).settings).toEqual(before.settings);
  });
}
