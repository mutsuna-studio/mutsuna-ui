import { expect, test } from "vitest";
import { userEvent, within } from "storybook/test";
import { ChatAttachment } from "@mutsuna/ui/chat-attachment";
import { render } from "./render.js";
import { reactiveProps } from "./props.svelte.js";
const image = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="24"%3E%3Crect width="32" height="24" fill="seagreen"/%3E%3C/svg%3E';

test("download links retain filename and metadata, and unavailable files cannot be downloaded", () => {
  const view = render(ChatAttachment, { name: "資料.txt", mediaType: "text/plain", size: 2400, downloadUrl: "data:text/plain,sample" });
  const link = view.getByRole("link", { name: "資料.txtをダウンロード" });
  expect(link.getAttribute("download")).toBe("資料.txt");
  expect(link.getAttribute("href")).toBe("data:text/plain,sample");
  expect(view.getByText("text/plain · 2 KB")).toBeTruthy();
});

test("authenticated downloads delegate to the consumer and respect busy, error and disabled states", async () => {
  let downloads = 0;
  const props = reactiveProps({ name: "資料.txt", downloadUrl: "data:text/plain,unused", onDownload: () => { downloads++; }, downloading: false, disabled: false, error: "" });
  const view = render(ChatAttachment, props);
  const button = view.getByRole("button", { name: "資料.txtをダウンロード" }) as HTMLButtonElement;
  expect(view.queryByRole("link")).toBeNull();
  await userEvent.click(button);
  expect(downloads).toBe(1);
  props.downloading = true;
  await expect.poll(() => button.disabled).toBe(true);
  props.downloading = false;
  props.error = "取得できませんでした";
  await expect.poll(() => view.getByRole("alert").textContent).toBe("取得できませんでした");
  props.disabled = true;
  await expect.poll(() => button.disabled).toBe(true);
});

test("image preview opens with keyboard and restores focus after Escape", async () => {
  const view = render(ChatAttachment, { name: "写真.svg", previewUrl: image, downloadUrl: image });
  const trigger = view.getByRole("button", { name: "写真.svgを拡大表示" });
  expect(view.queryByText("写真.svg")).toBeNull();
  expect(view.queryByRole("link", { name: "写真.svgをダウンロード" })).toBeNull();
  trigger.focus();
  await userEvent.keyboard("{Enter}");
  const body = within(document.body);
  await expect.poll(() => body.queryByRole("dialog", { name: "写真.svg" })).not.toBeNull();
  const dialog = within(body.getByRole("dialog", { name: "写真.svg" }));
  expect(dialog.getByRole("img", { name: "写真.svg" })).toBeTruthy();
  expect(dialog.getByRole("link", { name: "写真.svgをダウンロード" }).getAttribute("download")).toBe("写真.svg");
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => document.activeElement).toBe(trigger);
});

test("broken previews preserve the downloadable file, and files without a URL expose a disabled action", async () => {
  const props = reactiveProps({ name: "写真.svg", previewUrl: "data:image/png;base64,broken", downloadUrl: "data:text/plain,sample" as string | undefined });
  const view = render(ChatAttachment, props);
  await expect.poll(() => view.queryByRole("button", { name: "写真.svgを拡大表示" })).toBeNull();
  expect(view.getByText(/プレビューを表示できません/)).toBeTruthy();
  expect(view.getByRole("link", { name: "写真.svgをダウンロード" })).toBeTruthy();
  props.downloadUrl = undefined;
  await expect.poll(() => (view.getByRole("button", { name: "写真.svgをダウンロード" }) as HTMLButtonElement).disabled).toBe(true);
});

test('attachment gallery starts at its own index and switches download metadata', async () => {
  const view = render(ChatAttachment, { name: '二枚目.svg', previewUrl: image, previewIndex: 1, previewImages: [
    { src: image, alt: '一枚目', title: '一枚目.svg', downloadUrl: image, downloadName: '一枚目.svg' },
    { src: image, alt: '二枚目', title: '二枚目.svg' },
  ] });
  await userEvent.click(view.getByRole('button', { name: '二枚目.svgを拡大表示' }));
  const body = within(document.body);
  await expect.poll(() => body.queryByRole('dialog', { name: '二枚目.svg' })).not.toBeNull();
  expect(body.getByRole('status').textContent).toBe('2 / 2');
  await userEvent.click(body.getByRole('button', { name: '前の画像' }));
  expect(body.getByRole('link', { name: '一枚目.svgをダウンロード' }).getAttribute('download')).toBe('一枚目.svg');
});
