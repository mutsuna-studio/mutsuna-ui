<script module lang="ts">
import { expect, userEvent, waitFor, within } from "storybook/test";
import { today, getLocalTimeZone } from "@internationalized/date";
import { defineMeta } from "@storybook/addon-svelte-csf";
import Calendar from "@mutsuna/ui/calendar/calendar.svelte";

const { Story } = defineMeta({
  title: "Components/Data Display/Calendar",
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
    <p class="px-3 pb-3 text-sm text-muted-foreground">年月を開くと、年・月候補にテーマ連動スクロールバーを表示。</p>
  </div>
</Story>

<Story name="Dropdown Interaction Test" tags={["!dev", "!autodocs"]} asChild play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const monthYearTrigger = canvas.getByRole("button", { name: "年月" });
  await userEvent.click(monthYearTrigger);
  await expect(canvas.getByRole("button", { name: "日付選択へ戻る" })).toBeInTheDocument();
  await expect(canvas.getByRole("button", { name: "2026年を選択" })).toHaveAttribute("aria-pressed", "true");
  await expect(canvas.getByRole("button", { name: "8月を選択" })).toHaveAttribute("aria-pressed", "true");
  await userEvent.click(canvas.getByRole("button", { name: "11月を選択" }));
  await waitFor(() => expect(canvas.getByRole("button", { name: "年月" })).toHaveTextContent("2026年 11月"));
  await expect(canvas.queryByRole("button", { name: "日付選択へ戻る" })).not.toBeInTheDocument();
}}>
  <Calendar type="single" value={parseDate("2026-08-02")} captionLayout="dropdown" />
</Story>

<Story name="Disabled Dates" asChild>
  <Calendar
    type="single"
    value={parseDate("2026-08-10")}
    isDateDisabled={(date) => date.day < 10}
    captionLayout="dropdown-months"
  />
</Story>

<Story name="Today" asChild play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole("button", { name: "今日" }));
  await expect(canvas.getByTestId("today-value")).toHaveTextContent(today(getLocalTimeZone()).toString());
}}>
  <Calendar type="single" bind:value={selectedDate} />
  <p data-testid="today-value">{selectedDate?.toString()}</p>
</Story>
<Story name="Today Unavailable" asChild play={async ({ canvasElement }) => {
  await expect(within(canvasElement).getByRole("button", { name: "今日" })).toBeDisabled();
}}>
  <Calendar type="single" isDateUnavailable={() => true} />
</Story>
