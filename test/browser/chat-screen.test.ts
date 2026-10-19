import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { userEvent, within } from "storybook/test";
import ChatScreenPreview from "../../stories/chat-screen-preview.svelte";
import ChatAppShellPreview from "../../stories/chat-app-shell-preview.svelte";
import { render } from "./render.js";
import { reactiveProps } from "./props.svelte.js";

for (const layout of ["timeline", "bubble"] as const) {
  test(`${layout}: history remains usable in narrow and short viewports`, async () => {
    const previous = { width: innerWidth, height: innerHeight };
    try {
      await page.viewport(375, 812);
      const view = render(ChatScreenPreview, { layout });
      view.target.style.cssText = "width:100%;padding:0";
      const history = view.getByLabelText("メッセージ履歴");
      const input = view.getByRole("textbox", { name: "メッセージ" });
      const footer = input.closest("footer")!;
      await userEvent.type(input, "長い履歴でも入力欄と重ならずに読めることを確認します。".repeat(12));
      await userEvent.click(view.getByRole("button", { name: "メッセージを送信" }));
      for (const [width, height] of [[375, 812], [375, 420], [1280, 360]]) {
        await page.viewport(width, height);
        expect(footer.getBoundingClientRect().bottom).toBeLessThanOrEqual(height + 1);
        expect(view.queryByText("AIの回答には誤りが含まれる場合があります。重要な内容は確認してください。")).toBeNull();
        await expect.poll(() => getComputedStyle(history).overflowY).toBe("auto");
        expect(history.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(footer.getBoundingClientRect().bottom - 1);
        const glassElement = footer.querySelector<HTMLElement>(".composer-glass")!;
        const glass = getComputedStyle(glassElement);
        expect([...glassElement.children].map(layer => getComputedStyle(layer).backdropFilter)).toEqual(["blur(2px)", "blur(6px)", "blur(12px)"]);
        expect(glass.boxShadow).toBe("none");
        expect(glass.borderRadius).toBe("0px");
        expect(glass.left).toBe("0px");
        expect(glass.right).toBe("0px");
        expect(glass.bottom).toBe("0px");
        expect(glass.backgroundColor).toBe("rgba(0, 0, 0, 0)");
        expect(getComputedStyle(footer).backgroundColor).toBe("rgba(0, 0, 0, 0)");
        await expect.poll(() => footer.getBoundingClientRect().height).toBeLessThan(116);
        expect(parseFloat(getComputedStyle(input).fontSize)).toBeGreaterThanOrEqual(16);
        expect(history.scrollWidth).toBeLessThanOrEqual(history.clientWidth);
        history.scrollTop = history.scrollHeight;
        await expect.poll(() => history.scrollTop).toBeGreaterThan(0);
        const date = view.getByText("10月17日（土）", { exact: true });
        expect(date.closest('[data-slot="message-scroller-top-bar"]')).not.toBeNull();
        expect(date.getBoundingClientRect().top).toBeGreaterThanOrEqual(history.getBoundingClientRect().top);
        expect(date.closest('[data-slot="message-scroller-top-bar"]')?.getAttribute("data-placement")).toBe("overlay");
        expect(date.getBoundingClientRect().bottom).toBeLessThan(footer.getBoundingClientRect().top);
        const last = view.getAllByRole("article").at(-1)!;
        await expect.poll(() => glassElement.getBoundingClientRect().top - last.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(12);
        const point = input.getBoundingClientRect();
        expect(footer.contains(document.elementFromPoint(point.left + point.width / 2, point.top + point.height / 2))).toBe(true);
        history.dispatchEvent(new WheelEvent("wheel", { deltaY: -600, bubbles: true }));
        history.scrollTop = 0;
        const latest = view.target.querySelector<HTMLElement>('[data-slot="message-scroller-button"][data-direction="end"]')!;
        await expect.poll(() => latest.dataset.active).toBe("true");
        input.focus();
        const note = view.target.querySelector<HTMLElement>('[data-slot="chat-composer-notice"]')!;
        await expect.poll(() => input.closest('[data-slot="input-group"]')!.getBoundingClientRect().top - latest.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(4);
        const noteBounds = note.getBoundingClientRect();
        const latestBounds = latest.getBoundingClientRect();
        expect(Math.max(noteBounds.left, latestBounds.left) < Math.min(noteBounds.right, latestBounds.right) && Math.max(noteBounds.top, latestBounds.top) < Math.min(noteBounds.bottom, latestBounds.bottom)).toBe(false);
      }
    } finally {
      await page.viewport(previous.width, previous.height);
    }
  });
}


for (const width of [375, 1280]) {
  test(`ai: outline navigates to questions and updates with the conversation at ${width}px`, async () => {
    const previous = { width: innerWidth, height: innerHeight };
    try {
      await page.viewport(width, 812);
      const view = render(ChatScreenPreview, { layout: "timeline", scenario: "assistant" });
      view.target.style.cssText = "width:100%;padding:0";
      const input = view.getByRole("textbox", { name: "メッセージ" });
      await userEvent.type(input, "目次から戻るための長い質問です。".repeat(35));
      await userEvent.click(view.getByRole("button", { name: "メッセージを送信" }));
      const trigger = view.getByRole("navigation", { name: "会話の目次" }).querySelector<HTMLButtonElement>(".outline-mark")!;
      await page.getByRole("button", { name: /^1：新しい機能/ }).hover();
      await expect.poll(() => within(document.body).queryByRole("dialog", { name: "会話の目次" })).not.toBeNull();
      const dialog = within(document.body).getByRole("dialog", { name: "会話の目次" });
      expect(within(dialog).getAllByRole("button")).toHaveLength(3);
      await userEvent.click(within(dialog).getByRole("button", { name: /1 新しい機能/ }));
      const first = view.getAllByRole("article")[0];
      await expect.poll(() => document.activeElement).toBe(first.closest('[data-slot="message-scroller-item"]'));
      const history = view.getByLabelText("メッセージ履歴");
      await expect.poll(() => first.getBoundingClientRect().top - history.getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
      const bar = view.target.querySelector<HTMLElement>('[data-slot="message-scroller-top-bar"]')!;
      expect(first.getBoundingClientRect().top).toBeGreaterThanOrEqual(bar.getBoundingClientRect().bottom);
      expect(first.getBoundingClientRect().top - bar.getBoundingClientRect().bottom).toBeLessThanOrEqual(24);
      await expect.poll(() => trigger.getAttribute("aria-expanded")).toBe("false");
      trigger.focus();
      await userEvent.keyboard("{Escape}");
      await expect.poll(() => document.activeElement).toBe(trigger);
      const rail = view.getByRole("navigation", { name: "会話の目次" });
      expect(rail.getBoundingClientRect().right).toBeLessThanOrEqual(width);
      expect(history.scrollWidth).toBeLessThanOrEqual(history.clientWidth);
      const marks = rail.querySelectorAll(".outline-mark");
      await expect.poll(() => marks[0].getAttribute("aria-current")).toBe("location");
      history.scrollTop = history.scrollHeight;
      await expect.poll(() => marks[marks.length - 1].getAttribute("aria-current")).toBe("location");
      if (width < 768) await userEvent.click(view.getByRole("button", { name: "会話一覧を開く" }));
      await userEvent.click(view.getByRole("button", { name: /^新しい会話$/ }));

      expect(view.getByRole("navigation", { name: "会話の目次" }).querySelectorAll(".outline-mark")).toHaveLength(0);
    } finally {
      await page.viewport(previous.width, previous.height);
    }
  });
}


for (const width of [375, 1280]) {
  test(`ai: the pinned question follows the answer and keeps long text compact at ${width}px`, async () => {
    const previous = { width: innerWidth, height: innerHeight };
    try {
      await page.viewport(width, 560);
      const view = render(ChatScreenPreview, { layout: "timeline", scenario: "assistant" });
      view.target.style.cssText = "width:100%;padding:0";
      expect(view.queryByRole("complementary", { name: "回答中の質問" })).toBeNull();
      const question = "この回答に対応する質問を確認します。".repeat(30);
      await userEvent.type(view.getByRole("textbox", { name: "メッセージ" }), question);
      await userEvent.click(view.getByRole("button", { name: "メッセージを送信" }));
      await expect.poll(() => view.queryByRole("complementary", { name: "回答中の質問" })?.textContent).toContain(question);
      const context = view.getByRole("complementary", { name: "回答中の質問" });
      const history = view.getByLabelText("メッセージ履歴");
      expect(context.getBoundingClientRect().height).toBeLessThanOrEqual(44);
      expect(context.closest('[data-slot="message-scroller-top-bar"]')).not.toBeNull();
      const actions = view.target.querySelector<HTMLElement>('[data-slot="message-scroller-top-bar-actions"]')!;
      expect(context.getBoundingClientRect().right + 7).toBeLessThanOrEqual(actions.getBoundingClientRect().left);
      expect(context.getBoundingClientRect().top).toBeGreaterThanOrEqual(history.getBoundingClientRect().top);
      expect(context.querySelector("time")?.textContent).toBe("10/17");
      expect(view.queryByText("10月17日（土）", { exact: true })).toBeNull();
      const fullText = context.querySelector<HTMLElement>(".context-text")!;
      await page.getByRole("button", { name: "質問の全文へ移動" }).hover();
      await expect.poll(() => getComputedStyle(fullText).whiteSpace).toBe("pre-wrap");
      expect(fullText.textContent).toBe(question);
      expect(context.querySelectorAll(".context-text")).toHaveLength(1);
      expect(within(document.body).queryByRole("tooltip", { name: "質問全文" })).toBeNull();
      expect(context.getBoundingClientRect().height).toBeGreaterThan(44);
      if (width === 375) expect(fullText.scrollHeight).toBeGreaterThan(fullText.clientHeight);
      await page.getByRole("textbox", { name: "メッセージ" }).hover();
      await expect.poll(() => context.getBoundingClientRect().height).toBe(44);
      await userEvent.keyboard("{Shift}");
      view.getByRole("button", { name: "質問の全文へ移動" }).focus();
      await expect.poll(() => getComputedStyle(fullText).whiteSpace).toBe("pre-wrap");
      await userEvent.click(view.getByRole("button", { name: "質問の全文へ移動" }));
      await expect.poll(() => view.queryByRole("complementary", { name: "回答中の質問" })?.textContent ?? "").not.toContain(question);
      expect(document.activeElement?.getAttribute("data-outline-message")).toBe("100");
      history.scrollTop = 0;
      await expect.poll(() => view.queryByRole("complementary", { name: "回答中の質問" })).toBeNull();
      history.scrollTop = history.scrollHeight;
      await expect.poll(() => view.queryByRole("complementary", { name: "回答中の質問" })?.textContent).toContain(question);
    } finally {
      await page.viewport(previous.width, previous.height);
    }
  });
}

test("mobile message actions reply with a quote, navigate back, toggle a reaction and copy", async () => {
  const previous = { width: innerWidth, height: innerHeight };
  const clipboard = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
  try {
    await page.viewport(375, 812);
    const view = render(ChatScreenPreview, { layout: "bubble" });
    view.target.style.cssText = "width:100%;padding:0";
    const original = view.getAllByRole("article").find(item => item.getAttribute("data-outline-message") === "1")!;
    const first = within(original);
    const more = first.getByRole("button", { name: "その他の操作" });
    const body = within(document.body);
    await userEvent.click(more);
    await userEvent.click(within(body.getByRole("dialog", { name: "佐藤 美咲のメッセージの操作" })).getByRole("button", { name: "リプライ" }));
    await expect.poll(() => view.queryByRole("region", { name: "返信先" })).not.toBeNull();
    const input = view.getByRole("textbox", { name: "メッセージ" });
    const replyContext = view.getByRole("region", { name: "返信先" });
    expect(replyContext.closest("[data-slot=input-group]")).toBe(input.closest("[data-slot=input-group]"));
    const composerBounds = input.closest("[data-slot=input-group]")!.getBoundingClientRect();
    const dismissBounds = within(replyContext).getByRole("button", { name: "リプライを解除" }).getBoundingClientRect();
    expect(dismissBounds.right).toBeLessThanOrEqual(composerBounds.right - 4);
    expect(dismissBounds.left).toBeGreaterThanOrEqual(composerBounds.left + 4);
    expect(getComputedStyle(replyContext).borderInlineStartWidth).toBe("0px");
    expect(getComputedStyle(replyContext).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expect.poll(() => document.activeElement).toBe(input);
    await expect.poll(() => getComputedStyle(input).pointerEvents).not.toBe("none");
    await userEvent.type(input, "引用して返信します。");
    await userEvent.click(view.getByRole("button", { name: "メッセージを送信" }));
    await expect.poll(() => view.queryByRole("region", { name: "返信先" })).toBeNull();
    const sent = view.getAllByRole("article").find(item => item.getAttribute("data-outline-message") === "100")!;
    const sourceLink = within(sent).getByRole("button", { name: "佐藤 美咲の元のメッセージへ移動" });
    await expect.poll(() => getComputedStyle(sourceLink).pointerEvents).not.toBe("none");
    await userEvent.click(sourceLink);
    await expect.poll(() => document.activeElement).toBe(original);
    await userEvent.click(more);
    await userEvent.click(within(body.getByRole("dialog", { name: "佐藤 美咲のメッセージの操作" })).getByRole("button", { name: "ハート" }));
    const reaction = first.getByRole("button", { name: "ハート 1件" });
    expect(reaction.getAttribute("aria-pressed")).toBe("true");
    await expect.poll(() => getComputedStyle(more).pointerEvents).not.toBe("none");
    await userEvent.click(reaction);
    await expect.poll(() => first.queryByRole("button", { name: "ハート 1件" })).toBeNull();
    await userEvent.click(more);
    await userEvent.click(within(body.getByRole("dialog", { name: "佐藤 美咲のメッセージの操作" })).getByRole("button", { name: "コピー" }));
    await expect.poll(() => first.getByRole("status").textContent).toBe("コピーしました");
    expect(clipboard).toHaveBeenCalledWith("こんにちは！メッセージ画面のラフをまとめました。\n情報の優先順位と余白について、意見をもらえますか？");
  } finally { clipboard.mockRestore(); await page.viewport(previous.width, previous.height); }
});

for (const width of [375, 1280]) {
  test(`bubble: delivery metadata sits beside the bubble at ${width}px`, async () => {
    const previous = { width: innerWidth, height: innerHeight };
    try {
      await page.viewport(width, 812);
      const view = render(ChatScreenPreview, { layout: "bubble" });
      view.target.style.cssText = "width:100%;padding:0";
      for (const article of view.getAllByRole("article")) {
        const bubble = article.querySelector<HTMLElement>('[data-slot="bubble"]')!;
        const footer = article.querySelector<HTMLElement>('[data-slot="message-footer"]')!;
        await expect.poll(() => Math.abs(footer.getBoundingClientRect().width - bubble.getBoundingClientRect().width)).toBeLessThan(1);
        expect(footer.getBoundingClientRect().right).toBeCloseTo(bubble.getBoundingClientRect().right, 0);
        const reactions = article.querySelector('[data-slot="message-reactions"]');
        if (reactions) expect(footer.contains(reactions)).toBe(true);
        const bounds = bubble.getBoundingClientRect();
        const delivery = article.querySelector<HTMLElement>('[data-slot=chat-message-metadata]')!.getBoundingClientRect();
        expect(delivery.bottom).toBeCloseTo(bounds.bottom, 0);
        if (article.getAttribute('data-align') === 'end') {
          expect(bounds.left - delivery.right).toBeCloseTo(8, 0);
          const read = article.querySelector('[data-slot=chat-message-metadata] > span')!.getBoundingClientRect();
          const time = article.querySelector('[data-slot=chat-message-metadata] time')!.getBoundingClientRect();
          expect(read.bottom).toBeLessThanOrEqual(time.top);
        } else expect(delivery.left - bounds.right).toBeCloseTo(8, 0);
        expect(delivery.left).toBeGreaterThanOrEqual(0);
        expect(delivery.right).toBeLessThanOrEqual(width);
        if (width === 375) {
          const action = within(footer).getByRole('button', { name: 'その他の操作' }).getBoundingClientRect();
          expect(action.width).toBeGreaterThanOrEqual(44);

        } else {
          const toolbar = article.querySelector<HTMLElement>('[data-slot="message-actions"]')!.getBoundingClientRect();
          const bounds = bubble.getBoundingClientRect();
          expect(toolbar.top + toolbar.height / 2).toBeCloseTo(bounds.top, 0);
          if (article.getAttribute('data-align') === 'end') expect(toolbar.right).toBeCloseTo(bounds.right - 12, 0);
          else expect(toolbar.left).toBeCloseTo(bounds.left + 12, 0);
        }
      }
    } finally { await page.viewport(previous.width, previous.height); }
  });
}

test('team: only the bubble reveals the toolbar without adding sender spacing', async () => {
  const previous = { width: innerWidth, height: innerHeight };
  try {
    await page.viewport(1280, 900);
    const view = render(ChatScreenPreview, { layout: 'bubble' });
    view.target.style.cssText = 'width:100%;padding:0';
    const article = view.getAllByRole('article')[2];
    const toolbar = article.querySelector<HTMLElement>('[data-slot="message-actions"]')!;
    const header = article.querySelector<HTMLElement>('[data-slot="chat-message-header"]')!;
    const bubble = article.querySelector<HTMLElement>('[data-slot="bubble"]')!;
    const row = page.getByRole('article').nth(2);
    await row.getByText('佐藤 美咲', { exact: true }).hover();
    await expect.poll(() => getComputedStyle(toolbar).opacity).toBe('0');
    expect(bubble.getBoundingClientRect().top - header.getBoundingClientRect().bottom).toBeLessThanOrEqual(5);
    const before = bubble.getBoundingClientRect().top;
    await row.getByText(/余白を広げた案、よさそうです！/).hover();
    await expect.poll(() => getComputedStyle(toolbar).opacity).toBe('1');
    expect(getComputedStyle(header).visibility).toBe('visible');
    expect(bubble.getBoundingClientRect().top).toBe(before);
    await row.getByRole('button', { name: 'リプライ', exact: true }).hover();
    expect(getComputedStyle(toolbar).pointerEvents).toBe('auto');
    await page.getByRole('textbox', { name: 'メッセージ' }).hover();
    await expect.poll(() => getComputedStyle(toolbar).opacity).toBe('0');
    expect(getComputedStyle(header).visibility).toBe('visible');
  } finally { await page.viewport(previous.width, previous.height); }
});


for (const layout of ["timeline", "bubble"] as const) {
  test(`${layout}: notice appears above the composer without moving the input on mobile and desktop`, async () => {
    const previous = { width: innerWidth, height: innerHeight };
    try {
      for (const width of [375, 1280]) {
        await page.viewport(width, 420);
        const view = render(ChatScreenPreview, { layout });
        view.target.style.cssText = "width:100%;padding:0";
        const input = view.getByRole("textbox", { name: "メッセージ" });
        const note = view.getByText("送信前に内容をご確認ください。");
        expect(getComputedStyle(note).visibility).toBe("hidden");
        const initialTop = input.getBoundingClientRect().top;
        input.focus();
        await expect.poll(() => getComputedStyle(note).visibility).toBe("visible");
        expect(note.getBoundingClientRect().bottom).toBeLessThanOrEqual(input.closest("[data-slot=input-group]")!.getBoundingClientRect().top);
        await expect.poll(() => input.getBoundingClientRect().top).toBeCloseTo(initialTop, 0);
        await userEvent.type(input, "確認中の本文");
        input.blur();
        await expect.poll(() => getComputedStyle(note).visibility).toBe("visible");
        await userEvent.clear(input);
        input.blur();
        await expect.poll(() => getComputedStyle(note).visibility).toBe("hidden");
        await expect.poll(() => input.getBoundingClientRect().top).toBeCloseTo(initialTop, 0);
        view.target.remove();
      }
    } finally { await page.viewport(previous.width, previous.height); }
  });
}

for (const scenario of ["conversation", "assistant"] as const) {
  test(`${scenario}: changing layout preserves content, controls and draft`, async () => {
    const props = reactiveProps({ layout: "timeline" as "timeline" | "bubble", scenario });
    const view = render(ChatScreenPreview, props);
    const texts = () => view.getAllByRole("article").map(el => el.querySelector("[data-slot=chat-message-content]")!.textContent);
    const before = texts();
    const title = view.getByRole("heading", { level: 1 }).textContent;
    const buttons = () => view.getAllByRole("article").map(el => [...el.querySelectorAll("button")].map(button => button.getAttribute("aria-label") || button.textContent));
    const controls = buttons();
    await userEvent.type(view.getByRole("textbox", { name: "メッセージ" }), "共通の下書き");
    props.layout = "bubble";
    await expect.poll(() => view.getAllByRole("article")[0].getAttribute("data-layout")).toBe("bubble");
    expect(texts()).toEqual(before);
    expect(buttons()).toEqual(controls);
    expect(view.getByRole("heading", { level: 1 }).textContent).toBe(title);
    expect((view.getByRole("textbox", { name: "メッセージ" }) as HTMLTextAreaElement).value).toBe("共通の下書き");
  });
}

for (const width of [375, 1280]) {
  test(`app shell owns the only conversation header at ${width}px`, async () => {
    const previous = { width: innerWidth, height: innerHeight };
    try {
      await page.viewport(width, 812);
      const view = render(ChatAppShellPreview, {});
      view.target.style.cssText = "width:100%;padding:0";
      await expect.poll(() => view.getByRole("heading", { level: 1 }).textContent).toBe("佐藤 美咲");
      expect(view.target.querySelector('[data-slot="chat-header"]')).toBeNull();
      expect(view.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      const screen = view.target.querySelector<HTMLElement>('[data-chat-screen]')!;
      expect(screen.getBoundingClientRect().bottom).toBeLessThanOrEqual(812);
      if (width === 375) await userEvent.click(view.getByRole("button", { name: "会話一覧を開く" }));
      await userEvent.click(view.getByRole("button", { name: /^田中 花/ }));
      await expect.poll(() => view.getByRole("heading", { level: 1 }).textContent).toBe("田中 花");
      expect(view.getByRole("textbox", { name: "メッセージ" })).toBeTruthy();
      const body = within(document.body);
      if (width === 375) {
        await userEvent.click(body.getByRole("button", { name: "会話の操作" }));
        await userEvent.click(body.getByRole("menuitem", { name: "メモを開く" }));
      } else await userEvent.click(body.getByRole("button", { name: "会話のメモ" }));
      await expect.poll(() => body.queryByRole("dialog", { name: "会話のメモ" })).not.toBeNull();
      await userEvent.click(body.getByRole("button", { name: "メモを最小化" }));
      expect(document.querySelector('[data-slot="floating-action-menu"]')?.getAttribute("data-placement")).toBe("inline");
    } finally { await page.viewport(previous.width, previous.height); }
  });
}
