<script lang="ts">
import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
import { DateFormatter, getLocalTimeZone, type DateValue } from "@internationalized/date";
import Button from "../button/button.svelte";
import Calendar from "../calendar/calendar.svelte";
import Label from "../label/label.svelte";
import * as Popover from "../popover/index.js";
import TimePicker from "../time-picker/time-picker.svelte";
import { cn } from "../utils.js";

interface Props {
  startDateValue?: DateValue;
  endDateValue?: DateValue;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  minimumStartDateValue: DateValue;
  minimumEndDateValue: DateValue;
  minimumStartTime?: string;
  startLabel?: string;
  endLabel?: string;
  datePlaceholder?: string;
  locale?: string;
  minuteStep?: number;
  disabled?: boolean;
  errorMessage?: string | null;
  class?: string;
}

let {
  startDateValue = $bindable(),
  endDateValue = $bindable(),
  startDate = $bindable(),
  startTime = $bindable(),
  endDate = $bindable(),
  endTime = $bindable(),
  minimumStartDateValue,
  minimumEndDateValue,
  minimumStartTime,
  startLabel = "開始日時",
  endLabel = "終了日時",
  datePlaceholder = "日付を選択",
  locale = "ja-JP",
  minuteStep = 15,
  disabled = false,
  errorMessage = null,
  class: className,
}: Props = $props();

let startCalendarOpen = $state(false);
let endCalendarOpen = $state(false);
const dateFormatter = $derived(new DateFormatter(locale, { dateStyle: "long" }));
</script>

<div class={cn("grid gap-4 lg:grid-cols-2", className)}>
  <div class="grid gap-2 lg:max-w-md">
    <Label>{startLabel}</Label>
    <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-start">
      <div class="min-w-0">
        <Popover.Root bind:open={startCalendarOpen}>
          <Popover.Trigger>
            {#snippet child({ props })}
              <Button
                {...props}
                variant="outline"
                class={cn("w-full justify-between font-normal", !startDateValue && "text-muted-foreground")}
                {disabled}
              >
                {startDateValue ? dateFormatter.format(startDateValue.toDate(getLocalTimeZone())) : datePlaceholder}
                <ChevronDownIcon class="size-4 opacity-50" />
              </Button>
            {/snippet}
          </Popover.Trigger>
          <Popover.Content class="w-auto p-0" align="start">
            <Calendar
              type="single"
              bind:value={startDateValue}
              minValue={minimumStartDateValue}
              initialFocus
              captionLayout="dropdown"
              onValueChange={(value) => {
                if (value) startDate = value.toString();
                startCalendarOpen = false;
              }}
            />
          </Popover.Content>
        </Popover.Root>
      </div>
      <div class="min-w-0">
        <TimePicker bind:value={startTime} {minuteStep} minValue={minimumStartTime} {disabled} class="w-full" triggerClass="flex-1" />
      </div>
    </div>
  </div>
  <div class="grid gap-2 lg:max-w-md">
    <Label>{endLabel}</Label>
    <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-start">
      <div class="min-w-0">
        <Popover.Root bind:open={endCalendarOpen}>
          <Popover.Trigger>
            {#snippet child({ props })}
              <Button
                {...props}
                variant="outline"
                class={cn("w-full justify-between font-normal", !endDateValue && "text-muted-foreground")}
                {disabled}
              >
                {endDateValue ? dateFormatter.format(endDateValue.toDate(getLocalTimeZone())) : datePlaceholder}
                <ChevronDownIcon class="size-4 opacity-50" />
              </Button>
            {/snippet}
          </Popover.Trigger>
          <Popover.Content class="w-auto p-0" align="start">
            <Calendar
              type="single"
              bind:value={endDateValue}
              minValue={minimumEndDateValue}
              initialFocus
              captionLayout="dropdown"
              onValueChange={(value) => {
                if (value) endDate = value.toString();
                endCalendarOpen = false;
              }}
            />
          </Popover.Content>
        </Popover.Root>
      </div>
      <div class="min-w-0">
        <TimePicker bind:value={endTime} {minuteStep} {disabled} class="w-full" triggerClass="flex-1" />
      </div>
    </div>
  </div>
</div>
{#if errorMessage}
  <p class="text-sm text-destructive" role="alert">{errorMessage}</p>
{/if}
