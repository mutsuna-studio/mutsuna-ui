import assert from 'node:assert/strict';
export async function verifyImageGallery(page, url) {
  const previous = page.viewportSize();
  try {
    for (const width of [375, 1280]) {
      await page.setViewportSize({ width, height: 720 });
      await page.goto(`${url}image-gallery/`);
      await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
      const trigger = page.getByRole('button', { name: 'Gallery thumbnailを拡大表示' });
      await trigger.click();
      await page.getByRole('dialog', { name: 'Gallery B', exact: true }).waitFor();
      const surface = page.getByRole('region', { name: '画像', exact: true });
      const loaded = async () => { await page.getByRole('dialog').getByRole('img').evaluate(async el => { await el.decode(); await new Promise(requestAnimationFrame); }); };
      await loaded();
      await surface.focus(); await page.keyboard.press('+');
      await page.keyboard.press('ArrowLeft');
      assert.equal(await page.getByRole('status').textContent(), '2 / 3', 'zoomed arrows pan');
      await page.getByRole('button', { name: '前の画像' }).click();
      assert.equal(await surface.getAttribute('data-zoomed'), 'false');
      assert.equal(await page.getByRole('link', { name: 'Gallery Aをダウンロード' }).getAttribute('download'), 'A.svg');
      await surface.focus(); await page.keyboard.press('ArrowRight');
      await page.getByRole('dialog', { name: 'Gallery B', exact: true }).waitFor();
      const box = await surface.boundingBox();
      const cy = box.y + box.height / 2;
      const cx = box.x + box.width / 2;
      const cdp = await page.context().newCDPSession(page);
      const touch = async (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
      try {
        // Swipe from B to C, including the image error state.
        await touch('touchStart', [{ id: 1, x: cx + 50, y: cy }]);
        await touch('touchMove', [{ id: 1, x: cx - 50, y: cy }]);
        await touch('touchEnd', []);
        await page.getByRole('alert').waitFor();
        assert.equal(await page.getByRole('status').textContent(), '3 / 3');
        await surface.focus(); await page.keyboard.press('ArrowLeft');
        await page.getByRole('dialog', { name: 'Gallery B', exact: true }).waitFor();
        await loaded();
        await surface.focus(); await page.keyboard.press('+');
        assert.equal(await surface.getAttribute('data-zoomed'), 'true');
        await touch('touchStart', [{ id: 1, x: cx + 50, y: cy }]);
        await touch('touchMove', [{ id: 1, x: cx - 50, y: cy }]);
        await touch('touchEnd', []);
        assert.equal(await page.getByRole('status').textContent(), '2 / 3', 'zoomed drag never changes page');
        await surface.focus(); await page.keyboard.press('0');
        await touch('touchStart', [{ id: 1, x: cx + 50, y: cy }]);
        await touch('touchMove', [{ id: 1, x: cx - 50, y: cy }]);
        await touch('touchCancel', []);
        assert.equal(await page.getByRole('status').textContent(), '2 / 3', 'cancelled swipe never changes page');
      } finally { await cdp.detach(); }
      await page.keyboard.press('Escape');
      await trigger.click();
      await page.getByRole('dialog', { name: 'Gallery B', exact: true }).waitFor();
      assert.equal(await surface.getAttribute('data-zoomed'), 'false');
      await page.keyboard.press('Escape');
    }
    console.log('Astro ImagePreview gallery: initial page, metadata, keyboard, swipe, errors and zoom/drag conflict checks passed');
  } finally {
    if (previous) await page.setViewportSize(previous);
    await page.goto(url); await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  }
}
