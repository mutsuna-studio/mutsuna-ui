import { expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { userEvent } from 'storybook/test';
import { ChatMessageEditor, ChatRegenerateAction } from '@mutsuna/ui/chat-message';
import Preview from '../../stories/chat-revision-preview.svelte';
import { render } from './render.js';
import { reactiveProps } from './props.svelte.js';

test('editing preserves multiline input, ignores composition, submits trimmed text and supports Escape', async () => {
  const onSubmit = vi.fn(); const onCancel = vi.fn();
  const view = render(ChatMessageEditor, { value: '元の質問', description: 'この質問以降の会話を作り直します。', onSubmit, onCancel });
  const input = view.getByRole('textbox') as HTMLTextAreaElement;
  await expect.poll(() => document.activeElement).toBe(input);
  expect(input.getAttribute('aria-describedby')).toBeTruthy();
  await userEvent.clear(input);
  await userEvent.type(input, '  新しい質問\n条件も含めます。  ');
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, isComposing: true, bubbles: true }));
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', isComposing: true, bubbles: true }));
  expect(onSubmit).not.toHaveBeenCalled(); expect(onCancel).not.toHaveBeenCalled();
  await userEvent.keyboard('{Control>}{Enter}{/Control}');
  expect(onSubmit).toHaveBeenCalledExactlyOnceWith('新しい質問\n条件も含めます。');
  expect(input.value).toBe('  新しい質問\n条件も含めます。  ');
  await userEvent.keyboard('{Escape}'); expect(onCancel).toHaveBeenCalledOnce();
  await userEvent.clear(input); await userEvent.type(input, '   ');
  expect((view.getByRole('button', { name: '送信' }) as HTMLButtonElement).disabled).toBe(true);
  view.target.querySelector('form')!.requestSubmit();
  expect(onSubmit).toHaveBeenCalledTimes(1);
});

test('an edit in flight locks submission, moves focus to stop and retains the draft after failure', async () => {
  const onSubmit = vi.fn(() => { props.submitting = true; });
  const onCancel = vi.fn(); const onStop = vi.fn(() => { props.submitting = false; });
  const props = reactiveProps({ value: '消さない編集内容', submitting: false, error: undefined as string | undefined, onSubmit, onCancel, onStop });
  const view = render(ChatMessageEditor, props);
  const input = view.getByRole('textbox') as HTMLTextAreaElement;
  await userEvent.click(view.getByRole('button', { name: '送信' }));
  const stop = view.getByRole('button', { name: '生成を停止' });
  await expect.poll(() => document.activeElement).toBe(stop);
  expect(input.readOnly).toBe(true);
  view.target.querySelector('form')!.requestSubmit();
  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect((view.getByRole('button', { name: 'キャンセル' }) as HTMLButtonElement).disabled).toBe(true);
  props.error = 'やり直せませんでした'; props.submitting = false;
  await expect.poll(() => document.activeElement).toBe(input);
  expect(input.value).toBe('消さない編集内容');
  expect(input.getAttribute('aria-invalid')).toBe('true');
  expect(input.getAttribute('aria-describedby')).toContain(view.getByRole('alert').id);
  await userEvent.click(view.getByRole('button', { name: '送信' }));
  await userEvent.click(view.getByRole('button', { name: '生成を停止' }));
  expect(onStop).toHaveBeenCalledOnce();
  await expect.poll(() => document.activeElement).toBe(input);
});

test('regeneration restores focus on failure or stop without stealing focus from another control', async () => {
  const onRegenerate = vi.fn(() => { props.generating = true; });
  const onStop = vi.fn(() => { props.generating = false; });
  const props = reactiveProps({ generating: false, error: undefined as string | undefined, onRegenerate, onStop });
  const view = render(ChatRegenerateAction, props);
  await userEvent.click(view.getByRole('button', { name: '回答を再生成' }));
  await expect.poll(() => document.activeElement).toBe(view.getByRole('button', { name: '生成を停止' }));
  expect((view.getByRole('button', { name: '回答を生成中' }) as HTMLButtonElement).disabled).toBe(true);
  props.error = '失敗しました'; props.generating = false;
  await expect.poll(() => document.activeElement === view.queryByRole('button', { name: '再生成を再試行' })).toBe(true);
  expect(view.getByRole('alert').textContent).toBe('失敗しました');
  await userEvent.click(view.getByRole('button', { name: '再生成を再試行' }));
  await userEvent.click(view.getByRole('button', { name: '生成を停止' }));
  expect(onStop).toHaveBeenCalledOnce();
  await userEvent.click(view.getByRole('button', { name: '再生成を再試行' }));
  const elsewhere = document.createElement('button'); elsewhere.textContent = '別の操作'; view.target.append(elsewhere);
  elsewhere.focus(); props.generating = false;
  await expect.poll(() => document.activeElement).toBe(elsewhere);
});

test('disabled editing and regeneration remain inside a narrow RTL container', async () => {
  const view = render(ChatMessageEditor, { value: '長い入力'.repeat(40), disabled: true, autofocus: false, onSubmit: vi.fn(), onCancel: vi.fn() });
  view.target.style.cssText = 'width:280px;padding:0'; view.target.dir = 'rtl';
  const form = view.target.querySelector('form')!;
  expect(form.scrollWidth).toBeLessThanOrEqual(form.clientWidth);
  for (const button of view.getAllByRole('button')) { expect((button as HTMLButtonElement).disabled).toBe(true); expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(44); }
  const action = render(ChatRegenerateAction, { disabled: true, onRegenerate: vi.fn(), label: '長い回答をもう一度生成する'.repeat(3) });
  action.target.style.cssText = 'width:280px;padding:0';
  expect(action.getByRole('group').scrollWidth).toBeLessThanOrEqual(action.getByRole('group').clientWidth);
  expect((action.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
});

test('regeneration without a stop callback keeps focus in its group until completion', async () => {
  const props = reactiveProps({ generating: false, onRegenerate: () => { props.generating = true; } });
  const view = render(ChatRegenerateAction, props);
  await userEvent.click(view.getByRole('button', { name: '回答を再生成' }));
  await expect.poll(() => document.activeElement).toBe(view.getByRole('group'));
  expect(view.queryByRole('button', { name: '生成を停止' })).toBeNull();
  props.generating = false;
  await expect.poll(() => document.activeElement === view.queryByRole('button', { name: '回答を再生成' })).toBe(true);
});

for (const width of [375, 1280]) {
  test(`editing keeps later messages until confirmation and restores trigger focus at ${width}px`, async () => {
    const previous = { width: innerWidth, height: innerHeight };
    try {
      await page.viewport(width, 950);
      const view = render(Preview, {}); view.target.style.cssText = 'width:100%;padding:0';
      await userEvent.click(view.getByRole('button', { name: '質問を編集' }));
      expect(view.getAllByRole('article')).toHaveLength(4);
      expect(view.getByText(/この質問以降の会話（3件）/)).toBeTruthy();
      await userEvent.click(view.getByRole('button', { name: 'キャンセル' }));
      await expect.poll(() => document.activeElement).toBe(view.getByRole('button', { name: '質問を編集' }));
      expect(view.getAllByRole('article')).toHaveLength(4);
      await userEvent.click(view.getByRole('button', { name: '質問を編集' }));
      const input = view.getByRole('textbox');
      await userEvent.clear(input); await userEvent.type(input, '利用場面を中心に説明してください。');
      await userEvent.click(view.getByRole('checkbox'));
      await userEvent.click(view.getByRole('button', { name: '送信' }));
      expect(view.getAllByRole('article')).toHaveLength(4);
      await expect.poll(() => view.queryByRole('alert')?.textContent, { timeout: 3000 }).toContain('編集内容は残っています');
      expect((input as HTMLTextAreaElement).value).toBe('利用場面を中心に説明してください。');
      await userEvent.click(view.getByRole('button', { name: '送信' }));
      await expect.poll(() => view.getAllByRole('article').length, { timeout: 3000 }).toBe(2);
      expect(view.getByRole('article', { name: 'あなた' }).textContent).toContain('利用場面を中心に説明してください。');
      await expect.poll(() => document.activeElement).toBe(view.getByRole('button', { name: '質問を編集' }));
      const article = view.getByRole('article', { name: 'アシスタント' });
      const old = article.querySelector('[data-slot=chat-message-content]')!.textContent;
      await userEvent.click(view.getByRole('button', { name: '回答を再生成' }));
      await userEvent.click(view.getByRole('button', { name: '生成を停止' }));
      expect(article.querySelector('[data-slot=chat-message-content]')!.textContent).toBe(old);
      await userEvent.click(view.getByRole('button', { name: '回答を再生成' }));
      await expect.poll(() => article.querySelector('[data-slot=chat-message-content]')!.textContent, { timeout: 3000 }).toContain('別の表現でまとめました');
      expect(view.target.scrollWidth).toBeLessThanOrEqual(view.target.clientWidth);
    } finally { await page.viewport(previous.width, previous.height); }
  });
}
