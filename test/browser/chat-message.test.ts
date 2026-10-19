import { page } from "vitest/browser";
import LayoutFixture from "./chat-message-layout-fixture.svelte";
import { expect, test } from "vitest";
import { userEvent } from "storybook/test";
import Fixture from "./chat-message-fixture.svelte";
import { render } from "./render.js";
import { reactiveProps } from "./props.svelte.js";

test("message preserves plain text and exposes metadata and keyboard actions", async () => {
  const view = render(Fixture, { text: "<img src=x onerror=alert(1)>\n次の行" });
  const article = view.getByRole("article", { name: "送信者" });
  expect(article.querySelector("img")).toBeNull();
  expect(article.textContent).toContain("<img src=x onerror=alert(1)>\n次の行");
  expect(article.querySelector("time")?.dateTime).toBe("2026-10-17T10:00:00+09:00");
  const copy = view.getByRole("button", { name: "コピー" });
  copy.focus();
  await userEvent.keyboard("{Enter}");
  await expect.poll(() => view.getByRole("status").textContent).toBe("コピーしました");
  expect((view.getByRole("button", { name: "再送" }) as HTMLButtonElement).disabled).toBe(true);
  await userEvent.tab();
  expect(document.activeElement).not.toBe(view.getByRole("button", { name: "再送" }));
});

test("streamed text and author updates keep the focused action mounted", async () => {
  const props = reactiveProps({ text: "回答", author: "アシスタント", variant: "plain" as const });
  const view = render(Fixture, props);
  const copy = view.getByRole("button", { name: "コピー" });
  copy.focus();
  props.text = "回答を少しずつ追加します。";
  props.author = "担当者";
  await expect.poll(() => view.getByRole("article", { name: "担当者" }).textContent).toContain(props.text);
  expect(document.activeElement).toBe(copy);
  expect(view.target.querySelector('[role="log"], [aria-live]')?.tagName).toBe("OUTPUT");
});

for (const dir of ["ltr", "rtl"]) {
  for (const align of ["start", "end"] as const) {
    test(`${dir}/${align}: long text stays inside a narrow message`, () => {
      const view = render(Fixture, { align, author: "長い名前".repeat(20), text: "https://example.test/" + "x".repeat(250) });
      view.target.style.width = "280px";
      view.target.style.boxSizing = "border-box";
      view.target.dir = dir;
      const article = view.getByRole("article");
      expect(article.scrollWidth).toBeLessThanOrEqual(article.clientWidth);
      const avatar = article.querySelector('[data-slot="chat-message-avatar"]')!.getBoundingClientRect();
      const content = article.querySelector('[data-slot="chat-message-content"]')!.getBoundingClientRect();
      const avatarOnRight = (align === "end") !== (dir === "rtl");
      expect(avatarOnRight ? avatar.left >= content.right : avatar.right <= content.left).toBe(true);
    });
  }
}


for (const dir of ["ltr", "rtl"]) {
  for (const side of ["incoming", "outgoing"] as const) {
    test(`bubble/${side}/${dir}: metadata stays beside a narrow surface`, async () => {
      const view = render(LayoutFixture, { side, text: "長い本文".repeat(50) });
      view.target.style.cssText = "width:280px;box-sizing:border-box;padding:0";
      view.target.dir = dir;
      const article = view.getByRole('article');
      const bubble = article.querySelector('[data-slot=bubble]')!.getBoundingClientRect();
      const metadata = article.querySelector('[data-slot=chat-message-metadata]')!.getBoundingClientRect();
      expect(getComputedStyle(article.querySelector('[data-slot=bubble-content]')!).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      const metadataOnRight = (side === 'incoming') !== (dir === 'rtl');
      expect(metadataOnRight ? metadata.left - bubble.right : bubble.left - metadata.right).toBeCloseTo(8, 0);
      expect(metadata.bottom).toBeCloseTo(bubble.bottom, 0);
      expect(article.scrollWidth).toBeLessThanOrEqual(article.clientWidth);
      expect(article.querySelector('[data-slot=chat-message-header]') !== null).toBe(side === 'incoming');
      expect(article.querySelector('[data-slot=message-quote]')?.textContent).toContain('元の発言');
      await userEvent.click(view.getByRole('button', { name: 'いいね 1件' }));
      expect(view.getByRole('button', { name: 'いいね 2件' }).getAttribute('aria-pressed')).toBe('true');
    });
  }
}

test('timeline supports missing avatar and author, and keeps actions mounted when layout changes', async () => {
  const props = reactiveProps({ layout: 'timeline' as 'timeline' | 'bubble', side: 'outgoing' as const, showAuthor: false, withAvatar: false });
  const view = render(LayoutFixture, props);
  const article = view.getByRole('article');
  expect(article.getAttribute('data-align')).toBe('start');
  expect(article.querySelector('[data-slot=chat-message-header]')).toBeNull();
  expect(article.querySelector('[data-slot=chat-message-metadata]')?.textContent).toBe('10:21');
  const trigger = view.getByRole('button', { name: 'その他の操作' });
  trigger.focus();
  props.layout = 'bubble';
  await expect.poll(() => article.getAttribute('data-align')).toBe('end');
  expect(document.activeElement).toBe(trigger);
  expect(article.querySelector('[data-slot=bubble]')?.getAttribute('data-variant')).toBe('default');
});

test('bubble hover and keyboard actions work without screen-specific CSS', async () => {
  const previous = { width: innerWidth, height: innerHeight };
  try {
    await page.viewport(1280, 800);
    const view = render(LayoutFixture, {});
    const article = view.getByRole('article');
    const toolbar = article.querySelector<HTMLElement>('[data-slot=message-actions]')!;
    const header = article.querySelector<HTMLElement>('[data-slot=chat-message-header]')!;
    const row = page.getByRole('article');
    await row.getByText('送信者', { exact: true }).hover();
    await expect.poll(() => getComputedStyle(toolbar).opacity).toBe('0');
    await row.getByText('レイアウトを確認する本文', { exact: true }).hover();
    await expect.poll(() => getComputedStyle(toolbar).opacity).toBe('1');
    await expect.poll(() => getComputedStyle(header).visibility).toBe('visible');
    const name = header.getBoundingClientRect();
    expect(toolbar.contains(document.elementFromPoint(name.left + name.width / 2, name.top + name.height / 2))).toBe(true);
    expect(getComputedStyle(toolbar, '::before').maskImage).toContain('linear-gradient');
    const blur = toolbar.querySelector<HTMLElement>('.action-blur')!;
    expect(getComputedStyle(blur).backdropFilter).toBe('blur(6px)');
    expect(getComputedStyle(blur).maskImage).not.toBe(getComputedStyle(toolbar, '::before').maskImage);
    const outline = toolbar.querySelector<HTMLElement>('.action-outline')!;
    expect(outline.getBoundingClientRect().toJSON()).toEqual(blur.getBoundingClientRect().toJSON());
    expect(getComputedStyle(outline).borderRadius).toBe(getComputedStyle(toolbar).borderRadius);
    expect(getComputedStyle(outline).pointerEvents).toBe('none');
    expect(getComputedStyle(outline).opacity).toBe('0');
    expect(getComputedStyle(outline).maskImage).not.toBe(getComputedStyle(toolbar, '::before').maskImage);
    expect(getComputedStyle(toolbar).filter).toBe('none');
    expect(getComputedStyle(toolbar, '::after').opacity).toBe('0');
    const copyButton = view.getByRole('button', { name: 'コピー' });
    const bounds = copyButton.getBoundingClientRect();
    expect(bounds.width).toBe(32);
    expect(bounds.height).toBe(32);
    const icon = copyButton.querySelector('svg')!.getBoundingClientRect();
    expect(icon.left + icon.width / 2).toBeCloseTo(bounds.left + bounds.width / 2, 0);
    expect(icon.top + icon.height / 2).toBeCloseTo(bounds.top + bounds.height / 2, 0);
    const idleBackground = getComputedStyle(copyButton).backgroundColor;
    await row.getByRole('button', { name: 'コピー', exact: true }).hover();
    expect(getComputedStyle(toolbar).pointerEvents).toBe('auto');
    await expect.poll(() => getComputedStyle(copyButton).backgroundColor).not.toBe(idleBackground);
    await expect.poll(() => getComputedStyle(toolbar, '::after').opacity).toBe('1');
    await expect.poll(() => getComputedStyle(outline).opacity).toBe('1');
    await page.getByRole('button', { name: 'メッセージ外' }).hover();
    await expect.poll(() => getComputedStyle(toolbar).opacity).toBe('0');
    const copy = view.getByRole('button', { name: 'コピー' });
    copy.focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => toolbar.getAttribute('data-open')).toBe('true');
    await expect.poll(() => getComputedStyle(toolbar, '::after').opacity).toBe('1');
    expect(getComputedStyle(header).visibility).toBe('visible');
    expect(view.getByRole('button', { name: 'コピーしました' })).toBeTruthy();
  } finally { await page.viewport(previous.width, previous.height); }
});

for (const withAvatar of [true, false]) {
  test(`mobile timeline keeps the body below the header (avatar=${withAvatar})`, async () => {
    const previous = { width: innerWidth, height: innerHeight };
    try {
      await page.viewport(375, 812);
      const view = render(LayoutFixture, { layout: 'timeline', withAvatar, text: '長い回答のレイアウトを確認します。'.repeat(30) });
      view.target.style.cssText = 'width:100%;padding:0';
      const article = view.getByRole('article');
      const header = article.querySelector('[data-slot=chat-message-header]')!.getBoundingClientRect();
      const body = article.querySelector('[data-slot=chat-message-content]')!.getBoundingClientRect();
      expect(body.top).toBeGreaterThanOrEqual(header.bottom);
      expect(Math.abs(body.left - article.getBoundingClientRect().left)).toBeLessThanOrEqual(1);
      expect(article.scrollWidth).toBeLessThanOrEqual(article.clientWidth);
    } finally { await page.viewport(previous.width, previous.height); }
  });
}

for (const dir of ['ltr', 'rtl']) {
  test(`desktop timeline separates the header actions from long names and the body (${dir})`, async () => {
    const previous = { width: innerWidth, height: innerHeight };
    try {
      await page.viewport(1280, 800);
      const view = render(LayoutFixture, { layout: 'timeline', author: '長い送信者名'.repeat(8) });
      view.target.style.cssText = 'width:480px;padding:0';
      view.target.dir = dir;
      const article = view.getByRole('article');
      const header = article.querySelector<HTMLElement>('[data-slot=chat-message-header]')!;
      const toolbar = article.querySelector<HTMLElement>('[data-slot=message-actions]')!;
      const quote = article.querySelector<HTMLElement>('[data-slot=message-quote]')!;
      const name = header.querySelector('.author')!.getBoundingClientRect();
      const actions = toolbar.getBoundingClientRect();
      expect(dir === 'ltr' ? name.right <= actions.left : actions.right <= name.left).toBe(true);
      expect(quote.getBoundingClientRect().top - header.getBoundingClientRect().bottom).toBeCloseTo(6, 0);
      expect(article.scrollWidth).toBeLessThanOrEqual(article.clientWidth);
      const copy = view.getByRole('button', { name: 'コピー' });
      const before = quote.getBoundingClientRect().toJSON();
      copy.focus();
      await expect.poll(() => getComputedStyle(toolbar).opacity).toBe('1');
      expect(quote.getBoundingClientRect().toJSON()).toEqual(before);
      expect(toolbar.contains(document.elementFromPoint(actions.left + actions.width / 2, actions.top + actions.height / 2))).toBe(true);
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => view.getByRole('button', { name: 'コピーしました' })).toBeTruthy();
    } finally { await page.viewport(previous.width, previous.height); }
  });
}

test('a narrow desktop timeline places actions below the body without squeezing the author', async () => {
  const previous = { width: innerWidth, height: innerHeight };
  try {
    await page.viewport(1280, 800);
    const view = render(LayoutFixture, { layout: 'timeline', author: 'デザインを担当する送信者' });
    view.target.style.cssText = 'width:280px;padding:0';
    const article = view.getByRole('article');
    const header = article.querySelector<HTMLElement>('[data-slot=chat-message-header]')!;
    const body = article.querySelector<HTMLElement>('[data-slot=chat-message-content]')!;
    const toolbar = article.querySelector<HTMLElement>('[data-slot=message-actions]')!;
    expect(header.querySelector('.author')!.getBoundingClientRect().width).toBeGreaterThan(150);
    expect(toolbar.getBoundingClientRect().top).toBeGreaterThanOrEqual(body.getBoundingClientRect().bottom);
    await expect.poll(() => getComputedStyle(toolbar).opacity).toBe('1');
    expect(article.scrollWidth).toBeLessThanOrEqual(article.clientWidth);
  } finally { await page.viewport(previous.width, previous.height); }
});

test('mobile timeline copy feedback stays inside the message', async () => {
  const previous = { width: innerWidth, height: innerHeight };
  try {
    await page.viewport(375, 812);
    const view = render(LayoutFixture, { layout: 'timeline', copyState: 'copied' });
    view.target.style.cssText = 'width:100%;padding:0';
    const article = view.getByRole('article');
    const notification = article.querySelector<HTMLElement>('[role=status]')!;
    expect(notification.textContent).toBe('コピーしました');
    expect(notification.getBoundingClientRect().right).toBeLessThanOrEqual(article.getBoundingClientRect().right);
    expect(article.scrollWidth).toBeLessThanOrEqual(article.clientWidth);
  } finally { await page.viewport(previous.width, previous.height); }
});

test('bubble author remains rendered during and after mouse copy feedback', async () => {
  const previous = { width: innerWidth, height: innerHeight };
  try {
    await page.viewport(1280, 800);
    const props = reactiveProps({ copyState: 'idle' as 'idle' | 'copied' });
    const view = render(LayoutFixture, props);
    const article = view.getByRole('article');
    const header = article.querySelector<HTMLElement>('[data-slot=chat-message-header]')!;
    const toolbar = article.querySelector<HTMLElement>('[data-slot=message-actions]')!;
    await page.getByText('レイアウトを確認する本文', { exact: true }).hover();
    await page.getByRole('button', { name: 'コピー', exact: true }).click();
    props.copyState = 'copied';
    await page.getByRole('button', { name: 'メッセージ外' }).hover();
    await expect.poll(() => toolbar.getAttribute('data-open')).toBe('true');
    await expect.poll(() => getComputedStyle(toolbar, '::after').opacity).toBe('1');
    expect(getComputedStyle(header).visibility).toBe('visible');
    props.copyState = 'idle';
    await expect.poll(() => getComputedStyle(toolbar).opacity).toBe('0');
    expect(getComputedStyle(header).visibility).toBe('visible');
  } finally { await page.viewport(previous.width, previous.height); }
});
