<script module lang="ts">
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
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
  <div class="grid w-fit max-w-full gap-2">
    <Calendar class="w-[15.625rem] max-w-full rounded-md border" type="single" bind:value={selectedDate} captionLayout="dropdown" />
    <p class="w-0 min-w-full text-sm text-muted-foreground">
      選択日: {selectedDate?.toString() ?? "未選択"}
    </p>
    <p class="w-0 min-w-full text-sm text-muted-foreground">数字を直接入力するか、ホイールで年月を変更できます。Tabで年と月を移動します。</p>
  </div>
</Story>

<Story name="Dropdown Interaction Test" tags={["!dev", "!autodocs"]} asChild play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const monthYearTrigger = canvas.getByRole("button", { name: "年月" });
  await userEvent.click(monthYearTrigger);
  await expect(canvas.getByRole("button", { name: "日付選択へ戻る" })).toBeInTheDocument();
  await expect(canvas.getByRole("spinbutton", { name: "年" })).toHaveAttribute("aria-valuenow", "2026");
  const month = canvas.getByRole("spinbutton", { name: "月" });
  month.focus();
  await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
  await expect(month).toHaveAttribute("aria-valuenow", "11");
  await userEvent.keyboard("{ArrowDown}{ArrowDown}");
  await expect(month).toHaveAttribute("aria-valuenow", "1");
  await expect(canvas.getByRole("spinbutton", { name: "年" })).toHaveAttribute("aria-valuenow", "2027");
  await userEvent.keyboard("{ArrowUp}{ArrowUp}");
  await expect(month).toHaveAttribute("aria-valuenow", "11");
  await expect(canvas.getByRole("spinbutton", { name: "年" })).toHaveAttribute("aria-valuenow", "2026");
  await fireEvent.wheel(month, { deltaY: 100 });
  await waitFor(() => expect(month).toHaveAttribute("aria-valuenow", "12"));
  await fireEvent.wheel(month, { deltaY: 100 });
  await waitFor(() => expect(month).toHaveAttribute("aria-valuenow", "1"));
  await expect(canvas.getByRole("spinbutton", { name: "年" })).toHaveAttribute("aria-valuenow", "2027");
  await fireEvent.wheel(month, { deltaY: -100 });
  await waitFor(() => expect(month).toHaveAttribute("aria-valuenow", "12"));
  await expect(canvas.getByRole("spinbutton", { name: "年" })).toHaveAttribute("aria-valuenow", "2026");
  await fireEvent.wheel(month, { deltaY: -100 });
  await waitFor(() => expect(month).toHaveAttribute("aria-valuenow", "11"));
  const year = canvas.getByRole("spinbutton", { name: "年" });
  await userEvent.click(year);
  await fireEvent.compositionStart(year);
  await fireEvent.input(year, { target: { value: "２０２８" } });
  await expect(year).toHaveAttribute("aria-valuenow", "2026");
  await fireEvent.compositionEnd(year);
  await expect(year).toHaveValue("2028");
  await userEvent.keyboard("{Tab}");
  await expect(month).toHaveFocus();
  await expect(year).toHaveAttribute("aria-valuenow", "2028");
  await fireEvent.input(month, { target: { value: "１月２" } });
  await expect(month).toHaveValue("12");
  await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
  await expect(year).toHaveFocus();
  await expect(month).toHaveAttribute("aria-valuenow", "12");
  await waitFor(() => expect(year).toHaveProperty("selectionStart", 0));
  await waitFor(() => expect(year).toHaveProperty("selectionEnd", 4));
  await fireEvent.input(year, { target: { value: "" } });
  await userEvent.keyboard("{Tab}");
  await expect(year).toHaveAttribute("aria-valuenow", "2028");
  await fireEvent.input(month, { target: { value: "99" } });
  await userEvent.keyboard("{Enter}");
  await expect(month).toHaveAttribute("aria-valuenow", "12");
  await fireEvent.wheel(month, { deltaY: 100 });
  await waitFor(() => expect(month).toHaveAttribute("aria-valuenow", "1"));
  await expect(year).toHaveAttribute("aria-valuenow", "2029");
  await userEvent.click(canvas.getByRole("button", { name: "日付選択へ戻る" }));
  await waitFor(() => expect(canvas.getByRole("button", { name: "年月" })).toHaveTextContent("2029年 1月"));
  await expect(canvas.queryByRole("button", { name: "日付選択へ戻る" })).not.toBeInTheDocument();
}}>
  <Calendar class="w-[15.625rem] max-w-full rounded-md border" type="single" value={parseDate("2026-08-02")} captionLayout="dropdown" />
</Story>

<Story name="Disabled Dates" asChild>
  <Calendar
    class="w-[15.625rem] max-w-full rounded-md border"
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
  <Calendar class="w-[15.625rem] max-w-full rounded-md border" type="single" bind:value={selectedDate} />
  <p data-testid="today-value">{selectedDate?.toString()}</p>
</Story>
<Story name="Today Unavailable" asChild play={async ({ canvasElement }) => {
  await expect(within(canvasElement).getByRole("button", { name: "今日" })).toBeDisabled();
}}>
  <Calendar class="w-[15.625rem] max-w-full rounded-md border" type="single" isDateUnavailable={() => true} />
</Story>
