<script lang="ts">
  import AppDialogs from "./event-calendar-app-dialogs.svelte";
  let dialogs: AppDialogs;
  let draft = $state<EventCalendarEvent | null>(null);
  import { onDestroy } from "svelte";
  import { EventCalendar, type EventCalendarEvent, type EventCalendarVisibleRange, type EventCalendarPrefetchRange } from "@mutsuna/ui/event-calendar";
  import { Button } from "@mutsuna/ui/button";

  let date = $state("2026-10-05");
  const initial: EventCalendarEvent[] = [{ id: "initial", title: "取得済みの予定", start: "2026-10-05T09:00", end: "2026-10-05T10:00" }];
  let events = $state<EventCalendarEvent[]>(initial);
  let eventsLoading = $state(false);
  let eventsError = $state<string>();
  let range = $state<EventCalendarVisibleRange>({ start: "2026-10-05", end: "2026-10-12", view: "week" });
  let initialized = false;
  let request = 0;
  let destroyed = false;
  let neighbors: EventCalendarPrefetchRange | undefined;
  let prefetchEnabled = $state(false);
  let prefetchReady = $state(false);
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const cache = new Map<string, EventCalendarEvent[]>();
  const key = (value: EventCalendarVisibleRange) => `${value.start}:${value.end}`;
  cache.set("2026-10-05:2026-10-12", initial);
  const pending = new Map<string, Promise<EventCalendarEvent[]>>();
  function publishCache() {
    const ranges = [range, ...(neighbors ? [neighbors.previous, neighbors.next] : [])];
    events = [...new Map(ranges.flatMap(value => cache.get(key(value)) ?? []).map(event => [event.id, event])).values()];
    prefetchReady = !!neighbors && [neighbors.previous, neighbors.next].every(value => cache.has(key(value)));
  }
  function load(value: EventCalendarVisibleRange, fail = false, refresh = false): Promise<EventCalendarEvent[]> {
    const cacheKey = key(value);
    if (!refresh && cache.has(cacheKey)) return Promise.resolve(cache.get(cacheKey)!);
    if (!refresh && pending.has(cacheKey)) return pending.get(cacheKey)!;
    const promise: Promise<EventCalendarEvent[]> = new Promise<EventCalendarEvent[]>((resolve, reject) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (fail) { reject(new Error("予定を取得できませんでした。再取得してください。")); return; }
        const result = [{ id: `fetched-${value.start}`, title: "取得した予定", start: `${value.start}T09:00`, end: `${value.start}T10:00` }];
        cache.set(cacheKey, result);
        resolve(result);
      }, 1500);
      timers.add(timer);
    }).finally(() => { if (pending.get(cacheKey) === promise) pending.delete(cacheKey); });
    pending.set(cacheKey, promise);
    return promise;
  }

  async function fetchEvents(value: EventCalendarVisibleRange, fail = false, refresh = true) {
    const id = ++request;
    eventsLoading = true; eventsError = undefined;
    publishCache();
    try {
      await load(value, fail, refresh);
      if (destroyed || id !== request) return;
      eventsLoading = false;
      publishCache();
    } catch (error) {
      if (destroyed || id !== request) return;
      eventsLoading = false; eventsError = (error as Error).message;
    }
  }
  function changed(value: EventCalendarVisibleRange) {
    range = value;
    if (!initialized) { initialized = true; return; }
    if (cache.has(key(value))) { request++; eventsLoading = false; eventsError = undefined; publishCache(); }
    else void fetchEvents(value, false, false);
  }
  function prefetch(value: EventCalendarPrefetchRange) {
    neighbors = value;
    publishCache();
    if (!prefetchEnabled) return;
    for (const neighbor of [value.previous, value.next]) {
      // Background failures do not turn a successfully loaded current range into an error.
      void load(neighbor).then(() => { if (!destroyed) publishCache(); }).catch(() => {});
    }
  }
  onDestroy(() => { destroyed = true; request++; for (const timer of timers) clearTimeout(timer); });
</script>

<div class="space-y-3" style:max-width="1000px">
  <p class="text-sm text-muted-foreground">取得には1.5秒かかります。先読みを有効にすると、前後の予定をスワイプ途中から表示できます。取得済みの範囲は待たずに切り替わります。</p>
  <div class="flex flex-wrap gap-2">
    <Button variant="outline" size="sm" onclick={() => fetchEvents(range)}>取得待ちを試す</Button>
    <Button variant="outline" size="sm" onclick={() => fetchEvents(range, true)}>取得失敗を試す</Button>
    <Button variant="outline" size="sm" disabled={prefetchEnabled} onclick={() => { prefetchEnabled = true; if (neighbors) prefetch(neighbors); }}>先読みを有効にする</Button>
  </div>
  {#if prefetchEnabled}<p class="text-xs text-muted-foreground" data-testid="prefetch-state">{prefetchReady ? "前後の予定を先読み済み" : "前後の予定を先読み中…"}</p>{/if}
  <p class="text-xs tabular-nums" data-testid="visible-range">{range.view}: {range.start} ～ {range.end}（終了日を含まない）</p>
  <EventCalendar bind:date {events} {eventsLoading} {eventsError} onVisibleRangeChange={changed} onPrefetchRange={prefetch} onEventsRetry={fetchEvents}
    {draft} onCreate={(range, context) => dialogs.create(range, context)} onEventClick={(event, context) => dialogs.select(event, context)} />
</div>

<AppDialogs bind:this={dialogs} bind:draft onSave={(created) => { cache.set(key(range), [...(cache.get(key(range)) ?? []), { id: `created-${events.length}`, ...created }]); publishCache(); }} />
