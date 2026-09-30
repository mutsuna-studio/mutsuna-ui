import { expect, userEvent, within, waitFor, fireEvent } from 'storybook/test';
type Context = { canvasElement: HTMLElement };
async function closed(canvasElement: HTMLElement, name: string) {
  const body = within(canvasElement.ownerDocument.body);
  await waitFor(() => expect(body.queryByRole('region', { name })).not.toBeInTheDocument());
  await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe('none'));
}
async function openRange(canvasElement: HTMLElement) {
  if (!within(canvasElement).queryByRole('region', { name: '詳細条件' })) await userEvent.click(within(canvasElement).getByRole('button', { name: /^詳細条件/ }));
  const element = await within(canvasElement.ownerDocument.body).findByRole('region', { name: '詳細条件' });
  await waitFor(() => expect(element).toBeVisible());
  return within(element);
}
export async function searchInteraction({ canvasElement }: Context) {
  const canvas = within(canvasElement);
  const search = canvas.getByRole('textbox', { name: '検索' });
  await userEvent.click(search);
  await expect(search).toHaveFocus();
  await waitFor(() => expect(canvas.getByRole('region', { name: '詳細条件' })).toBeVisible());
  await userEvent.type(search, '入力途中');
  await userEvent.click(canvas.getByRole('button', { name: 'すべて解除' }));
  await expect(search).toHaveValue('');
  await expect(search).toHaveFocus();
  await userEvent.click(canvas.getByRole('button', { name: '次へ' }));
  await expect(canvas.getByText('6–10件を表示')).toBeVisible();
  await userEvent.type(search, 'ＰＲＪ－１０４９');
  await expect(canvas.getByText('6–10件を表示')).toBeVisible();
  await userEvent.keyboard('{Enter}');
  await closed(canvasElement, '詳細条件');
  await expect(search).toHaveFocus();
  await expect(canvas.getByText('Webサイトリニューアル')).toBeVisible();
  await expect(canvas.getByText('1–1件を表示')).toBeVisible();
  await userEvent.click(canvas.getByRole('button', { name: 'すべて解除' }));
  await expect(search).toHaveFocus();
  await userEvent.type(search, 'Web 佐藤');
  await userEvent.click(canvas.getByRole('button', { name: '検索' }));
  await expect(canvas.getByText('1–1件を表示')).toBeVisible();
  await userEvent.type(search, ' 追加');
  await userEvent.keyboard('{Escape}');
  await expect(search).toHaveValue('Web 佐藤');
  await userEvent.clear(search);
  await userEvent.type(search, '存在しない検索語');
  await userEvent.keyboard('{Enter}');
  await expect(canvas.getByText('条件に一致するプロジェクトがありません')).toBeVisible();
  await expect(canvas.queryByRole('navigation', { name: '検索結果のページ切り替え' })).not.toBeInTheDocument();
  await userEvent.click(canvas.getByRole('button', { name: '検索語だけ解除' }));
  await expect(search).toHaveFocus();
  await expect(canvas.getByText('1–5件を表示')).toBeVisible();
  await userEvent.click(canvas.getByRole('button', { name: '更新日時を古い順に並べ替え' }));
  await expect(canvas.getByRole('columnheader', { name: /更新日時/ })).toHaveAttribute('aria-sort', 'ascending');
  await expect(canvas.getAllByRole('row')[1]).toHaveTextContent('Webサイトリニューアル');
}
export async function facetInteraction({ canvasElement }: Context) {
  const canvas = within(canvasElement);
  const search = canvas.getByRole('textbox', { name: '検索' });
  await userEvent.type(search, '改善');
  let dialog = await openRange(canvasElement);
  await expect(search).toHaveValue('改善');
  await userEvent.click(dialog.getByRole('button', { name: /^状態、/ }));
  await userEvent.click(dialog.getByRole('checkbox', { name: '進行中' }));
  await userEvent.click(dialog.getByRole('checkbox', { name: 'レビュー待ち' }));
  await userEvent.click(dialog.getByRole('button', { name: '完了' }));
  await expect(canvas.getByRole('status')).toHaveTextContent('10件');
  await userEvent.click(dialog.getByRole('button', { name: 'キャンセル' }));
  await closed(canvasElement, '詳細条件');
  await expect(canvas.getByRole('textbox', { name: '検索' })).toHaveFocus();
  dialog = await openRange(canvasElement);
  await expect(dialog.getByRole('button', { name: '状態、0件選択' })).toBeVisible();
  await userEvent.click(dialog.getByRole('button', { name: /^状態、/ }));
  await userEvent.click(dialog.getByRole('checkbox', { name: '進行中' }));
  await userEvent.click(dialog.getByRole('checkbox', { name: 'レビュー待ち' }));
  await userEvent.click(dialog.getByRole('button', { name: '完了' }));
  await userEvent.click(dialog.getByRole('button', { name: '検索（3件）' }));
  await closed(canvasElement, '詳細条件');
  await expect(canvas.getByRole('status')).toHaveTextContent('3件 / 全10件');
  await expect(search).toHaveValue('改善');
  await userEvent.clear(search);
  await userEvent.keyboard('{Enter}');
  await expect(canvas.getByRole('status')).toHaveTextContent('5件 / 全10件');
  const firstChip = canvas.getByRole('button', { name: '状態: 進行中を解除' });
  firstChip.focus();
  await userEvent.keyboard('{Enter}');
  await expect(canvas.getByRole('button', { name: '状態: レビュー待ちを解除' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  await expect(search).toHaveFocus();
  dialog = await openRange(canvasElement);
  await userEvent.click(dialog.getByRole('button', { name: /^担当者、/ }));
  await userEvent.click(dialog.getByRole('checkbox', { name: '青山 美咲' }));
  await userEvent.click(dialog.getByRole('button', { name: '完了' }));
  await userEvent.click(dialog.getByRole('button', { name: '検索（1件）' }));
  await closed(canvasElement, '詳細条件');
  await userEvent.type(search, '入力途中');
  await userEvent.click(canvas.getByRole('button', { name: 'すべて解除' }));
  await expect(search).toHaveValue('');
  await expect(search).toHaveFocus();
  await expect(canvas.getByRole('status')).toHaveTextContent('10件 / 全10件');
}
export async function rangeInteraction({ canvasElement }: Context) {
  const canvas = within(canvasElement);
  let dialog = await openRange(canvasElement);
  await userEvent.click(dialog.getByRole('button', { name: /^更新日の範囲:/ }));
  const calendarPopup = dialog.getByRole('button', { name: '期間をクリア' }).closest('[data-slot="popover-content"]') as HTMLElement;
  await waitFor(() => {
    const rect = calendarPopup.getBoundingClientRect();
    expect(rect.top).toBeGreaterThanOrEqual(0);
    expect(rect.bottom).toBeLessThanOrEqual(canvasElement.ownerDocument.documentElement.clientHeight);
    expect(Math.abs((rect.top + rect.bottom) / 2 - canvasElement.ownerDocument.documentElement.clientHeight / 2)).toBeLessThan(2);
    const scrollingContent = calendarPopup.firstElementChild as HTMLElement;
    if (canvasElement.ownerDocument.documentElement.clientHeight >= 500) {
      expect(scrollingContent.scrollHeight).toBeLessThanOrEqual(scrollingContent.clientHeight + 1);
    }
  });
  await fireEvent.input(dialog.getByLabelText('開始日'), { target: { value: '2026-06-25' } });
  await fireEvent.input(dialog.getByLabelText('終了日'), { target: { value: '2026-06-25' } });
  await userEvent.click(dialog.getByRole('button', { name: '完了' }));
  await userEvent.click(dialog.getByRole('button', { name: /^更新日の範囲:/ }));
  await userEvent.click(canvasElement.querySelector('[data-range-calendar-day][data-value="2026-06-24"]') as HTMLElement);
  await userEvent.click(canvasElement.querySelector('[data-range-calendar-day][data-value="2026-06-25"]') as HTMLElement);
  await expect(dialog.getByLabelText('開始日')).toHaveValue('2026-06-24');
  await expect(dialog.getByLabelText('終了日')).toHaveValue('2026-06-25');
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(canvas.getByRole('region', { name: '詳細条件' })).toBeVisible());
  await expect(dialog.getByRole('button', { name: /^更新日の範囲:/ })).toHaveFocus();
  await userEvent.type(dialog.getByRole('spinbutton', { name: '下限（円）' }), '4000');
  await userEvent.type(dialog.getByRole('spinbutton', { name: '上限（円）' }), '6000');
  await expect(canvas.getByRole('status')).toHaveTextContent('10件');
  await userEvent.click(dialog.getByRole('button', { name: '検索（3件）' }));
  await closed(canvasElement, '詳細条件');
  await expect(canvas.getByRole('textbox', { name: '検索' })).toHaveFocus();
  await expect(canvas.getByText('1–3件を表示')).toBeVisible();
  dialog = await openRange(canvasElement);
  await userEvent.clear(dialog.getByRole('spinbutton', { name: '下限（円）' }));
  await userEvent.type(dialog.getByRole('spinbutton', { name: '下限（円）' }), '7000');
  await expect(dialog.getByText('下限は上限以下にしてください。')).toBeVisible();
  await expect(dialog.getByRole('button', { name: '入力を確認' })).toBeDisabled();
  await userEvent.click(dialog.getByRole('button', { name: 'キャンセル' }));
  await closed(canvasElement, '詳細条件');
  await expect(canvas.getByText('1–3件を表示')).toBeVisible();
  dialog = await openRange(canvasElement);
  await expect(dialog.getByRole('spinbutton', { name: '下限（円）' })).toHaveValue(4000);
  await userEvent.click(dialog.getByRole('button', { name: '入力をクリア' }));
  await expect(canvas.getByText('1–3件を表示')).toBeInTheDocument();
  await userEvent.click(dialog.getByRole('button', { name: /^更新日の範囲:/ }));
  await fireEvent.input(dialog.getByLabelText('開始日'), { target: { value: '2026-06-27' } });
  await fireEvent.input(dialog.getByLabelText('終了日'), { target: { value: '2026-06-25' } });
  await waitFor(() => expect(dialog.getByText('開始日は終了日以前にしてください。')).toBeVisible());
  await fireEvent.input(dialog.getByLabelText('終了日'), { target: { value: '' } });
  await userEvent.click(dialog.getByRole('button', { name: '完了' }));
  await userEvent.click(dialog.getByRole('button', { name: '検索（1件）' }));
  await closed(canvasElement, '詳細条件');
  await expect(canvas.getByText('パフォーマンス改善')).toBeVisible();
  dialog = await openRange(canvasElement);
  await userEvent.click(dialog.getByRole('button', { name: '入力をクリア' }));
  await userEvent.type(dialog.getByRole('spinbutton', { name: '上限（円）' }), '0');
  await userEvent.click(dialog.getByRole('button', { name: '検索（0件）' }));
  await closed(canvasElement, '詳細条件');
  await expect(canvas.getByText('条件に一致するプロジェクトがありません')).toBeVisible();
  await userEvent.click(canvas.getByRole('button', { name: '条件を1つ解除' }));
  await expect(canvas.getByText('1–5件を表示')).toBeVisible();
  await expect(canvas.getByRole('textbox', { name: '検索' })).toHaveFocus();
}

export async function layoutInteraction({ canvasElement }: Context) {
  const canvas = within(canvasElement);
  const region = canvas.getByRole('region', { name: 'プロジェクト表のスクロール領域' });
  const tableTop = region.getBoundingClientRect().top;
  const search = canvas.getByRole('textbox', { name: '検索' });
  await userEvent.click(search);
  await expect(search).toHaveFocus();
  await waitFor(() => expect(canvas.getByRole('region', { name: '詳細条件' })).toBeVisible());
  await expect(region.getBoundingClientRect().top).toBe(tableTop);
  await userEvent.click(canvas.getByRole('heading', { name: 'プロジェクト一覧' }));
  await closed(canvasElement, '詳細条件');
  await userEvent.click(search);
  await userEvent.keyboard('{Escape}');
  await expect(search).toHaveFocus();
  await closed(canvasElement, '詳細条件');

  await waitFor(() => expect(region).toHaveAttribute('tabindex', '0'));
  await expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
  const identity = canvas.getByRole('cell', { name: /パフォーマンス改善 PRJ-1043/ });
  const before = identity.getBoundingClientRect().left;
  const checkboxCell = canvas.getByRole('checkbox', { name: 'パフォーマンス改善を選択' }).closest('td') as HTMLTableCellElement;
  const checkboxBefore = checkboxCell.getBoundingClientRect().left;
  const settingsCell = canvas.getByRole('button', { name: '表示列を選択' }).closest('th') as HTMLTableCellElement;
  const settingsBefore = settingsCell.getBoundingClientRect().left;
  region.focus();
  await expect(region).toHaveFocus();
  // 横移動しても行を識別する列が固定され、外側のページは広がらない。
  region.scrollLeft = 200;
  await waitFor(() => expect(region.scrollLeft).toBeGreaterThan(100));
  await expect(Math.abs(identity.getBoundingClientRect().left - before)).toBeLessThan(2);
  await expect(Math.abs(checkboxCell.getBoundingClientRect().left - checkboxBefore)).toBeLessThan(2);
  await expect(Math.abs(settingsCell.getBoundingClientRect().left - settingsBefore)).toBeLessThan(2);
  await expect(region.getBoundingClientRect().width).toBeLessThanOrEqual(360);
  await expect(canvasElement.ownerDocument.documentElement.scrollWidth).toBeLessThanOrEqual(canvasElement.ownerDocument.documentElement.clientWidth);
  region.scrollLeft = 0;
}

export async function selectionInteraction({ canvasElement }: Context) {
  const canvas = within(canvasElement);
  const headerWidths = () => canvas.getAllByRole('columnheader').map(header => header.getBoundingClientRect().width);
  const firstPageWidths = headerWidths();
  await userEvent.click(canvas.getByRole('checkbox', { name: 'パフォーマンス改善を選択' }));
  await expect(canvas.getByRole('status')).toHaveTextContent('1件を選択中');
  await expect(canvas.getByRole('checkbox', { name: 'このページの行をすべて選択' })).toHaveAttribute('aria-checked', 'mixed');
  const pagination = canvas.getByRole('navigation', { name: '検索結果のページ切り替え' });
  const paginationLeft = pagination.getBoundingClientRect().left;
  const nextLeft = canvas.getByRole('button', { name: '次へ' }).getBoundingClientRect().left;
  await userEvent.click(canvas.getByRole('button', { name: '次へ' }));
  await expect(canvas.getByRole('status')).toHaveTextContent('1件を選択中');
  await expect(Math.abs(pagination.getBoundingClientRect().left - paginationLeft)).toBeLessThan(1);
  await expect(Math.abs(canvas.getByRole('button', { name: '次へ' }).getBoundingClientRect().left - nextLeft)).toBeLessThan(1);
  headerWidths().forEach((width, index) => expect(Math.abs(width - firstPageWidths[index])).toBeLessThan(1));
  await userEvent.click(canvas.getByRole('checkbox', { name: 'このページの行をすべて選択' }));
  await expect(canvas.getByRole('status')).toHaveTextContent('6件を選択中');
  await userEvent.click(canvas.getByRole('button', { name: '前へ' }));
  await expect(canvas.getByRole('checkbox', { name: 'パフォーマンス改善を選択' })).toBeChecked();
  await userEvent.click(canvas.getByRole('button', { name: '選択を解除' }));
  await expect(canvas.getByRole('checkbox', { name: 'パフォーマンス改善を選択' })).not.toBeChecked();
  await expect(canvas.queryByRole('button', { name: '選択を解除' })).not.toBeInTheDocument();
}

export async function columnVisibilityInteraction({ canvasElement }: Context) {
  const canvas = within(canvasElement);
  const body = within(canvasElement.ownerDocument.body);
  const trigger = canvas.getByRole('button', { name: '表示列を選択' });
  const headers = canvas.getAllByRole('columnheader');
  await expect(trigger.closest('th')).toBe(headers[headers.length - 1]);
  await userEvent.click(trigger);
  for (const name of ['状態', '金額', '担当者', '更新日時']) {
    await userEvent.click(body.getByRole('menuitemcheckbox', { name }));
    await expect(body.getByRole('menuitemcheckbox', { name })).toHaveAttribute('aria-checked', 'false');
  }
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
  await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe('none'));
  await expect(canvas.getAllByRole('columnheader')).toHaveLength(3);
  await expect(canvas.getAllByRole('columnheader')[0].getBoundingClientRect().width).toBeLessThan(60);
  await expect(canvas.getByRole('columnheader', { name: /プロジェクト/ })).toBeVisible();
  await expect(canvas.getByRole('checkbox', { name: 'このページの行をすべて選択' })).toBeVisible();
  await userEvent.click(canvas.getByRole('button', { name: '次へ' }));
  await expect(canvas.getAllByRole('columnheader')).toHaveLength(3);
  const search = canvas.getByRole('textbox', { name: '検索' });
  await userEvent.type(search, '存在しない検索語');
  await userEvent.keyboard('{Enter}');
  await closed(canvasElement, '詳細条件');
  await expect(canvas.getByText('条件に一致するプロジェクトがありません').closest('td')).toHaveAttribute('colspan', '3');
  await userEvent.click(trigger);
  await userEvent.click(body.getByRole('menuitemcheckbox', { name: '金額' }));
  await expect(canvas.getByRole('columnheader', { name: '金額' })).toBeVisible();
}
