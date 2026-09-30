<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, userEvent, within, fireEvent, waitFor } from 'storybook/test';
  import { RangeCalendar } from '@mutsuna/ui/range-calendar';
  import { parseDate } from '@internationalized/date';
  const { Story } = defineMeta({ title: "Components/Data Display/Range Calendar", component: RangeCalendar, tags: ['autodocs'] });
</script>
{#snippet examples()}
  <div class="flex flex-wrap gap-6">
    <div><p>月をまたぐ期間選択</p><RangeCalendar numberOfMonths={2} placeholder={parseDate('2026-06-01')} value={{ start: parseDate('2026-06-25'), end: parseDate('2026-07-05') }} /></div>
    <div><p>選択可能な期間を制限</p><RangeCalendar placeholder={parseDate('2026-06-01')} minValue={parseDate('2026-06-05')} maxValue={parseDate('2026-06-25')} /></div>
    <div><p>連続スクロール</p><RangeCalendar scrollable placeholder={parseDate("2026-06-01")} /></div>
    <div><p>無効</p><RangeCalendar placeholder={parseDate('2026-06-01')} disabled /></div>
  </div>
{/snippet}
<Story name="Default">{@render examples()}</Story>
<Story name="Range Interaction" tags={['!dev', '!autodocs']} args={{ numberOfMonths: 2, placeholder: parseDate('2026-06-01') }} play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const start = canvasElement.querySelector('[data-range-calendar-day][data-value="2026-06-10"]') as HTMLElement;
  const end = canvasElement.querySelector('[data-range-calendar-day][data-value="2026-06-16"]') as HTMLElement;
  await userEvent.click(start);
  await userEvent.click(end);
  await expect(start).toHaveAttribute('data-range-start');
  await expect(end).toHaveAttribute('data-range-end');
  start.focus();
  await userEvent.keyboard('{ArrowRight}{Enter}{ArrowRight}{Enter}');
  await expect(canvasElement.querySelector('[data-range-calendar-day][data-value="2026-06-11"]')).toHaveAttribute('data-range-start');
  await expect(canvasElement.querySelector('[data-range-calendar-day][data-value="2026-06-12"]')).toHaveAttribute('data-range-end');
  const june = canvasElement.querySelector('[data-range-calendar-day][data-value="2026-06-29"]:not([data-outside-month])') as HTMLElement;
  const july = canvasElement.querySelector('[data-range-calendar-day][data-value="2026-07-05"]:not([data-outside-month])') as HTMLElement;
  await userEvent.click(june);
  await userEvent.click(july);
  await expect(june).toHaveAttribute('data-range-start');
  await expect(july).toHaveAttribute('data-range-end');
  for (const outside of canvasElement.querySelectorAll('[data-range-calendar-day][data-outside-month]')) {
    await expect(outside).not.toBeVisible();
  }
  await expect(canvas.getAllByRole('button', { name: '2026年7月5日日曜日' })).toHaveLength(1);
  await userEvent.click(canvas.getByRole('button', { name: '次の月' }));
  await expect(canvas.getByRole('button', { name: '前の月' })).toBeEnabled();
}} />

<Story name="Scroll Interaction" tags={['!dev', '!autodocs']} args={{ scrollable: true, placeholder: parseDate('2026-06-01') }} play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const scroller = canvas.getByRole('region', { name: '月をスクロールして選択' });
  await expect(canvas.queryByRole('button', { name: '次の月' })).not.toBeInTheDocument();
  const start = canvasElement.querySelector('[data-range-calendar-day][data-value="2026-06-29"]:not([data-outside-month])') as HTMLElement;
  await userEvent.click(start);
  const initialCount = scroller.querySelectorAll('[data-month]').length;
  scroller.scrollTop = scroller.scrollHeight;
  await fireEvent.scroll(scroller);
  await waitFor(() => expect(scroller.querySelectorAll('[data-month]').length).toBeGreaterThan(initialCount));
  const end = canvasElement.querySelector('[data-range-calendar-day][data-value="2027-03-05"]:not([data-outside-month])') as HTMLElement;
  end.scrollIntoView({ block: 'center' });
  await userEvent.click(end);
  await expect(start).toHaveAttribute('data-range-start');
  await expect(end).toHaveAttribute('data-range-end');
  const beforePrepend = scroller.querySelectorAll('[data-month]').length;
  scroller.scrollTop = 0;
  await fireEvent.scroll(scroller);
  await waitFor(() => expect(scroller.querySelectorAll('[data-month]').length).toBeGreaterThan(beforePrepend));
  await expect(scroller.scrollTop).toBeGreaterThan(0);
}} />
