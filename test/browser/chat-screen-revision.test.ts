import { expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { userEvent, within } from 'storybook/test';
import Preview from '../../stories/chat-screen-preview.svelte';
import { render } from './render.js';
import { reactiveProps } from './props.svelte.js';


async function menuAction(label: string, article = within(document.body).getAllByRole('article').at(-1)!) {
  const articles = within(document.body).getAllByRole('article');
  if (innerWidth >= 768) await page.getByRole('article').nth(articles.indexOf(article)).hover();
  await userEvent.click(within(article).getByRole('button', { name: 'その他の操作' }));
  const body = within(document.body);
  await userEvent.click(body.getByRole(innerWidth >= 768 ? 'menuitem' : 'button', { name: label }));
  await expect.poll(() => getComputedStyle(document.body).pointerEvents).not.toBe('none');
}

async function editMessage(article: HTMLElement, label: string) {
  const scope = within(article);
  if (innerWidth >= 768) {
    await page.getByText(article.querySelector('[data-slot=chat-message-content]')!.textContent!, { exact: true }).hover();
    await expect.poll(() => getComputedStyle(scope.getByRole('button', { name: label })).pointerEvents).not.toBe('none');
    await userEvent.click(scope.getByRole('button', { name: label }));
  }
  else {
    await userEvent.click(scope.getByRole('button', { name: 'その他の操作' }));
    await userEvent.click(within(document.body).getByRole('button', { name: label }));
    await expect.poll(() => within(document.body).queryByRole('textbox', { name: label })).not.toBeNull();
    await expect.poll(() => getComputedStyle(within(document.body).getByRole('textbox', { name: label })).pointerEvents).not.toBe('none');
  }
}
function editFocusTarget(article: HTMLElement, label: string) {
  return within(article).getByRole('button', { name: innerWidth >= 768 ? label : 'その他の操作' });
}

for (const width of [375, 1280]) {
  test(`AI pattern supports editing, retained attachments, restart and regeneration at ${width}px`, async () => {
    const previous = { width: innerWidth, height: innerHeight };
    try {
      await page.viewport(width, 950);
      const props = reactiveProps({ layout: 'timeline' as const, scenario: 'assistant' as const, simulateFailure: false });
      const view = render(Preview, props); view.target.style.cssText = 'width:100%;padding:0';
      const first = view.target.querySelector<HTMLElement>('[data-outline-message="1"]')!;
      const question = within(first);
      await userEvent.type(view.getByRole('textbox', { name: 'メッセージ' }), '書きかけの質問');
      await editMessage(first, '質問を編集');
      const input = view.getByRole('textbox', { name: '質問を編集' });
      const history = view.getByLabelText('メッセージ履歴');
      const form = view.target.querySelector<HTMLElement>('[data-slot=chat-composer]')!;
      await expect.poll(() => form.getBoundingClientRect().bottom <= history.getBoundingClientRect().bottom).toBe(true);
      await expect.poll(() => document.activeElement).toBe(input);
      expect(view.getAllByRole('textbox')).toHaveLength(1);
      expect(view.getByRole('region', { name: 'メッセージの編集' }).closest('[data-slot=input-group]')).toBe(input.closest('[data-slot=input-group]'));
      expect(first.dataset.editing).toBe('true');
      expect(question.getByText(/新しい機能の紹介文/)).toBeTruthy();
      expect(view.getAllByRole('article')).toHaveLength(4);
      await userEvent.keyboard('{Escape}');
      await expect.poll(() => document.activeElement).toBe(editFocusTarget(first, '質問を編集'));
      expect((view.getByRole('textbox', { name: 'メッセージ' }) as HTMLTextAreaElement).value).toBe('書きかけの質問');
      await editMessage(first, '質問を編集');
      await userEvent.clear(view.getByRole('textbox', { name: '質問を編集' }));
      await userEvent.type(view.getByRole('textbox', { name: '質問を編集' }), '利用場面を中心に説明してください。');
      props.simulateFailure = true;
      await userEvent.click(view.getByRole('button', { name: 'メッセージを送信' }));
      expect(view.getAllByRole('article')).toHaveLength(4);
      await expect.poll(() => view.queryByRole('alert')?.textContent, { timeout: 3000 }).toContain('元の会話は残っています');
      expect((view.getByRole('textbox', { name: '質問を編集' }) as HTMLTextAreaElement).value).toBe('利用場面を中心に説明してください。');
      props.simulateFailure = false;
      await userEvent.click(view.getByRole('button', { name: 'メッセージを送信' }));
      await expect.poll(() => view.getAllByRole('article').length, { timeout: 3000 }).toBe(2);
      expect(question.getByRole('button', { name: 'チャット画面のラフ.svgを拡大表示' })).toBeTruthy();
      await expect.poll(() => document.activeElement).toBe(editFocusTarget(first, '質問を編集'));
      const answer = view.getAllByRole('article')[1];
      const original = answer.querySelector('[data-slot=chat-message-content]')!.textContent;
      await menuAction('回答を再生成');
      await menuAction('生成を停止');
      expect(answer.querySelector('[data-slot=chat-message-content]')!.textContent).toBe(original);
      props.simulateFailure = true;
      await menuAction('回答を再生成');
      await expect.poll(() => view.queryByRole('alert')?.textContent, { timeout: 3000 }).toContain('元の回答を残しています');
      props.simulateFailure = false;
      await menuAction('再生成を再試行');
      await expect.poll(() => answer.textContent, { timeout: 3000 }).toContain('別の表現でまとめました');
      const composer = view.getByRole('textbox', { name: 'メッセージ' });
      await userEvent.clear(composer); await userEvent.type(composer, '続きの質問です。');
      await userEvent.click(view.getByRole('button', { name: 'メッセージを送信' }));
      await expect.poll(() => view.getAllByRole('article').length).toBe(4);
      expect(question.getByText('利用場面を中心に説明してください。', { exact: true })).toBeTruthy();
      expect(history.scrollWidth).toBeLessThanOrEqual(history.clientWidth);
    } finally { await page.viewport(previous.width, previous.height); }
  });
}

test('changing AI conversations cancels an in-flight regeneration', async () => {
  const previous = { width: innerWidth, height: innerHeight };
  try {
    await page.viewport(1280, 950);
    const view = render(Preview, { layout: 'timeline', scenario: 'assistant' });
    await menuAction('回答を再生成');
    await userEvent.click(view.getByRole('button', { name: /^ミーティングの振り返り/ }));
    await expect.poll(() => view.queryByRole('button', { name: '生成を停止' })).toBeNull();
    await new Promise(resolve => setTimeout(resolve, 2000));
    expect(view.getAllByRole('article')).toHaveLength(1);
    expect(view.getByText('どこから整理しましょうか？今考えていることを教えてください。')).toBeTruthy();
  } finally { await page.viewport(previous.width, previous.height); }
});

test('the long-answer AI pattern copies the complete rich response from the message menu', async () => {
  const clipboard = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  try {
    const view = render(Preview, { layout: 'timeline', scenario: 'assistant', longAnswer: true });
    const answer = view.target.querySelector<HTMLElement>('[data-outline-message="2"]')!;
    expect(answer.querySelector('[data-slot=chat-message-content]')!.textContent!.length).toBeGreaterThan(3000);
    expect(answer.querySelector('[data-slot=chat-message-footer-actions]')).toBeNull();
    await menuAction('コピー', answer);
    await expect.poll(() => clipboard.mock.calls.length).toBe(1);
    expect(clipboard.mock.calls[0][0]).toContain('const sections');
    expect(clipboard.mock.calls[0][0]).toContain('次の一歩');
    expect(answer.scrollWidth).toBeLessThanOrEqual(answer.clientWidth);
  } finally { clipboard.mockRestore(); }
});

test('a new question does not inherit the previous regeneration error', async () => {
  const view = render(Preview, { layout: 'timeline', scenario: 'assistant', simulateFailure: true });
  await menuAction('回答を再生成');
  await expect.poll(() => view.queryByRole('alert')?.textContent, { timeout: 3000 }).toContain('元の回答を残しています');
  await userEvent.type(view.getByRole('textbox', { name: 'メッセージ' }), '別の質問をします。');
  await userEvent.click(view.getByRole('button', { name: 'メッセージを送信' }));
  await expect.poll(() => view.getAllByRole('article').length).toBe(6);
  expect(view.queryByRole('alert')).toBeNull();
});

for (const width of [375, 1280]) {
  test(`DM uses the shared editor and preserves other messages and attachments at ${width}px`, async () => {
    const previous = { width: innerWidth, height: innerHeight };
    try {
      await page.viewport(width, 950);
      const props = reactiveProps({ layout: 'bubble' as const, simulateFailure: false });
      const view = render(Preview, props); view.target.style.cssText = 'width:100%;padding:0';
      const articles = view.getAllByRole('article');
      const before = [articles[0].textContent, articles[2].textContent];
      expect(articles[1].querySelector('[data-slot=chat-message-footer-actions]')).toBeNull();
      const own = within(articles[1]);
      await editMessage(articles[1], 'メッセージを編集');
      const input = view.getByRole('textbox', { name: 'メッセージを編集' }) as HTMLTextAreaElement;
      await expect.poll(() => document.activeElement).toBe(input);
      expect(view.queryByText(/この質問以降/)).toBeNull();
      expect(getComputedStyle(articles[1]).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      const bubble = articles[1].querySelector<HTMLElement>('[data-slot=bubble]')!;
      expect(getComputedStyle(bubble).outlineStyle).toBe('solid');
      expect(getComputedStyle(articles[1]).outlineStyle).toBe('none');
      await userEvent.clear(input); await userEvent.type(input, '確認しました。こちらの案で進めましょう。');
      props.simulateFailure = true;
      await userEvent.click(view.getByRole('button', { name: 'メッセージを送信' }));
      await expect.poll(() => view.queryByRole('alert')?.textContent, { timeout: 3000 }).toContain('編集内容は残っています');
      expect(input.value).toBe('確認しました。こちらの案で進めましょう。');
      props.simulateFailure = false;
      await userEvent.click(view.getByRole('button', { name: 'メッセージを送信' }));
      await expect.poll(() => own.queryByText('編集済み')).not.toBeNull();
      expect(view.getAllByRole('article')).toHaveLength(3);
      expect([articles[0].textContent, articles[2].textContent]).toEqual(before);
      expect(own.getByRole('button', { name: '共有した写真.svgを拡大表示' })).toBeTruthy();
      expect(own.getByText('確認しました。こちらの案で進めましょう。')).toBeTruthy();
      await expect.poll(() => document.activeElement).toBe(editFocusTarget(articles[1], 'メッセージを編集'));
      await editMessage(articles[1], 'メッセージを編集');
      await userEvent.clear(view.getByRole('textbox', { name: 'メッセージを編集' }));
      await userEvent.type(view.getByRole('textbox', { name: 'メッセージを編集' }), 'キャンセルする変更');
      await userEvent.keyboard('{Escape}');
      expect(own.getByText('確認しました。こちらの案で進めましょう。')).toBeTruthy();
      expect(view.getByLabelText('メッセージ履歴').scrollWidth).toBeLessThanOrEqual(view.getByLabelText('メッセージ履歴').clientWidth);
    } finally { await page.viewport(previous.width, previous.height); }
  });
}

for (const layout of ['timeline', 'bubble'] as const) {
  test(`${layout}: composer editing preserves new-message drafts and files and handles keyboard submission`, async () => {
    const previous = { width: innerWidth, height: innerHeight };
    try {
      await page.viewport(375, 420);
      const view = render(Preview, { layout, scenario: layout === 'timeline' ? 'assistant' : 'conversation' }); view.target.style.cssText = 'width:100%;padding:0';
      const draftInput = view.getByRole('textbox', { name: 'メッセージ' });
      await userEvent.type(draftInput, '書きかけのメッセージ');
      await userEvent.upload(view.getByLabelText('添付ファイルを選択'), new File(['draft'], 'draft.txt', { type: 'text/plain' }));
      const label = layout === 'timeline' ? '質問を編集' : 'メッセージを編集';
      await editMessage(view.getAllByRole('article').find(article => article.dataset.side === 'outgoing')!, label);
      const input = view.getByRole('textbox', { name: label }) as HTMLTextAreaElement;
      expect(input).toBe(draftInput);
      expect(view.queryByRole('list', { name: '選択済みの添付ファイル' })).toBeNull();
      expect(view.queryByRole('button', { name: '追加' })).toBeNull();
      const history = view.getByLabelText('メッセージ履歴');
      expect(history.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(input.closest('footer')!.getBoundingClientRect().bottom);
      await userEvent.clear(input);
      await userEvent.keyboard('{Control>}{Enter}{/Control}');
      expect(view.getByRole('region', { name: 'メッセージの編集' })).toBeTruthy();
      expect((view.getByRole('button', { name: 'メッセージを送信' }) as HTMLButtonElement).disabled).toBe(true);
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', isComposing: true, bubbles: true }));
      expect(view.getByRole('region', { name: 'メッセージの編集' })).toBeTruthy();
      await userEvent.type(input, '編集した本文');
      await userEvent.keyboard('{Enter}');
      expect(input.value).toContain('\n');
      await userEvent.keyboard('{Control>}{Enter}{/Control}');
      await expect.poll(() => view.queryByRole('region', { name: 'メッセージの編集' }), { timeout: 3000 }).toBeNull();
      expect((draftInput as HTMLTextAreaElement).value).toBe('書きかけのメッセージ');
      expect(view.getByRole('list', { name: '選択済みの添付ファイル' }).textContent).toContain('draft.txt');
      expect(view.getByText('編集した本文', { exact: true })).toBeTruthy();
      expect(view.target.querySelector('[data-editing="true"]')).toBeNull();
    } finally { await page.viewport(previous.width, previous.height); }
  });
}
