<script lang="ts">
  import { tick } from "svelte";
  import { type EventCalendarEvent, type EventCalendarCreate, type EventCalendarInteractionContext } from "@mutsuna/ui/event-calendar";
  import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@mutsuna/ui/dialog";
  import { Input } from "@mutsuna/ui/input";
  import { Button } from "@mutsuna/ui/button";
  let { draft = $bindable(null), onSave }: { draft?: EventCalendarEvent | null; onSave?: (event: EventCalendarCreate & { title: string }) => void } = $props();
  let open = $state(false);
  let range = $state<EventCalendarCreate | null>(null);
  let selected = $state<EventCalendarEvent | null>(null);
  let title = $state("");
  let trigger: HTMLElement | undefined;
  const titleId = $props.id();
  $effect(() => { if (open && range) draft = { id: "application-draft", title: title.trim() || "新しい予定", ...range }; });
  export function create(value: EventCalendarCreate, context: EventCalendarInteractionContext) {
    range = value; selected = null; title = ""; trigger = context.trigger;
    draft = { id: "application-draft", title: "新しい予定", ...value }; open = true;
  }
  export function select(value: EventCalendarEvent, context: EventCalendarInteractionContext) {
    selected = value; range = null; trigger = context.trigger; open = true;
  }
  function day(value: string) {
    const weekday = new Intl.DateTimeFormat("ja-JP", { weekday: "long", timeZone: "UTC" }).format(new Date(value.slice(0, 10) + "T12:00:00Z"));
    return `${Number(value.slice(5, 7))}月${Number(value.slice(8, 10))}日(${weekday})`;
  }
  function time(value: string) { return `${Number(value.slice(11, 13))}:${value.slice(14, 16)}`; }
  function label(value: EventCalendarCreate | EventCalendarEvent) {
    if (value.allDay) {
      const last = new Date(value.end + "T12:00:00Z"); last.setUTCDate(last.getUTCDate() - 1);
      const end = last.toISOString().slice(0, 10);
      return `${day(value.start)}${end === value.start ? "" : `～${day(end)}`}・終日`;
    }
    return `${day(value.start)}・${time(value.start)}～${value.start.slice(0,10) === value.end.slice(0,10) ? "" : day(value.end) + "・"}${time(value.end)}`;
  }
</script>
<Dialog bind:open>
  <DialogContent class="md:min-w-0 md:w-[26rem]" onCloseAutoFocus={async (event) => { event.preventDefault(); draft = null; range = null; await tick(); if (trigger?.isConnected) trigger.focus(); }}>
    <DialogTitle class={range ? "sr-only" : "pr-8"}>{range ? "予定を作成" : selected?.title ?? "予定の詳細"}</DialogTitle>
    <DialogDescription class="mt-2 tabular-nums">{range ? label(range) : selected ? label(selected) : ""}</DialogDescription>
    {#if range}
      <form class="mt-4 space-y-4" onsubmit={(event) => { event.preventDefault(); if (!range || !title.trim()) return; onSave?.({ ...range, title: title.trim() }); open = false; }}>
        <label for={titleId} class="sr-only">タイトル</label><Input id={titleId} bind:value={title} required placeholder="タイトルを入力" />
        <div class="flex justify-end gap-2"><Button variant="outline" onclick={() => open = false}>キャンセル</Button><Button type="submit" disabled={!title.trim()}>作成</Button></div>
      </form>
    {:else if selected}<p class="mt-4 whitespace-pre-wrap">{selected.description ?? "説明はありません。"}</p>{/if}
  </DialogContent>
</Dialog>
