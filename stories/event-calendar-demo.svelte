<script lang="ts">
  import AppDialogs from "./event-calendar-app-dialogs.svelte";
  let dialogs: AppDialogs;
  let draft = $state<EventCalendarEvent | null>(null);
  import { untrack } from "svelte";
  import { EventCalendar, type EventCalendarEvent, type EventCalendarCreate, type EventCalendarChange, type EventCalendarView } from "@mutsuna/ui/event-calendar";
  import { Button } from "@mutsuna/ui/button";
  let { readonly = false, disabled = false, loading = false, error, narrow = false, dayCount, initialView = "week" }: { readonly?: boolean; disabled?: boolean; loading?: boolean; error?: string; narrow?: boolean; dayCount?: number; initialView?: EventCalendarView } = $props();
  const initial: EventCalendarEvent[] = [
    { id: "all-day", title: "終日の予定", allDay: true, start: "2026-10-05", end: "2026-10-06", description: "終日行から詳細を確認できます。", color: "#2563eb" },
    { id: "all-day-span", title: "複数日にまたがる予定", allDay: true, start: "2026-10-07", end: "2026-10-10", description: "終了日は含まない日付範囲で指定します。", color: "#0d9488" },
    { id: "all-day-overlap", title: "別の終日予定", allDay: true, start: "2026-10-08", end: "2026-10-09", color: "#7c3aed" },
    { id: "design", title: "デザインレビュー", start: "2026-10-05T09:00", end: "2026-10-05T10:30", description: "今週の画面案を確認します。\n予定をクリックすると詳細が開きます。", color: "#2563eb" },
    { id: "meeting", title: "チームミーティング", start: "2026-10-05T10:00", end: "2026-10-05T11:00", description: "重なる予定は少し右へずらして手前に表示します。", color: "#7c3aed" },
    { id: "short", title: "短いミーティング", start: "2026-10-06T11:00", end: "2026-10-06T11:15", description: "15分の予定でもタイトルを表示します。時刻は詳細で確認できます。", color: "#2563eb" },
    { id: "short-next", title: "次のミーティング", start: "2026-10-06T11:15", end: "2026-10-06T11:30", color: "#2563eb" },
    { id: "half", title: "30分の予定", start: "2026-10-08T11:00", end: "2026-10-08T11:30", color: "#2563eb" },
    { id: "work", title: "集中作業：長いタイトルは表示領域で切って表示します", start: "2026-10-07T13:00", end: "2026-10-07T15:00", color: "#0d9488" },
    { id: "fixed", title: "変更できない予定", start: "2026-10-09T11:00", end: "2026-10-09T12:00", editable: false, description: "詳細表示はできます。移動と時間変更は無効です。" },
    ...["企画打ち合わせ", "資料のレビュー", "開発の相談", "進捗の確認", "翌日の準備"].map((title, index) => ({
      id: `layered-${index}`, title, start: `2026-10-07T${15 + index}:00`, end: "2026-10-07T20:00",
      description: "5件の予定が重なります。開始時刻が離れたカードは広い幅で表示します。",
      color: ["#2563eb", "#7c3aed", "#0d9488", "#d97706", "#db2777"][index],
    })),
    ...["営業相談", "制作相談", "採用相談"].map((title, index) => ({
      id: `simultaneous-${index}`, title, start: "2026-10-08T14:00", end: "2026-10-08T16:00",
      description: "同じ時刻に始まる3件の予定は、タイトルが隠れないように並べます。",
      color: ["#2563eb", "#7c3aed", "#0d9488"][index],
    })),
  ];
  const rows = [{ id: "room-a", label: "会議室A" }, { id: "room-b", label: "会議室B" }, { id: "desk", label: "作業スペース" }];
  const initialEvents = initial.map((event, index) => ({ ...event, rowId: rows[index % rows.length].id }));
  let events = $state<EventCalendarEvent[]>(initialEvents.map(event => ({ ...event })));
  let date = $state("2026-10-05");
  let view = $state<EventCalendarView>(untrack(() => initialView));
  let action = $state("空き枠から予定を作成できます。変更はこのデモ内だけに保存されます。");
  let count = 0;
  function create(range: EventCalendarCreate & { title: string }) {
    count += 1;
    events = [...events, { id: `new-${count}`, description: "カレンダーから作成した予定です。", ...range }];
    action = `作成: ${range.start} ～ ${range.end}`;
  }
  function change(change: EventCalendarChange) {
    events = events.map(event => event.id === change.event.id ? { ...event, start: change.start, end: change.end, ...("rowId" in change ? { rowId: change.rowId } : {}) } : event);
    action = `${change.kind}: ${change.start} ～ ${change.end}`;
  }
</script>
<div class="space-y-3" style:max-width={narrow ? "390px" : "1100px"}>
  <div class="flex items-center justify-between gap-3"><p class="text-sm text-muted-foreground" data-testid="calendar-action">{action}</p>
    <Button variant="outline" size="sm" onclick={() => { events = initialEvents.map(event => ({ ...event })); date = "2026-10-05"; count = 0; action = "初期状態に戻しました。"; }}>リセット</Button>
  </div>
  <EventCalendar ariaLabel={readonly ? "閲覧用カレンダー" : loading ? "読み込み中のカレンダー" : narrow ? "狭い画面のカレンダー" : dayCount ? `${dayCount}日間カレンダー` : "週間カレンダー"} currentTime="2026-10-07T10:15" bind:date bind:view backgroundRanges={[
    { id: "morning", start: "2026-10-05T08:00", end: "2026-10-05T09:00", color: "color-mix(in srgb, var(--muted-foreground) 12%, transparent)" },
    { id: "day-background", start: "2026-10-10", end: "2026-10-12", color: "color-mix(in srgb, var(--primary) 8%, transparent)" },
    { id: "row-background", start: "2026-10-07T12:00", end: "2026-10-07T13:00", rowId: "room-a", color: "color-mix(in srgb, var(--destructive) 10%, transparent)" },
  ]} {dayCount} {events} {rows} {readonly} {disabled} {loading} {error} {draft} onCreate={(range, context) => dialogs.create(range, context)} onEventClick={(event, context) => dialogs.select(event, context)} onEventChange={change} />
</div>

<AppDialogs bind:this={dialogs} bind:draft onSave={create} />
