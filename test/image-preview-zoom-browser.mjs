import assert from 'node:assert/strict';
export async function verifyImagePreviewZoom(page, dialog) {
  const surface = dialog.getByRole('region', { name: '画像', exact: true });
  const image = dialog.getByRole('img');
  await image.evaluate(el => el.complete || new Promise(resolve => el.addEventListener('load', resolve, { once: true })));
  await page.waitForFunction(() => {
    const el = document.querySelector('.image-viewer');
    return el && el.getAnimations({ subtree: true }).every(a => a.playState === 'finished' || a.playState === 'idle');
  });
  const box = await surface.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await surface.evaluate(el => el.addEventListener('wheel', event => {
    const rect = el.getBoundingClientRect();
    el.dataset.testWheelX = String(event.clientX - rect.left - rect.width / 2);
    el.dataset.testWheelY = String(event.clientY - rect.top - rect.height / 2);
  }));
  const transform = () => image.evaluate(el => { const m = new DOMMatrixReadOnly(getComputedStyle(el).transform); return { scale: m.a, x: m.e, y: m.f }; });
  const fitted = await image.evaluate(el => {
    const ratio = el.naturalWidth / el.naturalHeight;
    return { width: Math.min(el.clientWidth, el.clientHeight * ratio), height: Math.min(el.clientHeight, el.clientWidth / ratio) };
  });
  // Test each rendered-image corner at low zoom, where letterboxing used to snap the anchor.
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    await surface.focus(); await page.keyboard.press('0');
    const px = sx * (fitted.width / 2 - 3);
    const py = sy * (fitted.height / 2 - 3);
    await page.mouse.move(cx + px, cy + py);
    for (const delta of [-100, -100, 50]) {
      const before = await transform();
      await page.mouse.wheel(0, delta);
      await page.waitForFunction(previous => {
        const el = document.querySelector('.viewer-image');
        return el && new DOMMatrixReadOnly(getComputedStyle(el).transform).a !== previous;
      }, before.scale);
      const after = await transform();
      const actual = await surface.evaluate(el => ({ x: Number(el.dataset.testWheelX), y: Number(el.dataset.testWheelY) }));
      assert(Math.abs((actual.x - before.x) / before.scale - (actual.x - after.x) / after.scale) < 0.1, `horizontal cursor anchor stays fixed: ${JSON.stringify({px,py,before,after,box})}`);
      assert(Math.abs((actual.y - before.y) / before.scale - (actual.y - after.y) / after.scale) < 0.1, `vertical cursor anchor stays fixed: ${JSON.stringify({px,py,before,after,box})}`);
    }
    // Starting a drag must not undo the cursor anchor.
    const beforeDrag = await transform();
    await page.mouse.down(); await page.mouse.up();
    assert.deepEqual(await transform(), beforeDrag);
  }
  await surface.focus(); await page.keyboard.press('0');
  await page.mouse.move(cx + box.width / 8, cy);
  await page.mouse.wheel(0, -600);
  await page.waitForFunction(() => document.querySelector('.viewer-body')?.dataset.zoomed === 'true');
  const zoomed = await transform();
  assert(zoomed.scale > 1 && zoomed.scale <= 8);
  await page.mouse.move(cx, cy); await page.mouse.down();
  await page.mouse.move(cx + 55, cy + 25, { steps: 5 }); await page.mouse.up();
  const moved = await transform();
  assert(moved.x !== zoomed.x || moved.y !== zoomed.y, 'drag moves the zoomed image');
  assert.equal(await surface.getAttribute('data-dragging'), 'false');
  await surface.focus(); await page.keyboard.press('0');
  assert.equal((await transform()).scale, 1);
  await page.keyboard.press('+');
  assert((await transform()).scale > 1);
  for (let step = 0; step < Math.ceil(Math.max(fitted.width, fitted.height) * 1.25 / 80) + 1; step++) {
    await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowUp');
  }
  const corner = await transform();
  const currentFit = await surface.evaluate(el => { const img = el.querySelector('img'); const ratio = img.naturalWidth / img.naturalHeight; return { width: Math.min(el.clientWidth, el.clientHeight * ratio), height: Math.min(el.clientHeight, el.clientWidth / ratio) }; });
  assert(Math.abs(corner.x - currentFit.width * corner.scale / 2) < 1, `left image edge can be placed at viewport center: ${JSON.stringify({corner,fitted})}`);
  assert(Math.abs(corner.y - currentFit.height * corner.scale / 2) < 1, 'top image edge can be placed at viewport center');
  // Pointer panning has the same extra room, including drag back out of the corner.
  await page.mouse.move(cx, cy); await page.mouse.down();
  await page.mouse.move(cx - 25, cy - 20, { steps: 4 }); await page.mouse.up();
  const fromCorner = await transform();
  assert(Math.abs(fromCorner.x - (corner.x - 25)) < 1);
  assert(Math.abs(fromCorner.y - (corner.y - 20)) < 1);
  await page.keyboard.press('Home');
  assert.deepEqual(await transform(), { scale: 1, x: 0, y: 0 });
  await page.mouse.move(cx, cy); await page.mouse.wheel(0, -10000);
  assert.equal((await transform()).scale, 8, 'zoom has an upper bound');
  await page.mouse.wheel(0, 10000);
  assert.equal((await transform()).scale, 1, 'cannot shrink below fit');
  // Native touch input exercises pointer capture, pinch and cancellation in Chromium.
  const cdp = await page.context().newCDPSession(page);
  try {
    const point = (id, x, y) => ({ id, x, y });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(1, cx - 20, cy), point(2, cx + 20, cy)] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(1, cx - 60, cy), point(2, cx + 60, cy)] });
    await page.waitForFunction(() => document.querySelector('.viewer-body')?.dataset.zoomed === 'true');
    assert((await transform()).scale > 1);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    assert.equal(await surface.getAttribute('data-dragging'), 'false');
  } finally { await cdp.detach(); }
  await surface.focus(); await page.keyboard.press('0');
  assert.equal(await surface.evaluate(el => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1), true);
}
