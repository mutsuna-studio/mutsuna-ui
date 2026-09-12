<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { parseDate } from "@internationalized/date";
import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
import CalendarClockIcon from "@lucide/svelte/icons/calendar-clock";
import { Button } from "@mutsuna/ui/button";
import { ButtonGroup } from "@mutsuna/ui/button-group";
import { DatePicker } from "@mutsuna/ui/date-picker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@mutsuna/ui/tooltip";
const { Story } = defineMeta({ title: "Components/Inputs/DatePicker", component: DatePicker, tags: ["autodocs"] });

const stepDateMin = "2026-01-01";
const stepDateMax = "2027-12-31";
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
const currentMonth = today.slice(0, 7);

async function checkDefault(canvasElement: HTMLElement) {
  if (import.meta.env.MODE !== "test") return;
  const canvas = within(canvasElement);
  const body = within(canvasElement.ownerDocument.body);
  const trigger = canvas.getByRole("button", { name: "対象年月: 2026年9月" });
  await userEvent.click(trigger);
  await userEvent.click(await body.findByRole("button", { name: "2027年" }));
  await expect(canvasElement.querySelector('input[name="month"]')).toHaveValue("2026-09");
  await expect(body.getByRole("button", { name: "6月" })).toBeDisabled();
  const may = body.getByRole("button", { name: "5月" });
  may.focus();
  await userEvent.keyboard("{Enter}");
  await expect(trigger).toHaveTextContent("2027年5月");
  await expect(canvasElement.querySelector('input[name="month"]')).toHaveValue("2027-05");
  await waitFor(() => expect(trigger).toHaveFocus());
  await userEvent.click(trigger);
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(trigger).toHaveFocus());

}

async function checkDirectInput(canvasElement: HTMLElement) {
  if (import.meta.env.MODE !== "test") return;
  const canvas = within(canvasElement);
  const body = within(canvasElement.ownerDocument.body);
  const trigger = canvas.getByRole("button", { name: "直接入力: 2026年9月" });
  await userEvent.click(trigger);
  const input = await body.findByRole("textbox", { name: "年月を直接入力" });
  await userEvent.clear(input);
  await userEvent.type(input, "abc１２３-/");
  await expect(input).toHaveValue("");
  await expect(body.queryByRole("button", { name: "確定" })).not.toBeInTheDocument();
  await userEvent.type(input, "202613");
  await expect(await body.findByRole("alert")).toHaveTextContent("形式");
  await expect(canvasElement.querySelector('input[name="direct"]')).toHaveValue("2026-09");
  await userEvent.clear(input);
  await userEvent.type(input, "202801{Enter}");
  await expect(body.getByRole("alert")).toHaveTextContent("範囲");
  await userEvent.clear(input);
  await userEvent.type(input, "202703");
  await userEvent.click(body.getByRole("button", { name: "2026年" }));
  await expect(input).toHaveValue("202603");
  await userEvent.clear(input);
  await userEvent.type(input, "202703{Enter}");
  await expect(trigger).toHaveTextContent("2027年3月");
  await expect(canvasElement.querySelector('input[name="direct"]')).toHaveValue("2027-03");
  await waitFor(() => expect(trigger).toHaveFocus());

}

async function checkCurrentMonth(canvasElement: HTMLElement) {
  if (import.meta.env.MODE !== "test") return;
  const canvas = within(canvasElement);
  const body = within(canvasElement.ownerDocument.body);
  await userEvent.click(canvas.getByRole("button"));
  await userEvent.click(await body.findByRole("button", { name: "今月" }));
  const now = new Date();
  await expect(canvasElement.querySelector('input[name="current"]')).toHaveValue(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  await waitFor(() => expect(canvas.getByRole("button")).toHaveFocus());

}

async function checkCurrentMonthOutOfRange(canvasElement: HTMLElement) {
  if (import.meta.env.MODE !== "test") return;
  await userEvent.click(within(canvasElement).getByRole("button"));
  const body = within(canvasElement.ownerDocument.body);
  await expect(await body.findByRole("button", { name: "今月" })).toBeDisabled();
  await userEvent.keyboard("{Escape}");

}

async function checkYear(canvasElement: HTMLElement) {
  if (import.meta.env.MODE !== "test") return;
  const canvas = within(canvasElement); const body = within(canvasElement.ownerDocument.body);
  await userEvent.click(canvas.getByRole("button"));
  await userEvent.click(await body.findByRole("button", { name: "2027年" }));
  await expect(canvasElement.querySelector('input[name="year"]')).toHaveValue("2027");
  await waitFor(() => expect(canvas.getByRole("button")).toHaveFocus());

}

async function checkDay(canvasElement: HTMLElement) {
  if (import.meta.env.MODE !== "test") return;
  const canvas = within(canvasElement); const body = within(canvasElement.ownerDocument.body);
  await userEvent.click(canvas.getByRole("button"));
  const input = await body.findByRole("textbox", { name: "日付を直接入力" });
  await userEvent.clear(input); await userEvent.type(input, "20260229{Enter}");
  await expect(body.getByRole("alert")).toHaveTextContent("8桁");
  await expect(canvasElement.querySelector('input[name="date"]')).toHaveValue("2026-09-09");
  await userEvent.clear(input); await userEvent.type(input, "20280229{Enter}");
  await expect(canvasElement.querySelector('input[name="date"]')).toHaveValue("2028-02-29");
  await waitFor(() => expect(canvas.getByRole("button")).toHaveFocus());

}

async function checkWeekday(canvasElement: HTMLElement) {
  if (import.meta.env.MODE !== "test") return;
  const canvas = within(canvasElement);
  await expect(canvas.getByRole("button", { name: "曜日付き: 2026年9月9日(水)" })).toBeInTheDocument();
  await expect(canvas.getByRole("button", { name: "年月: 2026年9月" })).toBeInTheDocument();
  await expect(canvasElement.querySelector('input[name="weekday"]')).toHaveValue("2026-09-09");

}
</script>

<script lang="ts">
let stepDate = $state("2026-12-31");
let toolbarDate = $state("2026-12-31");
let stepMonth = $state("2026-12");
let toolbarMonth = $state("2026-12");

function moveDay(offset: number): void {
  const next = parseDate(stepDate).add({ days: offset }).toString();
  if (next >= stepDateMin && next <= stepDateMax) stepDate = next;
}

function moveToolbarDay(offset: number): void {
  toolbarDate = parseDate(toolbarDate).add({ days: offset }).toString();
}

function moveMonth(value: string, offset: number): string {
  return parseDate(`${value}-01`).add({ months: offset }).toString().slice(0, 7);
}
</script>

{#snippet dayStepControl()}
  <section class="grid w-full max-w-md gap-3 p-2">
    <div class="space-y-1">
      <h2 class="text-sm font-medium">前日・翌日へ移動</h2>
      <p class="text-xs text-muted-foreground">日付選択と連続した日付移動を一つの操作群にまとめます。</p>
    </div>
    <div class="grid gap-6">
      <div class="grid gap-2" data-testid="split-navigation">
        <h3 class="text-xs text-muted-foreground">前後ボタンを両側に配置</h3>
        <ButtonGroup aria-label="表示日を変更">
          <Button type="button" variant="outline" size="icon" icon={ChevronLeftIcon} aria-label="前日へ" disabled={stepDate <= stepDateMin} onclick={() => moveDay(-1)} />
          <DatePicker bind:value={stepDate} ariaLabel="表示日" name="step-date" min={stepDateMin} max={stepDateMax} showWeekday showIcon={false} class="w-[10.5rem]" />
          <Button type="button" variant="outline" size="icon" icon={ChevronRightIcon} aria-label="翌日へ" disabled={stepDate >= stepDateMax} onclick={() => moveDay(1)} />
        </ButtonGroup>
      </div>

      <div class="grid gap-2" data-testid="toolbar-navigation">
        <h3 class="text-xs text-muted-foreground">今日を左、前後ボタンを右に配置</h3>
        <TooltipProvider>
          <ButtonGroup aria-label="表示日を変更">
            <Tooltip>
              <TooltipTrigger>
                {#snippet child({ props })}
                  <Button {...props} type="button" variant="outline" size="icon" icon={CalendarClockIcon} aria-label="今日へ移動" disabled={toolbarDate === today} onclick={() => (toolbarDate = today)} />
                {/snippet}
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>今日へ移動</TooltipContent>
            </Tooltip>
            <DatePicker bind:value={toolbarDate} ariaLabel="表示日" name="toolbar-date" showCurrent={false} showWeekday showIcon={false} class="w-[10.5rem]" />
            <Button type="button" variant="outline" size="icon" icon={ChevronLeftIcon} aria-label="前日へ" onclick={() => moveToolbarDay(-1)} />
            <Button type="button" variant="outline" size="icon" icon={ChevronRightIcon} aria-label="翌日へ" onclick={() => moveToolbarDay(1)} />
          </ButtonGroup>
        </TooltipProvider>
      </div>
    </div>
  </section>
{/snippet}

<Story name="Day With Previous And Next" asChild>
  <div class="grid gap-8">
    {@render dayStepControl()}
    {@render monthStepControl()}
  </div>
</Story>

<Story name="Day With Previous And Next Interaction Test" tags={["!dev", "!autodocs"]} asChild play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const split = within(canvas.getByTestId("split-navigation"));
  const toolbar = within(canvas.getByTestId("toolbar-navigation"));
  const splitValue = () => canvasElement.querySelector('input[name="step-date"]');
  const toolbarValue = () => canvasElement.querySelector('input[name="toolbar-date"]');
  await expect(splitValue()).toHaveValue("2026-12-31");
  await userEvent.click(split.getByRole("button", { name: "翌日へ" }));
  await expect(splitValue()).toHaveValue("2027-01-01");
  await userEvent.click(split.getByRole("button", { name: "前日へ" }));
  await expect(splitValue()).toHaveValue("2026-12-31");
  await userEvent.click(toolbar.getByRole("button", { name: "翌日へ" }));
  await expect(toolbarValue()).toHaveValue("2027-01-01");
  await userEvent.click(toolbar.getByRole("button", { name: "今日へ移動" }));
  await expect(toolbarValue()).toHaveValue(today);
}}>
  {@render dayStepControl()}
</Story>

{#snippet monthStepControl()}
  <section class="grid w-full max-w-md gap-3 p-2">
    <div class="space-y-1">
      <h2 class="text-sm font-medium">前月・翌月へ移動</h2>
      <p class="text-xs text-muted-foreground">年月選択と連続した月移動を一つの操作群にまとめます。</p>
    </div>
    <div class="grid gap-6">
      <div class="grid gap-2" data-testid="split-month-navigation">
        <h3 class="text-xs text-muted-foreground">前後ボタンを両側に配置</h3>
        <ButtonGroup aria-label="表示月を変更">
          <Button type="button" variant="outline" size="icon" icon={ChevronLeftIcon} aria-label="前月へ" onclick={() => (stepMonth = moveMonth(stepMonth, -1))} />
          <DatePicker bind:value={stepMonth} precision="month" ariaLabel="表示月" name="step-month" showIcon={false} class="w-28" />
          <Button type="button" variant="outline" size="icon" icon={ChevronRightIcon} aria-label="翌月へ" onclick={() => (stepMonth = moveMonth(stepMonth, 1))} />
        </ButtonGroup>
      </div>

      <div class="grid gap-2" data-testid="toolbar-month-navigation">
        <h3 class="text-xs text-muted-foreground">今月を左、前後ボタンを右に配置</h3>
        <TooltipProvider>
          <ButtonGroup aria-label="表示月を変更">
            <Tooltip>
              <TooltipTrigger>
                {#snippet child({ props })}
                  <Button {...props} type="button" variant="outline" size="icon" icon={CalendarClockIcon} aria-label="今月へ移動" disabled={toolbarMonth === currentMonth} onclick={() => (toolbarMonth = currentMonth)} />
                {/snippet}
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>今月へ移動</TooltipContent>
            </Tooltip>
            <DatePicker bind:value={toolbarMonth} precision="month" ariaLabel="表示月" name="toolbar-month" showCurrent={false} showIcon={false} class="w-28" />
            <Button type="button" variant="outline" size="icon" icon={ChevronLeftIcon} aria-label="前月へ" onclick={() => (toolbarMonth = moveMonth(toolbarMonth, -1))} />
            <Button type="button" variant="outline" size="icon" icon={ChevronRightIcon} aria-label="翌月へ" onclick={() => (toolbarMonth = moveMonth(toolbarMonth, 1))} />
          </ButtonGroup>
        </TooltipProvider>
      </div>
    </div>
  </section>
{/snippet}

<Story name="Month With Previous And Next Interaction Test" tags={["!dev", "!autodocs"]} asChild play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const split = within(canvas.getByTestId("split-month-navigation"));
  const toolbar = within(canvas.getByTestId("toolbar-month-navigation"));
  const splitValue = () => canvasElement.querySelector('input[name="step-month"]');
  const toolbarValue = () => canvasElement.querySelector('input[name="toolbar-month"]');
  await expect(splitValue()).toHaveValue("2026-12");
  await userEvent.click(split.getByRole("button", { name: "翌月へ" }));
  await expect(splitValue()).toHaveValue("2027-01");
  await userEvent.click(split.getByRole("button", { name: "前月へ" }));
  await expect(splitValue()).toHaveValue("2026-12");
  await userEvent.click(toolbar.getByRole("button", { name: "翌月へ" }));
  await expect(toolbarValue()).toHaveValue("2027-01");
  await userEvent.click(toolbar.getByRole("button", { name: "今月へ移動" }));
  await expect(toolbarValue()).toHaveValue(currentMonth);
}}>
  {@render monthStepControl()}
</Story>

<Story name="Default" asChild play={async ({ canvasElement }) => {
  if (import.meta.env.MODE !== "test") return;
  await checkYear(within(canvasElement).getByTestId("year"));
  await checkDefault(within(canvasElement).getByTestId("default"));
  await checkDay(within(canvasElement).getByTestId("day"));
  await checkWeekday(within(canvasElement).getByTestId("weekday"));
}}>
  <section class="grid w-full max-w-3xl gap-6 p-2">
    <div class="space-y-1"><h2 class="text-sm font-medium">基本の使い方</h2><p class="text-xs text-muted-foreground">年・年月・日付と曜日表示を比較できます。</p></div>
    <div class="grid gap-6 sm:grid-cols-2">
      <div data-testid="year" class="grid min-w-0 content-start gap-3">
        <h3 class="text-xs text-muted-foreground">年のみ</h3>
<DatePicker precision="year" ariaLabel="対象年" value="2026" min="2020" max="2030" name="year" />
      </div>
      <div data-testid="default" class="grid min-w-0 content-start gap-3">
        <h3 class="text-xs text-muted-foreground">年月</h3>
<DatePicker precision="month" ariaLabel="対象年月" name="month" value="2026-09" min="2026-09" max="2027-05" class="w-56" />
      </div>
      <div data-testid="day" class="grid min-w-0 content-start gap-3">
        <h3 class="text-xs text-muted-foreground">日付</h3>
<DatePicker ariaLabel="対象日" value="2026-09-09" name="date" />
      </div>
      <div data-testid="weekday" class="grid min-w-0 content-start gap-3">
        <h3 class="text-xs text-muted-foreground">曜日表示</h3>
<div class="grid w-64 gap-4">
    <DatePicker ariaLabel="曜日付き" showWeekday value="2026-09-09" name="weekday" />
    <DatePicker ariaLabel="曜日なし" value="2026-09-09" />
    <DatePicker precision="month" ariaLabel="年月" showWeekday value="2026-09" />
  </div>
      </div>
    </div>
  </section>
</Story>

<Story name="States" asChild play={async ({ canvasElement }) => {
  if (import.meta.env.MODE !== "test") return;
  await checkCurrentMonthOutOfRange(within(canvasElement).getByTestId("current-month-out-of-range"));
}}>
  <section class="grid w-full max-w-3xl gap-6 p-2">
    <div class="space-y-1"><h2 class="text-sm font-medium">状態と制約</h2><p class="text-xs text-muted-foreground">未選択・小サイズ・無効・エラー・選択範囲をまとめています。</p></div>
    <div class="grid gap-6 sm:grid-cols-2">
      <div data-testid="states" class="grid min-w-0 content-start gap-3">
        <h3 class="text-xs text-muted-foreground">表示状態</h3>
<div class="grid max-w-xs gap-4">
    <DatePicker precision="month" ariaLabel="未選択" />
    <DatePicker precision="month" ariaLabel="選択済み" value="2026-09" />
    <DatePicker precision="month" ariaLabel="小サイズ" size="sm" value="2026-09" />
    <DatePicker precision="month" ariaLabel="無効" disabled value="2026-09" />
    <DatePicker precision="month" ariaLabel="エラー" aria-invalid={true} aria-describedby="month-error" />
    <p id="month-error" class="text-sm text-destructive">年月を選択してください。</p>
    <DatePicker precision="month" ariaLabel="一つの月のみ" min="2026-09" max="2026-09" class="w-40" />
  </div>
      </div>
      <div data-testid="current-month-out-of-range" class="grid min-w-0 content-start gap-3">
        <h3 class="text-xs text-muted-foreground">選択範囲外のショートカット</h3>
<DatePicker precision="month" ariaLabel="過去の年月" min="2000-01" max="2000-12" />
      </div>
    </div>
  </section>
</Story>

<Story name="Direct Input" asChild play={async ({ canvasElement }) => {
  if (import.meta.env.MODE !== "test") return;
  await checkDirectInput(within(canvasElement).getByTestId("direct-input"));
  await checkCurrentMonth(within(canvasElement).getByTestId("current-month"));
}}>
  <section class="grid w-full max-w-3xl gap-6 p-2">
    <div class="space-y-1"><h2 class="text-sm font-medium">直接入力とショートカット</h2><p class="text-xs text-muted-foreground">半角数字で入力しEnterで確定します。今月もワンクリックで選択できます。</p></div>
    <div class="grid gap-6 sm:grid-cols-2">
      <div data-testid="direct-input" class="grid min-w-0 content-start gap-3">
        <h3 class="text-xs text-muted-foreground">直接入力</h3>
<DatePicker precision="month" ariaLabel="直接入力" value="2026-09" name="direct" min="2026-01" max="2027-12" />
      </div>
      <div data-testid="current-month" class="grid min-w-0 content-start gap-3">
        <h3 class="text-xs text-muted-foreground">今月を選ぶ</h3>
<DatePicker precision="month" ariaLabel="対象年月" name="current" />
      </div>
    </div>
  </section>
</Story>
