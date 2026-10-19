import assert from 'node:assert/strict';
export async function verifyAdminShell(page, url) {
  const previous = page.viewportSize();
  try {
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 812 });
      await page.goto(`${url}shell/`);
      await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
      const content = page.locator('[data-slot="admin-shell-content"]');
      const footer = page.locator('[data-slot="admin-shell-footer"]');
      const footerTop = (await footer.boundingBox()).y;
      assert.equal((await footer.boundingBox()).height, 52);
      if (width >= 768) {
        await page.waitForFunction(() => {
          const account = document.querySelector('[data-slot="sidebar-footer"]');
          const footer = document.querySelector('[data-slot="admin-shell-footer"]');
          return account.getBoundingClientRect().bottom === innerHeight && account.getBoundingClientRect().height === footer.getBoundingClientRect().height + 8;
        });
      }
      if (width >= 768) {
        const account = page.locator('[data-slot="sidebar-footer"] button');
        assert.equal((await account.boundingBox()).height, 32);
        await account.click();
        await page.locator('[data-slot="dropdown-menu-content"]').getByText('user@example.com', { exact: true }).waitFor();
        await page.keyboard.press('Escape');
        assert.equal(await account.evaluate(el => document.activeElement === el), true);
      }
      assert.deepEqual(await content.evaluate(el => { const s = getComputedStyle(el); return [s.borderRadius, s.borderTopWidth, s.padding, s.scrollbarGutter, s.overflowY]; }), ['14px', '1px', '0px', 'auto', 'hidden']);
      const workspace = page.getByRole('region', { name: 'Shell workspace', exact: true });
      await workspace.evaluate(el => el.scrollTop = 240);
      assert.ok(await workspace.evaluate(el => el.scrollTop > 0));
      assert.equal(await content.evaluate(el => el.scrollTop), 0);
      assert.equal(await content.evaluate(el => el.scrollHeight), await content.evaluate(el => el.clientHeight));
      assert.equal((await footer.boundingBox()).y, footerTop);
      const action = page.getByRole('button', { name: 'Shell action', exact: true });
      await action.click();
      assert.equal(await page.getByLabel('Shell action count', { exact: true }).textContent(), '1');
      assert.equal(await action.evaluate(el => document.activeElement === el), true);
    }
    console.log('Astro AdminShellFrame: default rounded frame, inner scrolling, footer and focus passed');
  } finally {
    if (previous) await page.setViewportSize(previous);
    await page.goto(url);
    await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  }
}
