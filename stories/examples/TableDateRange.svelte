<script lang="ts">
  import { MediaQuery } from 'svelte/reactivity';
  const narrow = new MediaQuery('(max-width: 559px)');
  import { RangeCalendar } from '@mutsuna/ui/range-calendar';
  import { Button } from '@mutsuna/ui/button';
  import { Input } from '@mutsuna/ui/input';
  import * as Popover from '@mutsuna/ui/popover';
  import { Popover as PopoverPrimitive } from 'bits-ui';
  import CalendarIcon from '@lucide/svelte/icons/calendar';
  import { parseDate, today, getLocalTimeZone, type DateValue } from '@internationalized/date';
  let { from = $bindable(''), to = $bindable('') }: { from?: string; to?: string } = $props();
  let open = $state(false);
  let value = $state<{ start: DateValue | undefined; end: DateValue | undefined }>({ start: undefined, end: undefined });
  let placeholder = $state<DateValue>(parseDate('2000-01-01'));
  function date(text: string) { try { return text ? parseDate(text) : undefined; } catch { return undefined; } }
  function sync() { value = { start: date(from), end: date(to) }; }
  const summary = $derived(from || to ? `${from.replaceAll('-', '/')} 〜 ${to.replaceAll('-', '/')}` : 'すべての期間');
</script>
<Popover.Root bind:open onOpenChange={(next) => { if (next) { sync(); placeholder = date(from) ?? date(to) ?? today(getLocalTimeZone()); } }}>
  <Popover.Trigger>
    {#snippet child({ props })}
      <div class="relative min-w-0">
        <Button {...props} variant="outline" class="h-10 w-full justify-between" aria-label={`更新日の範囲: ${summary}`}>
          <span class="truncate">{summary}</span><CalendarIcon class="size-4 shrink-0 text-muted-foreground" />
        </Button>
        <span class="pointer-events-none absolute -top-2 left-3 bg-background px-1 text-xs text-muted-foreground">更新日の範囲</span>
      </div>
    {/snippet}
  </Popover.Trigger>
  <PopoverPrimitive.ContentStatic data-slot="popover-content" aria-label="更新日の範囲を選択" trapFocus={false}
    class="fixed left-1/2 top-1/2 z-50 flex w-[34rem] max-w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-2.5 overflow-hidden rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none"
    style="max-height: calc(100dvh - 24px);"
    onEscapeKeydown={(event) => event.stopPropagation()} onkeydown={(event) => { if (event.key === "Escape") { event.stopPropagation(); open = false; } }}>

    <div class="min-h-0 overflow-y-auto overscroll-contain">
    <RangeCalendar scrollable={narrow.current} numberOfMonths={2} class="mx-auto" bind:value bind:placeholder onValueChange={(range) => { if (range.start && range.end) { from = range.start.toString(); to = range.end.toString(); } }} />
    <p class="mb-3 text-xs text-muted-foreground">開始日、終了日の順に選択してください。</p>
    <div class="grid grid-cols-2 gap-2 pt-2">
      <Input type="date" label="開始日" aria-label="開始日" bind:value={from} onchange={sync} />
      <Input type="date" label="終了日" aria-label="終了日" bind:value={to} onchange={sync} />
    </div>
    </div>
    <div class="flex shrink-0 items-center justify-between border-t pt-2">
      <Button variant="ghost" size="sm" onclick={() => { from = ''; to = ''; sync(); }}>期間をクリア</Button>
      <Button variant="outline" size="sm" onclick={() => open = false}>完了</Button>
    </div>
  </PopoverPrimitive.ContentStatic>
</Popover.Root>
