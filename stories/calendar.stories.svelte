<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Calendar from "@mutsuna/ui/calendar/calendar.svelte";

const { Story } = defineMeta({
  title: "UI/Calendar",
  component: Calendar,
  tags: ["autodocs"],
});
</script>

<script lang="ts">
import { parseDate, type DateValue } from "@internationalized/date";

let selectedDate = $state<DateValue | undefined>(parseDate("2026-08-02"));
</script>

<Story name="Default" asChild>
  <div class="grid max-w-fit gap-2 rounded-md border">
    <Calendar type="single" bind:value={selectedDate} captionLayout="dropdown" />
    <p class="px-3 pb-3 text-sm text-muted-foreground">
      選択日: {selectedDate?.toString() ?? "未選択"}
    </p>
  </div>
</Story>

<Story name="Disabled Dates" asChild>
  <Calendar
    type="single"
    value={parseDate("2026-08-10")}
    isDateDisabled={(date) => date.day < 10}
    captionLayout="dropdown-months"
  />
</Story>
