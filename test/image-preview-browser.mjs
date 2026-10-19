import assert from 'node:assert/strict';
import { verifyImagePreviewZoom } from './image-preview-zoom-browser.mjs';
export async function verifyImagePreview(page, url) {
  const previous = page.viewportSize();
  try {
    for (const [width, height] of [[375, 420], [844, 390], [1280, 720]]) {
      await page.setViewportSize({ width, height });
      await page.goto(`${url}image-preview/`);
      await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
      const trigger = page.getByRole('button', { name: 'Astro landscapeを拡大表示' });
      await page.getByRole('button', { name: 'Switch image orientation' }).click();
      await trigger.focus(); await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Astro landscape', exact: true });
      await dialog.waitFor();
      await dialog.getByRole('img', { name: 'Astro landscape' }).waitFor();
      const bounds = await dialog.boundingBox();
      assert(bounds.x >= 0 && bounds.x + bounds.width <= width && bounds.height <= height);
      assert.equal(await dialog.getByRole('link').count(), 0);
      assert.equal(await dialog.evaluate(el => [el, el.querySelector('.viewer-body'), el.querySelector('.viewer-info')].every(part => part.scrollHeight <= part.clientHeight + 1 && part.scrollWidth <= part.clientWidth + 1)), true);
      assert.equal(await dialog.getByRole('img').evaluate(el => getComputedStyle(el).objectFit), 'contain');
      await verifyImagePreviewZoom(page, dialog);
      await dialog.getByRole('region', { name: '画像', exact: true }).focus();
      await page.keyboard.press('+');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Astro landscapeを拡大表示');
      await page.keyboard.press('Space');
      assert.equal(await dialog.getByRole('region', { name: '画像', exact: true }).getAttribute('data-zoomed'), 'false');
      await dialog.getByRole('button', { name: '画像を閉じる' }).click();
      await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Astro landscapeを拡大表示');
    }
    console.log('Astro ImagePreview: wheel/drag/pinch, fit limits, reset, keyboard dismissal and focus restoration passed');
  } finally {
    if (previous) await page.setViewportSize(previous);
    await page.goto(url);
    await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  }
}
