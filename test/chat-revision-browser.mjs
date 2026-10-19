import assert from 'node:assert/strict';

export async function verifyChatRevision(page, url) {
  const previous = page.viewportSize();
  try {
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 950 });
      await page.goto(`${url}revision/`);
      await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
      await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), width === 375);
      const edit = page.getByRole('button', { name: 'Edit question', exact: true });
      await edit.click();
      const input = page.getByRole('textbox', { name: 'Astro question editor', exact: true });
      await page.waitForFunction(() => document.activeElement?.tagName === 'TEXTAREA');
      await input.fill('Discard this draft');
      await input.press('Escape');
      await page.waitForFunction(() => document.activeElement?.textContent.includes('Edit question'));
      assert.equal(await page.getByText('Original question', { exact: true }).count(), 1);
      await edit.click(); await input.fill('Edited question');
      await input.press('Control+Enter');
      assert.equal(await page.locator('[data-later-message]').count(), 1);
      await page.getByRole('alert').filter({ hasText: 'Edit failed' }).waitFor();
      assert.equal(await input.inputValue(), 'Edited question');
      assert.equal(await input.getAttribute('aria-invalid'), 'true');
      await page.getByRole('button', { name: '送信', exact: true }).click();
      await page.getByText('Edited question', { exact: true }).waitFor();
      assert.equal(await page.locator('[data-later-message]').count(), 0);
      await page.waitForFunction(() => document.activeElement?.textContent.includes('Edit question'));
      const regenerate = page.getByRole('button', { name: '回答を再生成', exact: true });
      await regenerate.click();
      await page.getByRole('button', { name: '生成を停止', exact: true }).click();
      await page.waitForFunction(() => document.activeElement?.textContent.includes('回答を再生成'));
      assert.equal(await page.getByText('Answer after edit', { exact: true }).count(), 1);
      await page.getByRole('button', { name: 'Fail next operation', exact: true }).click();
      await regenerate.click();
      await page.getByRole('alert').filter({ hasText: 'Regeneration failed' }).waitFor();
      assert.equal(await page.getByText('Answer after edit', { exact: true }).count(), 1);
      await page.getByRole('button', { name: '再生成を再試行', exact: true }).click();
      await page.getByText('Regenerated answer', { exact: true }).waitFor();
      assert.equal(await page.getByText('Edited question', { exact: true }).count(), 1);
      assert.ok(await page.getByRole('region', { name: 'Astro revision' }).evaluate(el => el.scrollWidth <= el.clientWidth), 'Revision UI fits narrow viewports');
      await page.goto(`${url}revision/`);
      await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
      await page.getByRole('button', { name: 'Use DM layout', exact: true }).click();
      await edit.click(); await input.fill('Edited direct message');
      assert.equal(await page.getByText('Later messages will be replaced after confirmation.', { exact: true }).count(), 0);
      await input.press('Control+Enter');
      await page.getByRole('alert').filter({ hasText: 'Edit failed' }).waitFor();
      assert.equal(await input.inputValue(), 'Edited direct message');
      await page.getByRole('button', { name: '送信', exact: true }).click();
      await page.getByText('Edited', { exact: true }).waitFor();
      assert.equal(await page.locator('[data-later-message]').count(), 1, 'DM editing retains later messages');
      assert.equal(await page.getByText('Original answer', { exact: true }).count(), 1);
      await edit.click(); await input.fill('Discard DM changes'); await input.press('Escape');
      await page.getByText('Edited direct message', { exact: true }).waitFor();
      assert.ok(await page.getByRole('region', { name: 'Astro revision' }).evaluate(el => el.scrollWidth <= el.clientWidth), 'Shared editor fits the DM bubble');
    }
    console.log('Astro chat revision: shared AI/DM editing, retained history and errors, regeneration/stop and keyboard focus passed');
  } finally {
    if (previous) await page.setViewportSize(previous);
    await page.goto(url);
    await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  }
}
