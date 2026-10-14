<script lang="ts">
  import { EventCalendar, type EventCalendarView } from "@mutsuna/ui/event-calendar";
  import { Button } from "@mutsuna/ui/button";
  import { ButtonGroup } from "@mutsuna/ui/button-group";
  import { Select, SelectTrigger, SelectContent, SelectItem } from "@mutsuna/ui/select";
  let view = $state<EventCalendarView>("day");
  let date = $state("2026-10-05");
  let fullDay = $state(true);
  let updates = $state(0);
  const views: { value: EventCalendarView; label: string }[] = [
    { value: "day", label: "日表示" }, { value: "week", label: "週表示" }, { value: "month", label: "月表示" },
    { value: "timeline", label: "タイムライン" }, { value: "date-timeline", label: "日付タイムライン" },
  ];
</script>
<div class="flex min-h-0 flex-col" style:height="min(900px, calc(100dvh - 32px))">
  <EventCalendar layout="fill" class="min-h-0 flex-1" bind:date bind:view
    startHour={fullDay ? 0 : 8} endHour={fullDay ? 24 : 20}
    rows={[{ id: "a", label: "会議室A" }, { id: "b", label: "会議室B" }]}
    events={[{ id: "meeting", rowId: "a", title: "打ち合わせ", start: "2026-10-05T09:00", end: "2026-10-05T11:00" }]}>
    {#snippet toolbarFilters()}
      <ButtonGroup aria-label="時間幅">
        <Button size="sm" variant={fullDay ? "outline" : "default"} onclick={() => fullDay = false}>営業時間</Button>
        <Button size="sm" variant={fullDay ? "default" : "outline"} onclick={() => fullDay = true}>24時間</Button>
      </ButtonGroup>
    {/snippet}
    {#snippet toolbarActions()}
      <Button size="sm" variant="outline" onclick={() => updates++}>更新</Button>
      <span class="sr-only" role="status">{updates}回更新しました</span>
    {/snippet}
    {#snippet viewSwitcher()}
      <Select type="single" value={view} onValueChange={(value) => view = value as EventCalendarView}>
        <SelectTrigger class="w-44" aria-label="表示方法">{views.find((item) => item.value === view)?.label}</SelectTrigger>
        <SelectContent>{#each views as item (item.value)}<SelectItem value={item.value}>{item.label}</SelectItem>{/each}</SelectContent>
      </Select>
    {/snippet}
  </EventCalendar>
</div>
