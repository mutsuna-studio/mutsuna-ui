<script lang="ts">
  import AppDialogs from "./event-calendar-app-dialogs.svelte";
  let dialogs: AppDialogs;
  let draft = $state<EventCalendarEvent | null>(null);
  let useDialogs = $state(true);
  let notification = $state("");
  import { EventCalendar, type EventCalendarEvent, type EventCalendarView, type EventCalendarPrefetchRange } from "@mutsuna/ui/event-calendar";
  let events = $state<EventCalendarEvent[]>([
    { id: "one", title: "Astro予定", start: "2026-10-05T09:00", end: "2026-10-05T10:00", description: "Astroで詳細を表示" },
    { id: "short", title: "Astro短い予定", start: "2026-10-08T11:00", end: "2026-10-08T11:15" },
  ]);
  const timelineAllDay = Array.from({ length: 3 }, (_, index) => ({ id: `all-day-${index}`, title: `Astro終日予定${index + 1}`, allDay: true, start: "2026-10-05", end: "2026-10-10", rowId: "a", color: "#0d9488" }));
  let date = $state("2026-10-05");
  let view = $state<EventCalendarView>("week");
  let action = $state("");
  let count = 0;
  let eventsLoading = $state(false);
  let eventsError = $state<string>();
  let range = $state("");
  let notifications = $state(0);
  let dayCount = $state<number>();
  let adjacent = $state<EventCalendarPrefetchRange>();
  let prefetchNotifications = $state(0);
  let prefetchedEvents = $state<EventCalendarEvent[]>([]);
</script>
<section id="event-calendar-probe" style:max-width="1000px">
  <h2>EventCalendar hydration</h2>
  <button onclick={() => useDialogs = false}>アプリの画面を開かずに通知を確認</button>
  <p data-calendar-interaction>{notification}</p>
  <p role="status" data-calendar-result>{action}</p>
  <p data-calendar-range>{range}</p><span data-calendar-range-count>{notifications}</span>
  <p data-calendar-prefetch>{adjacent?.previous.start} {adjacent?.previous.end} / {adjacent?.next.start} {adjacent?.next.end}</p><span data-calendar-prefetch-count>{prefetchNotifications}</span>
  <div>
    <button onclick={() => { eventsLoading = true; eventsError = undefined; }}>予定を取得中にする</button>
    <button onclick={() => { eventsLoading = false; eventsError = "予定の取得に失敗しました"; }}>予定取得を失敗させる</button>
    <button onclick={() => { eventsLoading = false; eventsError = undefined; }}>予定取得を完了させる</button>
    <button onclick={() => dayCount = 3}>3日間に変更する</button>
    <button onclick={() => { dayCount = undefined; date = "2026-10-05"; }}>表示範囲を戻す</button>
    <button onclick={() => { if (adjacent) prefetchedEvents = [{ id: "prefetched-next", title: "先読みした予定", start: `${adjacent.next.start}T09:00`, end: `${adjacent.next.start}T10:00` }]; }}>先読みイベントを渡す</button>
  </div>
  <EventCalendar currentTime="2026-10-05T10:15" bind:date bind:view events={[...events, ...prefetchedEvents, ...(view === "timeline" || view === "date-timeline" ? timelineAllDay : [])]} rows={[{ id: "a", label: "会議室A" }, { id: "b", label: "会議室B" }]}
    backgroundRanges={[
      { id: "global-bg", start: "2026-10-05T12:00", end: "2026-10-05T13:00", color: "rgb(230, 235, 240)" },
      { id: "date-bg", start: "2026-10-06", end: "2026-10-07", color: "rgb(240, 235, 230)" },
      { id: "row-bg", start: "2026-10-05T14:00", end: "2026-10-05T15:00", rowId: "a", color: "rgb(235, 240, 230)" },
    ]}
    {dayCount} {eventsLoading} {eventsError}
    onVisibleRangeChange={(value) => { range = `${value.view} ${value.start} ${value.end}`; notifications++; }}
    onPrefetchRange={(value) => { adjacent = value; prefetchNotifications++; }}
    onEventsRetry={() => { eventsLoading = true; eventsError = undefined; }}
    {draft} onCreate={(range, context) => { notification = `create ${range.start} ${range.end} ${context.trigger.tagName} title=${"title" in range}`; if (useDialogs) dialogs.create(range, context); }} onEventClick={(event, context) => { notification = `select ${event.id} ${context.trigger.tagName}`; if (useDialogs) dialogs.select(event, context); }}
    onEventChange={(change) => { events = events.map(event => event.id === change.event.id ? { ...event, start: change.start, end: change.end, ...("rowId" in change ? { rowId: change.rowId } : {}) } : event); action = `${change.kind} ${change.start} ${change.end}`; }} />
</section>

<AppDialogs bind:this={dialogs} bind:draft onSave={(range) => { count++; events = [...events, { id: `created-${count}`, color: "#8b5cf6", ...range }]; action = `create ${range.start} ${range.end}`; }} />
