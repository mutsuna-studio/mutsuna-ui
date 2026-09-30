<script module lang="ts">
  import { RangeCalendar as Primitive } from 'bits-ui';
  import type { WithoutChildrenOrChild } from '../utils.js';
  export type RangeCalendarProps = WithoutChildrenOrChild<Primitive.RootProps> & { scrollable?: boolean };
</script>
<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { today, getLocalTimeZone, parseDate } from '@internationalized/date';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import { Button } from '../button/index.js';
  import { cn } from '../utils.js';
  import { getCalendarDayColorClass } from '../calendar/calendar-day-color.js';
  let { value = $bindable(), placeholder = $bindable(), ref = $bindable(null), class: className,
    locale = 'ja-JP', weekStartsOn = 1, fixedWeeks = true, scrollable = false, numberOfMonths = 1, ...rest }: RangeCalendarProps = $props();
  let scroller: HTMLDivElement | undefined = $state();
  let loadedMonths = $state(12);
  let updating = false;
  async function initializeScroll() {
    updating = true;
    const target = placeholder ?? value?.start ?? today(getLocalTimeZone());
    placeholder = target.subtract({ months: Math.min(3, (target.year - 1) * 12 + target.month - 1) });
    loadedMonths = 12;
    await tick();
    const month = scroller?.querySelector<HTMLElement>(`[data-month="${target.set({ day: 1 }).toString()}"]`);
    if (scroller && month) scroller.scrollTop += month.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    updating = false;
  }
  $effect(() => { if (scrollable && scroller) untrack(() => { void initializeScroll(); }); });
  async function extendMonths() {
    if (!scrollable || !scroller || updating) return;
    const before = scroller.querySelector<HTMLElement>('[data-month]');
    if (!before) return;
    const earlier = scroller.scrollTop < 100;
    if (!earlier && scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight > 160) return;
    const first = parseDate(before.dataset.month!);
    const amount = earlier ? Math.min(6, (first.year - 1) * 12 + first.month - 1) : Math.min(6, (9999 - first.year) * 12 + 12 - first.month - loadedMonths);
    if (amount <= 0) return;
    updating = true;
    const oldTop = before.getBoundingClientRect().top;
    placeholder = earlier ? first.subtract({ months: amount }) : first;
    loadedMonths += amount;
    await tick();
    const retained = scroller.querySelector<HTMLElement>(`[data-month="${first.toString()}"]`);
    if (retained) scroller.scrollTop += retained.getBoundingClientRect().top - oldTop;
    updating = false;
  }
</script>
<Primitive.Root bind:ref bind:value bind:placeholder {locale} {weekStartsOn} {fixedWeeks} numberOfMonths={scrollable ? loadedMonths : numberOfMonths}
  class={cn('w-fit max-w-full rounded-lg bg-background p-3 [--cell-size:2rem]', className)} {...rest}>
  {#snippet children({ months, weekdays })}
    {#if !scrollable}
    <Primitive.Header>
      {#snippet child({ props })}
        <div {...props} class="mb-3 flex items-center justify-between gap-2">
          <Primitive.PrevButton>
            {#snippet child({ props })}<Button {...props} aria-label="前の月" variant="ghost" size="icon" class="size-8"><ChevronLeft class="size-4" /></Button>{/snippet}
          </Primitive.PrevButton>
          <Primitive.Heading class="text-sm font-medium" />
          <Primitive.NextButton>
            {#snippet child({ props })}<Button {...props} aria-label="次の月" variant="ghost" size="icon" class="size-8"><ChevronRight class="size-4" /></Button>{/snippet}
          </Primitive.NextButton>
        </div>
      {/snippet}
    </Primitive.Header>
    {/if}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users must be able to scroll the named month region.) -->
    <div bind:this={scroller} onscroll={extendMonths} role={scrollable ? "region" : undefined} aria-label={scrollable ? "月をスクロールして選択" : undefined} tabindex={scrollable ? 0 : undefined} class={scrollable ? "flex max-h-[min(28rem,50dvh)] flex-col gap-4 overflow-y-auto overscroll-contain [overflow-anchor:none]" : "flex flex-wrap justify-center gap-4"}>
      {#each months as month (month.value.toString())}
        <div data-month={month.value.set({ day: 1 }).toString()}>
        {#if months.length > 1}<p class="mb-2 text-center text-sm font-medium">{new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(month.value.toDate('UTC'))}</p>{/if}
        <Primitive.Grid class="border-collapse">
          <Primitive.GridHead><Primitive.GridRow>
            {#each weekdays as weekday}<Primitive.HeadCell class="size-(--cell-size) text-xs font-normal text-muted-foreground">{weekday}</Primitive.HeadCell>{/each}
          </Primitive.GridRow></Primitive.GridHead>
          <Primitive.GridBody>
            {#each month.weeks as week}
              <Primitive.GridRow>
                {#each week as date}
                  <Primitive.Cell {date} month={month.value} class="p-0 text-center">
                    <Primitive.Day class={cn('flex size-(--cell-size) items-center justify-center rounded-md text-sm hover:bg-accent focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-ring data-[highlighted]:rounded-none data-[highlighted]:bg-accent data-[selected]:rounded-none data-[selected]:bg-accent data-[selection-start]:rounded-l-md data-[selection-start]:bg-primary data-[selection-start]:text-primary-foreground data-[selection-end]:rounded-r-md data-[selection-end]:bg-primary data-[selection-end]:text-primary-foreground data-[range-start]:rounded-l-md data-[range-end]:rounded-r-md data-[range-start]:bg-primary data-[range-start]:text-primary-foreground data-[range-end]:bg-primary data-[range-end]:text-primary-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[unavailable]:line-through data-[outside-month]:opacity-40', getCalendarDayColorClass(date), months.length > 1 && 'data-[outside-month]:invisible')} />
                  </Primitive.Cell>
                {/each}
              </Primitive.GridRow>
            {/each}
          </Primitive.GridBody>
        </Primitive.Grid>
        </div>
      {/each}
    </div>
  {/snippet}
</Primitive.Root>
