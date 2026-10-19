import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { userEvent, within } from "storybook/test";
import { ImagePreview } from "@mutsuna/ui/image-preview";
import { render } from "./render.js";
import { reactiveProps } from "./props.svelte.js";
const src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200"%3E%3Crect width="1600" height="1200" fill="seagreen"/%3E%3C/svg%3E';
for (const width of [375, 1280]) {
  test(`preview fits viewport and restores keyboard focus at ${width}px`, async () => {
    const previous = { width: innerWidth, height: innerHeight };
    try {
      await page.viewport(width, 620);
      const view = render(ImagePreview, { src, alt: '風景', title: '風景.svg', downloadUrl: src, downloadName: '風景.svg' });
      const trigger = view.getByRole('button', { name: '風景.svgを拡大表示' });
      trigger.focus(); await userEvent.keyboard('{Enter}');
      const body = within(document.body);
      await expect.poll(() => body.queryByRole('dialog', { name: '風景.svg' })).not.toBeNull();
      const dialog = body.getByRole('dialog', { name: '風景.svg' });
      const scope = within(dialog);
      await expect.poll(() => dialog.getBoundingClientRect().left).toBeGreaterThanOrEqual(0);
      expect(dialog.getBoundingClientRect().right).toBeLessThanOrEqual(width);
      expect(dialog.getBoundingClientRect().height).toBeLessThanOrEqual(620);
      if (width === 375) await expect.poll(() => dialog.getBoundingClientRect().height).toBeLessThan(450);
      expect(scope.getByRole('link', { name: '風景.svgをダウンロード' }).getAttribute('download')).toBe('風景.svg');
      await userEvent.keyboard('{Escape}');
      await expect.poll(() => document.activeElement).toBe(trigger);
      await userEvent.keyboard(' ');
      await userEvent.click(body.getByRole('button', { name: '画像を閉じる' }));
      await expect.poll(() => document.activeElement).toBe(trigger);
    } finally { await page.viewport(previous.width, previous.height); }
  });
}
test('optional downloads delegate to the consumer and respect loading and errors', async () => {
  let downloads = 0;
  const props = reactiveProps({ src, alt: '風景', onDownload: () => downloads++, downloading: false, error: '' });
  const view = render(ImagePreview, props);
  await userEvent.click(view.getByRole('button', { name: '風景を拡大表示' }));
  const body = within(document.body);
  const download = body.getByRole('button', { name: '風景をダウンロード' }) as HTMLButtonElement;
  await userEvent.click(download); expect(downloads).toBe(1);
  props.downloading = true;
  await expect.poll(() => download.disabled).toBe(true);
  props.downloading = false; props.error = '取得できませんでした';
  await expect.poll(() => body.queryByRole('alert')?.textContent).toBe('取得できませんでした');
});
test('no filename or download is required; broken sources recover when src changes', async () => {
  const props = reactiveProps({ src: 'data:image/png;base64,broken', alt: '風景', disabled: false });
  const view = render(ImagePreview, props);
  const trigger = view.getByRole('button', { name: '風景を拡大表示' }) as HTMLButtonElement;
  await expect.poll(() => trigger.disabled).toBe(true);
  props.src = src;
  await expect.poll(() => trigger.disabled).toBe(false);
  await userEvent.click(trigger);
  const dialog = within(within(document.body).getByRole('dialog', { name: '風景' }));
  expect(dialog.queryByRole('link')).toBeNull();
  expect(dialog.queryByRole('button', { name: /ダウンロード/ })).toBeNull();
  await userEvent.keyboard('{Escape}');
  props.disabled = true;
  await expect.poll(() => trigger.disabled).toBe(true);
});

test('controlled preview reports a failed full image and recovers with a replacement source', async () => {
  const props = reactiveProps({ src: 'data:image/png;base64,broken', alt: '画像', open: true });
  render(ImagePreview, props);
  const body = within(document.body);
  await expect.poll(() => body.queryByRole('alert')?.textContent).toBe('画像を表示できません。');
  props.src = src;
  await expect.poll(() => body.queryByRole('alert')).toBeNull();
  const dialog = within(body.getByRole('dialog', { name: '画像' }));
  await expect.poll(() => (dialog.getByRole('img', { name: '画像' }) as HTMLImageElement).naturalWidth).toBe(1600);
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => body.queryByRole('dialog', { name: '画像' })).toBeNull();
});


test('download URL works without a suggested filename', async () => {
  const view = render(ImagePreview, { src, alt: '風景', downloadUrl: src });
  await userEvent.click(view.getByRole('button', { name: '風景を拡大表示' }));
  const link = within(document.body).getByRole('link', { name: '風景をダウンロード' });
  expect(link.getAttribute('download')).toBe('');
});

for (const [width, height] of [[375, 420], [844, 390], [1280, 720]]) {
  test(`portrait and landscape images fit without internal scrolling at ${width}x${height}`, async () => {
    const previous = { width: innerWidth, height: innerHeight };
    try {
      await page.viewport(width, height);
      const props = reactiveProps({ src, alt: '確認用画像', title: '長いファイル名'.repeat(35), description: '長い説明文です。'.repeat(80), error: 'ダウンロードできませんでした。'.repeat(30), onDownload: () => {} });
      const view = render(ImagePreview, props);
      await userEvent.click(view.getByRole('button', { name: `${props.title}を拡大表示` }));
      for (const [imageWidth, imageHeight] of [[1200, 4000], [4000, 1200]]) {
        props.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${imageWidth}" height="${imageHeight}"><rect width="100%" height="100%" fill="seagreen"/></svg>`)}`;
        const dialog = within(document.body).getByRole('dialog', { name: props.title });
        const image = within(dialog).getByRole('img', { name: '確認用画像' }) as HTMLImageElement;
        await expect.poll(() => image.naturalWidth).toBe(imageWidth);
        await expect.poll(() => dialog.getBoundingClientRect().height).toBeLessThanOrEqual(height - 16);
        for (const element of [dialog, dialog.querySelector('.viewer-body')!, dialog.querySelector('.viewer-info')!]) {
          expect(element.scrollHeight).toBeLessThanOrEqual(element.clientHeight + 1);
          expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth + 1);
        }
        const body = dialog.querySelector('.viewer-body')!.getBoundingClientRect();
        expect(body.height).toBeGreaterThan(80);
        expect(image.getBoundingClientRect().height).toBeLessThanOrEqual(body.height);
        const close = within(dialog).getByRole('button', { name: '画像を閉じる' }).getBoundingClientRect();
        const download = within(dialog).getByRole('button', { name: /をダウンロード$/ }).getBoundingClientRect();
        expect(close.top).toBeGreaterThanOrEqual(0); expect(download.bottom).toBeLessThanOrEqual(height);
      }
    } finally { await page.viewport(previous.width, previous.height); }
  });
}

test('gallery navigates from initial image, updates metadata and download, and hides controls for one image', async () => {
  const props = reactiveProps({ src, alt: 'サムネイル', initialIndex: 1, images: [
    { src, alt: '画像A', title: 'A.svg', downloadUrl: src, downloadName: 'A.svg' },
    { src, alt: '画像B', title: 'B.svg' },
    { src: 'data:image/png;base64,broken', alt: '画像C', title: 'C.svg' },
  ] });
  const view = render(ImagePreview, props);
  const trigger = view.getByRole('button', { name: 'サムネイルを拡大表示' });
  await userEvent.click(trigger);
  const body = within(document.body);
  await expect.poll(() => body.queryByRole('dialog', { name: 'B.svg' })).not.toBeNull();
  expect(body.getByRole('status').textContent).toBe('2 / 3');
  expect(within(body.getByRole('dialog')).queryByRole('link')).toBeNull();
  await userEvent.click(body.getByRole('button', { name: '前の画像' }));
  await expect.poll(() => body.getByRole('dialog').getAttribute('aria-labelledby')).toBeTruthy();
  expect(body.getByRole('link', { name: 'A.svgをダウンロード' }).getAttribute('download')).toBe('A.svg');
  expect((body.getByRole('button', { name: '前の画像' }) as HTMLButtonElement).disabled).toBe(true);
  const surface = body.getByRole('region', { name: '画像' });
  surface.focus(); await userEvent.keyboard('+');
  expect(surface.dataset.zoomed).toBe('true');
  within(body.getByRole('dialog')).getByRole('img').dispatchEvent(new Event('load'));
  expect(surface.dataset.zoomed).toBe('true');
  await userEvent.keyboard('{ArrowRight}');
  expect(body.getByRole('status').textContent).toBe('1 / 3');
  await userEvent.click(body.getByRole('button', { name: '次の画像' }));
  await expect.poll(() => surface.dataset.zoomed).toBe('false');
  surface.focus(); await userEvent.keyboard('{ArrowRight}');
  await expect.poll(() => body.queryByRole('alert')?.textContent).toBe('画像を表示できません。');
  expect(body.getByRole('status').textContent).toBe('3 / 3');
  expect((body.getByRole('button', { name: '次の画像' }) as HTMLButtonElement).disabled).toBe(true);
  await userEvent.keyboard('{ArrowLeft}');
  expect(body.getByRole('status').textContent).toBe('2 / 3');
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => document.activeElement).toBe(trigger);
  await expect.poll(() => getComputedStyle(trigger).pointerEvents).not.toBe('none');
  await userEvent.click(trigger);
  await expect.poll(() => body.getByRole('status').textContent).toBe('2 / 3');
  props.images = [props.images[0]];
  await expect.poll(() => body.queryByRole('group', { name: '画像の切り替え' })).toBeNull();
  expect(body.getByRole('img', { name: '画像A' })).toBeTruthy();
});
