import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { userEvent, within } from "storybook/test";
import Preview from "../../stories/floating-action-menu-preview.svelte";
import Screen from "../../stories/chat-screen-preview.svelte";
import { render } from "./render.js";
import { reactiveProps } from "./props.svelte.js";

async function chooseTool(name: string) {
  const body = within(document.body);
  const direct = body.queryByRole("button", { name });
  if (direct) { await userEvent.click(direct); return direct; }
  const trigger = body.getByRole("button", { name: "会話の操作" });
  await userEvent.click(trigger);
  await userEvent.click(body.getByRole("menuitem", { name: name === "ステータスを変更" ? /^ステータス/ : name }));
  return trigger;
}

test("floating menu supports keyboard activation, selection, dismissal and focus restoration", async () => {
  const view = render(Preview, {});
  const body = within(document.body);
  const trigger = body.getByRole("button", { name: "操作メニュー" });
  trigger.focus(); await userEvent.keyboard("{Enter}");
  expect(body.getByRole("menu", { name: "操作メニュー" })).toBeTruthy();
  expect(body.getByRole("menuitem", { name: "利用できない操作" }).getAttribute("data-disabled")).not.toBeNull();
  await userEvent.click(body.getByRole("menuitem", { name: "全文をコピー" }));
  await expect.poll(() => view.getByLabelText("選択した操作").textContent).toBe("全文コピー");
  await expect.poll(() => document.activeElement).toBe(trigger);
  trigger.focus(); await userEvent.keyboard("{ArrowDown}"); await userEvent.keyboard("{Escape}");
  await expect.poll(() => body.queryByRole("menu")).toBeNull();
  await expect.poll(() => document.activeElement).toBe(trigger);
});

test("disabled state and viewport bounds are respected", async () => {
  const previous = { width: innerWidth, height: innerHeight };
  try {
    await page.viewport(320, 600);
    const props = reactiveProps({ disabled: true, position: { x: 9999, y: 9999 } });
    const view = render(Preview, props); view.target.style.cssText = "width:100%;padding:0";
    const body = within(document.body);
    const trigger = body.getByRole("button", { name: "操作メニュー" }) as HTMLButtonElement;
    expect(trigger.disabled).toBe(true); expect(trigger.getBoundingClientRect().right).toBeLessThanOrEqual(308); expect(trigger.getBoundingClientRect().bottom).toBeLessThanOrEqual(588);
    trigger.click(); expect(body.queryByRole("menu")).toBeNull();
    props.disabled = false;
    await expect.poll(() => trigger.disabled).toBe(false);
    await userEvent.click(trigger);
    const menu = body.getByRole("menu", { name: "操作メニュー" });
    const rect = menu.getBoundingClientRect(); expect(rect.left).toBeGreaterThanOrEqual(0); expect(rect.right).toBeLessThanOrEqual(320);
    props.disabled = true;
    await expect.poll(() => body.queryByRole("menu")).toBeNull();
  } finally { await page.viewport(previous.width, previous.height); }
});

test("menu hands focus to a pinned note and minimize returns to the shared launcher", async () => {
  render(Preview, {});
  const body = within(document.body);
  const trigger = body.getByRole("button", { name: "操作メニュー" });
  await userEvent.click(trigger); await userEvent.click(body.getByRole("menuitem", { name: "メモを開く" }));
  await expect.poll(() => body.queryByRole("dialog", { name: "作業メモ" })).not.toBeNull();
  const note = body.getByRole("dialog", { name: "作業メモ" });
  await expect.poll(() => note.contains(document.activeElement)).toBe(true);
  await userEvent.click(body.getByRole("button", { name: "メモを最小化" }));
  await expect.poll(() => document.activeElement).toBe(trigger);
  expect(document.querySelector("[data-slot=sticky-note-floating-trigger]")).toBeNull();
});

test.each([false, true])("conversation tools update status and open a PDF preview (assistant=%s)", async (assistant) => {
  const view = render(Screen, { layout: assistant ? "timeline" : "bubble", scenario: assistant ? "assistant" : "conversation" }); view.target.style.cssText = "width:100%;padding:0";
  const body = within(document.body);
  await chooseTool("ステータスを変更");
  await userEvent.click(body.getByRole("menuitemradio", { name: "完了" }));
  await expect.poll(() => body.queryByRole("menu")).toBeNull();
  const selected = view.target.querySelector('[data-slot=chat-thread-list-item][aria-current=true]')!;
  expect(within(selected as HTMLElement).getByText("完了")).toBeTruthy();
  expect(within(view.target.querySelector('[data-slot=chat-header]') as HTMLElement).getByText("完了")).toBeTruthy();
  if (assistant) expect(body.queryByRole("button", { name: "相手の動画" })).toBeNull();
  const origin = await chooseTool("PDFに書き出す");
  await expect.poll(() => body.queryByRole("dialog", { name: "会話をPDFに書き出す" })).not.toBeNull();
  expect((body.getByRole("textbox", { name: "ファイル名" }) as HTMLInputElement).value).toMatch(/\.pdf$/);
  expect(body.getByRole("region", { name: "PDFプレビュー" }).textContent).toContain("完了");
  await userEvent.click(body.getByRole("button", { name: "キャンセル" }));
  await expect.poll(() => document.activeElement).toBe(origin);
});

test("human conversation video controls remain UI only and dismiss back to tools", async () => {
  render(Screen, { layout: "bubble", scenario: "conversation" });
  const body = within(document.body);
  const origin = await chooseTool("相手の動画");
  await expect.poll(() => body.queryByRole("dialog", { name: "相手の動画" })).not.toBeNull();
  await userEvent.click(body.getByRole("button", { name: "動画を再生" }));
  expect(body.getByRole("button", { name: "動画を一時停止" }).getAttribute("aria-pressed")).toBe("true");
  await userEvent.click(body.getByRole("button", { name: "閉じる" }));
  await expect.poll(() => document.activeElement).toBe(origin);
});


test("wide screens expose shortcuts directly and narrow screens collapse them into the same menu", async () => {
  const previous = { width: innerWidth, height: innerHeight };
  try {
    await page.viewport(1280, 812);
    const view = render(Screen, { layout: "timeline", scenario: "assistant" }); view.target.style.cssText = "width:100%;padding:0";
    const body = within(document.body);
    const header = view.target.querySelector<HTMLElement>('[data-slot="chat-header"]')!;
    const toolbar = document.querySelector<HTMLElement>('[data-slot="floating-action-menu"]')!;
    expect(toolbar.dataset.placement).toBe("inline");
    expect(getComputedStyle(toolbar).position).toBe("static");
    expect(toolbar.closest('[data-slot="message-scroller-top-bar"]')).not.toBeNull();
    expect(toolbar.getBoundingClientRect().top).toBeGreaterThanOrEqual(header.getBoundingClientRect().bottom);
    expect(header.getBoundingClientRect().height).toBeLessThanOrEqual(72);
    expect(body.getByRole("button", { name: "会話のメモ" })).toBeTruthy();
    expect(body.getByRole("button", { name: "全文をコピー" })).toBeTruthy();
    expect(body.getByRole("button", { name: "PDFに書き出す" })).toBeTruthy();
    expect(body.queryByRole("button", { name: "会話の操作" })).toBeNull();
    await page.viewport(375, 812);
    await expect.poll(() => body.queryByRole("button", { name: "会話の操作" })).not.toBeNull();
    expect(body.queryByRole("button", { name: "全文をコピー" })).toBeNull();
    const more = body.getByRole("button", { name: "会話の操作" });
    expect(header.contains(more)).toBe(false);
    expect(more.getBoundingClientRect().top).toBeGreaterThanOrEqual(header.getBoundingClientRect().bottom);
    expect(header.scrollWidth).toBeLessThanOrEqual(header.clientWidth);
    await userEvent.click(body.getByRole("button", { name: "会話の操作" }));
    expect(body.getByRole("menuitem", { name: "全文をコピー" })).toBeTruthy();
    expect(body.getByRole("menuitem", { name: "PDFに書き出す" })).toBeTruthy();
    await userEvent.click(body.getByRole("menuitem", { name: "メモを開く" }));
    await expect.poll(() => body.queryByRole("dialog", { name: "会話のメモ" })).not.toBeNull();
    await userEvent.click(body.getByRole("button", { name: "メモを最小化" }));
    await expect.poll(() => document.activeElement).toBe(body.getByRole("button", { name: "会話の操作" }));
  } finally { await page.viewport(previous.width, previous.height); }
});


test("copy all includes the full long answer and reports success through a toast", async () => {
  const write = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
  try {
    render(Screen, { layout: "timeline", scenario: "assistant", longAnswer: true });
    await chooseTool("全文をコピー");
    await expect.poll(() => write.mock.calls.length).toBe(1);
    const copied = write.mock.calls[0][0];
    expect(copied).toContain("あなた"); expect(copied).toContain("アシスタント");
    expect(copied).toContain("最初に、読み手が知りたい結論を伝える");
    await expect.poll(() => within(document.body).queryByText("全文をコピーしました")).not.toBeNull();
  } finally { write.mockRestore(); }
});


test("icon tooltips describe each action on hover and on keyboard focus", async () => {
  const previous = { width: window.innerWidth, height: window.innerHeight };
  await page.viewport(1280, 812);
  try {
  render(Screen, { layout: "bubble", scenario: "conversation" });
  const body = within(document.body);
  for (const [name, description] of [["会話のメモ", "メモを開く"], ["ステータスを変更", "ステータスを変更"], ["相手の動画", "相手の動画"], ["全文をコピー", "全文をコピー"], ["PDFに書き出す", "PDFに書き出す"]]) {
    const button = body.getByRole("button", { name });
    expect(button.hasAttribute("title")).toBe(false);
    await userEvent.hover(button);
    await expect.poll(() => body.queryByRole("tooltip")?.textContent).toBe(description);
    await userEvent.unhover(button);
    await expect.poll(() => body.queryByRole("tooltip")).toBeNull();
  }
  const pdf = body.getByRole("button", { name: "PDFに書き出す" });
  pdf.focus();
  await expect.poll(() => body.queryByRole("tooltip")?.textContent).toBe("PDFに書き出す");
  await expect.poll(() => pdf.getAttribute("aria-describedby")).toBeTruthy();
  } finally { await page.viewport(previous.width, previous.height); }
});
