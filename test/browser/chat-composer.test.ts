import { expect, test, vi } from "vitest";
import { userEvent, within } from "storybook/test";
import { ChatComposer } from "@mutsuna/ui/chat-composer";
import Preview from "../../stories/chat-composer-preview.svelte";
import { render } from "./render.js";
import { reactiveProps } from "./props.svelte.js";

function expectCenteredIcon(button: Element) {
  const bounds = button.getBoundingClientRect();
  const icon = button.querySelector("svg")!.getBoundingClientRect();
  expect(icon.x + icon.width / 2).toBeCloseTo(bounds.x + bounds.width / 2, 1);
  expect(icon.y + icon.height / 2).toBeCloseTo(bounds.y + bounds.height / 2, 1);
}

test("composer aligns actions and applies one focus surface around the input and buttons", async () => {
  const view = render(ChatComposer, { onFilesSelect: () => {} });
  const input = view.getByRole("textbox", { name: "メッセージ" });
  const send = view.getByRole("button", { name: "メッセージを送信" });
  const attach = view.getByRole("button", { name: "追加" });
  const group = view.getByRole("group", { name: "メッセージの作成" });
  const center = (element: Element) => { const rect = element.getBoundingClientRect(); return rect.top + rect.height / 2; };
  expect(center(send)).toBeCloseTo(center(input), 0);
  expect(center(attach)).toBeCloseTo(center(send), 0);
  expectCenteredIcon(send);
  expectCenteredIcon(attach);
  const before = getComputedStyle(group).backgroundColor;
  input.focus();
  await expect.poll(() => getComputedStyle(group).backgroundColor).not.toBe(before);
  expect(getComputedStyle(input).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  expect(getComputedStyle(send.parentElement!).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  await userEvent.type(input, "1行目\n2行目\n3行目");
  expect(center(attach)).toBeCloseTo(center(send), 0);
  expect(send.getBoundingClientRect().bottom).toBeLessThan(group.getBoundingClientRect().bottom);
});

test("selected files can be removed, selected again and sent without text", async () => {
  const view = render(Preview, {});
  const picker = view.getByLabelText("添付ファイルを選択") as HTMLInputElement;
  const file = new File(["sample"], "画面案.pdf", { type: "application/pdf" });
  await userEvent.upload(picker, file);
  await expect.poll(() => view.getByRole("list", { name: "選択済みの添付ファイル" }).textContent).toContain("画面案.pdf");
  expect(picker.value).toBe("");
  expectCenteredIcon(view.getByRole("button", { name: "画面案.pdfを削除" }));
  await userEvent.click(view.getByRole("button", { name: "画面案.pdfを削除" }));
  await expect.poll(() => view.queryByRole("list", { name: "選択済みの添付ファイル" })).toBeNull();
  expect(document.activeElement).toBe(view.getByRole("textbox", { name: "メッセージ" }));
  await userEvent.upload(picker, file);
  await userEvent.click(view.getByRole("button", { name: "メッセージを送信" }));
  await expect.poll(() => view.getByRole("status").textContent).toContain("画面案.pdf");
  expect(view.queryByRole("list", { name: "選択済みの添付ファイル" })).toBeNull();
});

test("pending/error attachments block sending and sending locks input and attachment actions", async () => {
  const props = reactiveProps({ value: "本文", attachments: [{ id: "a", name: "資料.pdf", status: "uploading" as "uploading" | "error" | "ready" }], sending: false, onFilesSelect: () => {} });
  const view = render(ChatComposer, props);
  expect((view.getByRole("button", { name: "メッセージを送信" }) as HTMLButtonElement).disabled).toBe(true);
  props.attachments[0].status = "error";
  await expect.poll(() => view.getByRole("alert").textContent).toContain("もう一度添付");
  props.attachments[0].status = "ready";
  await expect.poll(() => (view.getByRole("button", { name: "メッセージを送信" }) as HTMLButtonElement).disabled).toBe(false);
  expectCenteredIcon(view.getByRole("button", { name: "メッセージを送信" }));
  props.sending = true;
  await expect.poll(() => (view.getByRole("textbox", { name: "メッセージ" }) as HTMLTextAreaElement).disabled).toBe(true);
  expect((view.getByRole("button", { name: "追加" }) as HTMLButtonElement).disabled).toBe(true);
});


test("add popover supports keyboard dismissal and closes before opening the file picker", async () => {
  const view = render(ChatComposer, { onFilesSelect: () => {} });
  const trigger = view.getByRole("button", { name: "追加" });
  trigger.focus();
  await userEvent.keyboard("{Enter}");
  const body = within(document.body);
  await expect.poll(() => body.queryByRole("dialog", { name: "メッセージに追加" })).not.toBeNull();
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => trigger.getAttribute("aria-expanded")).toBe("false");
  await expect.poll(() => document.activeElement).toBe(trigger);
  await userEvent.click(trigger);
  const picker = view.getByLabelText("添付ファイルを選択") as HTMLInputElement;
  let opened = false;
  picker.onclick = event => { event.preventDefault(); opened = true; };
  await userEvent.click(body.getByRole("button", { name: "ファイルを添付" }));
  expect(opened).toBe(true);
  await expect.poll(() => trigger.getAttribute("aria-expanded")).toBe("false");
});


test("consumer actions work in the add popover", async () => {
  const view = render(Preview, {});
  const trigger = view.getByRole("button", { name: "追加" });
  await userEvent.click(trigger);
  await userEvent.click(within(document.body).getByRole("button", { name: "定型文を挿入" }));
  await expect.poll(() => (view.getByRole("textbox", { name: "メッセージ" }) as HTMLTextAreaElement).value).toBe("お疲れさまです。");
  await expect.poll(() => trigger.getAttribute("aria-expanded")).toBe("false");
});

test("composer separates wrapped text and attachments without oscillating on resize", async () => {
  const props = reactiveProps({ value: "了解しました。", attachments: [] as { id: string; name: string }[], onFilesSelect: () => {} });
  const view = render(ChatComposer, props);
  const form = view.getByRole("textbox", { name: "メッセージ" }).closest("form")!;
  const input = view.getByRole("textbox", { name: "メッセージ" });
  const send = view.getByRole("button", { name: "メッセージを送信" });
  form.style.width = "340px";
  await expect.poll(() => form.dataset.expanded).toBe("false");
  props.value = "画面構成の確認をお願いします。気になる点があれば教えてください。";
  await expect.poll(() => form.dataset.expanded).toBe("true");
  await expect.poll(() => input.getBoundingClientRect().bottom <= send.getBoundingClientRect().top).toBe(true);
  expect(input.getBoundingClientRect().width).toBeGreaterThan(300);
  expectCenteredIcon(send);
  form.style.width = "800px";
  await expect.poll(() => form.dataset.expanded).toBe("false");
  props.value = "1行目\n2行目";
  await expect.poll(() => form.dataset.expanded).toBe("true");
  props.value = "";
  props.attachments = [{ id: "file", name: "資料.pdf" }];
  await expect.poll(() => form.dataset.expanded).toBe("true");
  props.attachments = [];
  await expect.poll(() => form.dataset.expanded).toBe("false");
});

test("layout animation preserves focus and selection and settles after a quick reversal", async () => {
  const view = render(ChatComposer, { value: "画面構成の確認をお願いします。気になる点があれば教えてください。", onFilesSelect: () => {} });
  const input = view.getByRole("textbox", { name: "メッセージ" }) as HTMLTextAreaElement;
  const form = input.closest("form")!;
  const box = input.closest("[data-slot=input-group]")!;
  form.style.width = "800px";
  await expect.poll(() => form.dataset.expanded).toBe("false");
  await Promise.all(box.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})));
  input.focus();
  input.setSelectionRange(3, 8);
  form.style.width = "340px";
  await expect.poll(() => form.dataset.expanded).toBe("true");
  expect(box.getAnimations().some(animation => animation.playState === "running")).toBe(true);
  form.style.width = "800px";
  await expect.poll(() => form.dataset.expanded).toBe("false");
  await expect.poll(() => box.getAnimations().filter(animation => animation.playState === "running").length).toBe(0);
  expect(document.activeElement).toBe(input);
  expect([input.selectionStart, input.selectionEnd]).toEqual([3, 8]);
  expect((box as HTMLElement).style.height).toBe("");
});

test("image attachments show previews, upload states and recover from a broken preview", async () => {
  const previewUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="24"%3E%3Crect width="32" height="24" fill="seagreen"/%3E%3C/svg%3E';
  const props = reactiveProps({ attachments: [
    { id: "image", name: "写真.jpg", previewUrl, status: "uploading" as "uploading" | "ready" | "error", error: "画像を送信できませんでした。" },
    { id: "pdf", name: "資料.pdf" },
  ], onRemoveAttachment: (id: string) => { props.attachments = props.attachments.filter(file => file.id !== id); } });
  const view = render(ChatComposer, props);
  view.getByRole("textbox", { name: "メッセージ" }).closest("form")!.style.width = "340px";
  const list = view.getByRole("list", { name: "選択済みの添付ファイル" });
  await expect.poll(() => list.scrollWidth).toBeGreaterThan(list.clientWidth);
  expect(list.scrollHeight).toBeLessThanOrEqual(list.clientHeight + 1);
  const send = view.getByRole("button", { name: "メッセージを送信" }) as HTMLButtonElement;
  await expect.poll(() => (view.getByRole("img", { name: "写真.jpg" }) as HTMLImageElement).naturalWidth).toBe(32);
  expect(send.disabled).toBe(true);
  expect(view.getByText("アップロード中")).toBeTruthy();
  props.attachments[0].status = "error";
  await expect.poll(() => view.getByRole("alert").textContent).toContain("画像を送信できませんでした。");
  props.attachments[0].previewUrl = "data:image/png;base64,broken";
  await expect.poll(() => view.queryByRole("img", { name: "写真.jpg（プレビューを表示できません）" })).not.toBeNull();
  props.attachments[0].previewUrl = previewUrl;
  props.attachments[0].status = "ready";
  await expect.poll(() => (view.getByRole("img", { name: "写真.jpg" }) as HTMLImageElement).naturalWidth).toBe(32);
  await expect.poll(() => send.disabled).toBe(false);
  expectCenteredIcon(view.getByRole("button", { name: "写真.jpgを削除" }));
  await userEvent.click(view.getByRole("button", { name: "写真.jpgを削除" }));
  await expect.poll(() => view.queryByRole("img", { name: "写真.jpg" })).toBeNull();
  expect(document.activeElement).toBe(view.getByRole("textbox", { name: "メッセージ" }));
  expect(view.getByText("資料.pdf")).toBeTruthy();
});

test('selected images share a gallery while documents are excluded', async () => {
  const svg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="24"%3E%3Crect width="32" height="24" fill="seagreen"/%3E%3C/svg%3E';
  const view = render(ChatComposer, { attachments: [{ id: 'a', name: 'A.svg', previewUrl: svg }, { id: 'doc', name: 'notes.pdf' }, { id: 'b', name: 'B.svg', previewUrl: svg }] });
  await userEvent.click(view.getByRole('button', { name: 'B.svgを拡大表示' }));
  const body = within(document.body);
  await expect.poll(() => body.queryByRole('dialog', { name: 'B.svg' })).not.toBeNull();
  expect(body.getByRole('status').textContent).toBe('2 / 2');
  await userEvent.click(body.getByRole('button', { name: '前の画像' }));
  expect(within(body.getByRole('dialog')).getByRole('img', { name: 'A.svg' })).toBeTruthy();
});

for (const width of [240, 640]) {
  test(`notice visibility preserves input position, including wrapped text at ${width}px`, async () => {
    const props = reactiveProps({ notice: "送信前に内容をご確認ください。注意書きが折り返される幅でも入力位置を維持します。", value: "" });
    const view = render(ChatComposer, props);
    view.target.style.width = `${width}px`;
    const input = view.getByRole("textbox", { name: "メッセージ" });
    const note = view.getByText(props.notice);
    const top = input.getBoundingClientRect().top;
    const form = view.target.querySelector("[data-slot=chat-composer]")!;
    const box = view.getByRole("group", { name: "メッセージの作成" });
    expect(form.getBoundingClientRect().height).toBeCloseTo(box.getBoundingClientRect().height, 0);
    expect(note.getBoundingClientRect().bottom).toBeLessThanOrEqual(box.getBoundingClientRect().top);
    expect(input.getAttribute("aria-describedby")).toBe(note.id);
    expect(getComputedStyle(note).visibility).toBe("hidden");
    input.focus();
    await expect.poll(() => getComputedStyle(note).visibility).toBe("visible");
    expect(input.getBoundingClientRect().top).toBeCloseTo(top, 0);
    await userEvent.type(input, "本文");
    input.blur();
    await expect.poll(() => getComputedStyle(note).visibility).toBe("visible");
    expect(input.getBoundingClientRect().top).toBeCloseTo(top, 0);
    props.value = "";
    await expect.poll(() => getComputedStyle(note).visibility).toBe("hidden");
    expect(input.getBoundingClientRect().top).toBeCloseTo(top, 0);
  });
}
test("omitting notice adds no notice region or description", () => {
  const view = render(ChatComposer, {});
  expect(view.target.querySelector("[data-slot=chat-composer-notice]")).toBeNull();
  expect(view.getByRole("textbox", { name: "メッセージ" }).hasAttribute("aria-describedby")).toBe(false);
});

for (const submitOn of ["enter", "mod-enter"] as const) {
  test(`${submitOn}: submission and newline keys respect the selected setting`, async () => {
    const onSend = vi.fn();
    const view = render(ChatComposer, { value: "本文", submitOn, onSend });
    const input = view.getByRole("textbox", { name: "メッセージ" }) as HTMLTextAreaElement;
    input.focus();
    await userEvent.keyboard("{End}{Shift>}{Enter}{/Shift}");
    expect(input.value).toBe("本文\n");
    expect(onSend).not.toHaveBeenCalled();
    if (submitOn === "mod-enter") {
      await userEvent.keyboard("{Enter}");
      expect(input.value).toBe("本文\n\n");
      expect(onSend).not.toHaveBeenCalled();
      await userEvent.keyboard("{Control>}{Enter}{/Control}");
      expect(onSend).toHaveBeenCalledTimes(1);
      await userEvent.keyboard("{Meta>}{Enter}{/Meta}");
      expect(onSend).toHaveBeenCalledTimes(2);
    } else {
      await userEvent.keyboard("{Enter}");
      expect(onSend).toHaveBeenCalledTimes(1);
    }
    expect(onSend.mock.calls[0][0]).toEqual({ text: "本文", attachments: [] });
  });
  test(`${submitOn}: IME composition and key repeats never submit`, () => {
    const onSend = vi.fn();
    const view = render(ChatComposer, { value: "変換中", submitOn, onSend });
    const input = view.getByRole("textbox", { name: "メッセージ" });
    for (const options of [{ isComposing: true }, { keyCode: 229 }, { repeat: true }]) {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", ctrlKey: submitOn === "mod-enter", bubbles: true, cancelable: true, ...options }));
    }
    expect(onSend).not.toHaveBeenCalled();
  });
}
test("changing the submission setting preserves the input and draft", async () => {
  const onSend = vi.fn();
  const props = reactiveProps({ submitOn: "mod-enter" as "enter" | "mod-enter", value: "下書き", onSend });
  const view = render(ChatComposer, props);
  const input = view.getByRole("textbox", { name: "メッセージ" }) as HTMLTextAreaElement;
  props.submitOn = "enter";
  await expect.poll(() => props.submitOn).toBe("enter");
  input.focus();
  await userEvent.keyboard("{Enter}");
  expect(onSend).toHaveBeenCalledTimes(1);
  expect(view.getByRole("textbox", { name: "メッセージ" })).toBe(input);
  expect(input.value).toBe("下書き");
});
test("keyboard submission uses the button's empty, locked and attachment readiness rules", async () => {
  const onSend = vi.fn();
  const props = reactiveProps({ submitOn: "enter" as const, value: "", disabled: false, sending: false, attachments: [] as { id: string; name: string; status: "ready" | "uploading" | "error" }[], onSend });
  const view = render(ChatComposer, props);
  const input = view.getByRole("textbox", { name: "メッセージ" });
  const press = () => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
  press(); expect(onSend).not.toHaveBeenCalled();
  props.attachments = [{ id: "a", name: "資料.pdf", status: "uploading" }];
  await expect.poll(() => view.queryByText("資料.pdf")).not.toBeNull();
  press(); expect(onSend).not.toHaveBeenCalled();
  props.attachments[0].status = "error";
  await expect.poll(() => view.queryByRole("alert")).not.toBeNull();
  press(); expect(onSend).not.toHaveBeenCalled();
  props.attachments[0].status = "ready";
  await expect.poll(() => (view.getByRole("button", { name: "メッセージを送信" }) as HTMLButtonElement).disabled).toBe(false);
  press(); expect(onSend).toHaveBeenCalledTimes(1);
  props.sending = true;
  await expect.poll(() => (input as HTMLTextAreaElement).disabled).toBe(true);
  press(); expect(onSend).toHaveBeenCalledTimes(1);
  props.sending = false; props.disabled = true;
  await expect.poll(() => (view.getByRole("button", { name: "メッセージを送信" }) as HTMLButtonElement).disabled).toBe(true);
  press(); expect(onSend).toHaveBeenCalledTimes(1);
});
test("consumer key handlers can prevent keyboard submission", async () => {
  const onSend = vi.fn();
  const onkeydown = vi.fn((event: KeyboardEvent) => event.preventDefault());
  const view = render(ChatComposer, { value: "本文", submitOn: "enter", onSend, onkeydown });
  view.getByRole("textbox", { name: "メッセージ" }).focus();
  await userEvent.keyboard("{Enter}");
  expect(onkeydown).toHaveBeenCalled();
  expect(onSend).not.toHaveBeenCalled();
});
