import { expect, test, vi } from 'vitest';
import { page, userEvent as nativeUserEvent } from 'vitest/browser';
import { userEvent } from 'storybook/test';
import LongAnswerPreview from '../../stories/chat-long-answer-preview.svelte';
import { copyChatText } from '../../stories/chat-copy-text.js';
import { render } from './render.js';

vi.mock('../../stories/chat-copy-text.js', () => ({ copyChatText: vi.fn().mockResolvedValue(undefined) }));

for (const width of [375, 1280]) {
  test(`long prose keeps code and tables scrollable without widening the conversation at ${width}px`, async () => {
    const previous = { width: innerWidth, height: innerHeight };
    try {
      await page.viewport(width, 950);
      const view = render(LongAnswerPreview, {});
      view.target.style.cssText = 'width:100%;padding:0';
      const history = view.getByLabelText('長文回答の履歴');
      const article = view.getByRole('article', { name: 'アシスタント' });
      expect(article.querySelector('[data-slot=chat-message-content]')!.textContent!.length).toBeGreaterThan(3000);
      const paragraph = article.querySelector('p')!;
      expect(parseFloat(getComputedStyle(article.querySelector('h2')!).fontSize)).toBeGreaterThan(parseFloat(getComputedStyle(paragraph).fontSize));
      expect(parseFloat(getComputedStyle(paragraph).marginTop)).toBeGreaterThan(0);
      const blocks = [view.getByRole('region', { name: '回答の構成案の比較表' }), view.getByLabelText('長い行を含むコード例')];
      for (const block of blocks) {
        expect(block.scrollWidth).toBeGreaterThan(block.clientWidth);
        expect(block.tabIndex).toBe(0);
        block.focus();
        const before = history.scrollTop;
        await nativeUserEvent.keyboard('{ArrowRight>3/}');
        await expect.poll(() => block.scrollLeft).toBeGreaterThan(0);
        // Native focus/scroll positioning can round by one CSS pixel.
        expect(Math.abs(history.scrollTop - before)).toBeLessThanOrEqual(1);
      }
      expect(article.scrollWidth).toBeLessThanOrEqual(article.clientWidth);
      expect(history.scrollWidth).toBeLessThanOrEqual(history.clientWidth);
    } finally { await page.viewport(previous.width, previous.height); }
  });
}

test('the end-of-answer actions are keyboard reachable and copy the full rich response', async () => {
  const view = render(LongAnswerPreview, {});
  const copy = view.getByRole('button', { name: '回答をコピー' });
  copy.focus();
  await userEvent.keyboard('{Enter}');
  await expect.poll(() => copy.querySelector('.lucide-check')).not.toBeNull();
  expect(copy.textContent?.trim()).toBe('コピー');
  const text = vi.mocked(copyChatText).mock.lastCall![0];
  expect(text.length).toBeGreaterThan(3000);
  expect(text).toContain('構成案の比較');
  expect(text).toContain('const sections');
  expect(text).toContain('次の一歩');
  expect(document.activeElement).toBe(copy);
  await userEvent.tab();
  expect(document.activeElement).toBe(view.getByRole('button', { name: '役に立った' }));
  await userEvent.keyboard('{Enter}');
  expect(view.getByRole('button', { name: '役に立った' }).getAttribute('aria-pressed')).toBe('true');
});

test('streaming a long answer preserves the reading position and follows only after returning to the live edge', async () => {
  const view = render(LongAnswerPreview, {});
  const history = view.getByLabelText('長文回答の履歴');
  await nativeUserEvent.click(history);
  await nativeUserEvent.keyboard('{Control>}{Home}{/Control}');
  await expect.poll(() => history.scrollTop).toBe(0);
  const heading = view.getByRole('heading', { name: '結論：伝えたいことを先に示し、読み返せる構造にする' });
  const before = heading.getBoundingClientRect().top - history.getBoundingClientRect().top;
  await userEvent.click(view.getByRole('button', { name: '続きを生成' }));
  await expect.poll(() => view.target.querySelectorAll('[data-answer-addition]').length, { timeout: 6000 }).toBe(8);
  expect(history.scrollTop).toBe(0);
  expect(heading.getBoundingClientRect().top - history.getBoundingClientRect().top).toBeCloseTo(before, 0);
  const latest = view.getByRole('button', { name: '最新のメッセージへ' });
  latest.focus();
  await userEvent.keyboard('{Enter}');
  const distance = () => history.scrollHeight - history.clientHeight - history.scrollTop;
  await expect.poll(distance).toBeLessThan(10);
  await userEvent.click(view.getByRole('button', { name: '続きを生成' }));
  await expect.poll(() => view.target.querySelectorAll('[data-answer-addition]').length, { timeout: 6000 }).toBe(16);
  await expect.poll(distance).toBeLessThan(10);
});
