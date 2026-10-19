import assert from 'node:assert/strict';

export async function verifyChatLongAnswer(page, url) {
  const previous = page.viewportSize();
  try {
    await page.goto(`${url}long-answer/`);
    await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
    const article = page.getByRole('article', { name: 'Long answer assistant' });
    const history = page.getByLabel('Long answer history', { exact: true });
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 812 });
      await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), width === 375);
      for (const name of ['Long answer code', 'Long answer comparison']) {
        const block = page.getByRole('region', { name, exact: true });
        assert.ok(await block.evaluate(el => el.scrollWidth > el.clientWidth), `${name} scrolls locally`);
        await block.scrollIntoViewIfNeeded();
        await block.focus();
        await page.waitForFunction(name => document.activeElement?.getAttribute('aria-label') === name, name);
        await block.evaluate(el => el.scrollLeft = 0);
        const top = await history.evaluate(el => el.scrollTop);
        await block.press('ArrowRight');
        await page.waitForFunction(name => document.querySelector(`[aria-label="${name}"]`).scrollLeft > 0, name);
        assert.ok(Math.abs(await history.evaluate(el => el.scrollTop) - top) < 1, 'Horizontal scrolling preserves the conversation position');
      }
      assert.ok(await article.evaluate(el => el.scrollWidth <= el.clientWidth), 'The response fits its column');
      assert.ok(await history.evaluate(el => el.scrollWidth <= el.clientWidth), 'The conversation does not scroll horizontally');
      const copy = page.getByRole('button', { name: 'Copy complete answer', exact: true });
      await copy.focus();
      await page.keyboard.press('Enter');
      await page.getByRole('status').filter({ hasText: 'Answer copied' }).waitFor();
      assert.ok(await copy.evaluate(el => el === document.activeElement), 'Footer actions retain focus');
    }
    await history.focus();
    await history.press('Control+Home');
    await page.waitForFunction(() => document.querySelector('[aria-label="Long answer history"]').scrollTop === 0);
    const latest = page.getByRole('button', { name: '最新のメッセージへ', exact: true });
    await page.waitForFunction(button => button.getAttribute('data-active') === 'true', await latest.elementHandle());
    const before = await history.evaluate(el => el.scrollTop);
    await page.getByRole('button', { name: 'Append answer paragraph', exact: true }).click();
    await page.locator('[data-long-added]').waitFor();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.ok(Math.abs(await history.evaluate(el => el.scrollTop) - before) < 1, 'Appending to a long response preserves the reading position');
    await latest.click();
    await page.waitForFunction(() => { const el = document.querySelector('[aria-label="Long answer history"]'); return el.scrollHeight - el.clientHeight - el.scrollTop < 10; });
    console.log('Astro ChatMessage: long prose, local keyboard scrolling, footer actions and reading position passed');
  } finally {
    if (previous) await page.setViewportSize(previous);
    await page.goto(url);
    await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  }
}
