<script lang="ts">
import * as Popover from "@mutsuna/ui/popover";
import Button from "@mutsuna/ui/button/button.svelte";
import { cn } from "../utils.js";
import { tick } from "svelte";

interface Props {
  value?: string;
  minuteStep?: number;
  minuteInputStep?: number;
  minValue?: string;
  disabled?: boolean;
  class?: string;
  triggerClass?: string;
}

let {
  value = $bindable("09:00"),
  minuteStep = 15,
  minuteInputStep = 5,
  minValue,
  disabled = false,
  class: className,
  triggerClass,
}: Props = $props();

let open = $state(false);
let draftValue = $state("09:00");
let hourListElement = $state<HTMLDivElement | undefined>();
let minuteListElement = $state<HTMLDivElement | undefined>();

const hourOptions = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
const minuteOptions = $derived.by(() => {
  const step = minuteStep > 0 && minuteStep <= 60 ? minuteStep : 15;
  const options: string[] = [];

  for (let minute = 0; minute < 60; minute += step) {
    options.push(String(minute).padStart(2, "0"));
  }

  return options;
});
const selectedHour = $derived(readTimeParts(value).hour);
const selectedMinute = $derived(readTimeParts(value).minute);

$effect(() => {
  if (open) {
    return;
  }

  const nextValue = normalizeTime(value, "09:00");
  if (draftValue !== nextValue) {
    draftValue = nextValue;
  }
});

$effect(() => {
  if (!open) {
    return;
  }

  selectedHour;
  selectedMinute;
  void tick().then(scrollSelectedOptionsIntoView);
});

function commitDraft(): void {
  const nextValue = clampToMinimum(normalizeTime(draftValue, value));
  value = nextValue;
  draftValue = nextValue;
}

function commitDraftOnEnter(event: KeyboardEvent): void {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  commitDraft();
  open = false;
}

function selectHour(hour: string): void {
  const nextValue = clampToMinimum(`${normalizeHour(hour, selectedHour)}:${selectedMinute}`);
  value = nextValue;
  draftValue = nextValue;
}

function selectMinute(minute: string): void {
  const nextValue = clampToMinimum(`${selectedHour}:${normalizeMinute(minute, selectedMinute)}`);
  value = nextValue;
  draftValue = nextValue;
  open = false;
}

function clampToMinimum(input: string): string {
  const minimum = minValue === undefined ? undefined : normalizeTime(minValue, "00:00");
  return minimum !== undefined && input < minimum ? minimum : input;
}

function isHourDisabled(hour: string): boolean {
  return minValue !== undefined && `${hour}:59` < normalizeTime(minValue, "00:00");
}

function isMinuteDisabled(minute: string): boolean {
  return minValue !== undefined && `${selectedHour}:${minute}` < normalizeTime(minValue, "00:00");
}

function scrollSelectedOptionsIntoView(): void {
  scrollElementIntoView(hourListElement?.querySelector(`[data-time-picker-hour-option="${selectedHour}"]`));
  scrollElementIntoView(minuteListElement?.querySelector(`[data-time-picker-minute-option="${selectedMinute}"]`));
}

function scrollElementIntoView(element: Element | null | undefined): void {
  if (element === undefined || element === null || typeof element.scrollIntoView !== "function") {
    return;
  }

  element.scrollIntoView({ block: "center", inline: "nearest" });
}

function readTimeParts(input: string): { hour: string; minute: string } {
  const [hour = "", minute = ""] = input.split(":");
  return {
    hour: normalizeHour(hour, "09"),
    minute: normalizeMinute(minute, "00"),
  };
}

function normalizeTime(input: string, fallback: string): string {
  const compact = input.trim();
  const fallbackParts = readTimeParts(fallback);
  const colonMatch = compact.match(/^(\d{1,2})(?::(\d{0,2}))?$/);
  if (colonMatch) {
    return `${normalizeHour(colonMatch[1] ?? "", fallbackParts.hour)}:${normalizeMinute(colonMatch[2] ?? "0", fallbackParts.minute)}`;
  }

  const numericMatch = compact.match(/^\d{3,4}$/);
  if (numericMatch) {
    const minute = compact.slice(-2);
    const hour = compact.slice(0, -2);
    return `${normalizeHour(hour, fallbackParts.hour)}:${normalizeMinute(minute, fallbackParts.minute)}`;
  }

  return `${fallbackParts.hour}:${fallbackParts.minute}`;
}

function normalizeHour(input: string, fallback: string): string {
  const parsed = Number.parseInt(input.trim(), 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return String(Math.min(Math.max(parsed, 0), 23)).padStart(2, "0");
}

function normalizeMinute(input: string, fallback: string): string {
  const parsed = Number.parseInt(input.trim(), 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  const step = minuteInputStep > 0 && minuteInputStep <= 60 ? minuteInputStep : 5;
  const rounded = Math.round(Math.min(Math.max(parsed, 0), 59) / step) * step;
  const normalized = Math.min(Math.max(rounded, 0), 60 - step);
  return String(normalized).padStart(2, "0");
}
</script>

<Popover.Root bind:open>
  <div class={cn("w-24", className)}>
    <Popover.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          aria-label="時間"
          disabled={disabled}
          variant="outline"
          size="sm"
          class={cn(
            "h-8 w-full justify-center px-2 text-sm font-medium tabular-nums",
            triggerClass
          )}
        >
          {value}
        </Button>
      {/snippet}
    </Popover.Trigger>
  </div>
  <Popover.Content class="w-56 gap-2 p-2" align="start" sideOffset={6}>
    <div class="grid gap-2">
      <input
        bind:value={draftValue}
        data-time-picker-input
        type="text"
        inputmode="numeric"
        autocomplete="off"
        aria-label="時間を入力"
        class="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-background px-2 text-center text-base font-semibold tabular-nums outline-none focus-visible:ring-3"
        onkeydown={commitDraftOnEnter}
        onblur={commitDraft}
      />

      <div class="sr-only" data-time-picker-selected-value>{selectedHour}:{selectedMinute}</div>

      <div class="grid grid-cols-2 gap-1.5">
        <div class="grid gap-1">
          <div
            bind:this={hourListElement}
            class="h-36 overflow-y-auto rounded-md border bg-background p-1"
            role="group"
            aria-label="時候補"
            data-time-picker-hour-list
          >
            {#each hourOptions as hour (hour)}
              <button
                type="button"
                disabled={isHourDisabled(hour)}
                data-time-picker-hour-option={hour}
                class={cn(
                  "h-8 w-full rounded-md text-sm font-medium tabular-nums hover:bg-accent hover:text-accent-foreground",
                  hour === selectedHour && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  isHourDisabled(hour) && "cursor-not-allowed opacity-40"
                )}
                aria-pressed={hour === selectedHour}
                aria-label={`${hour}時を選択`}
                onclick={() => selectHour(hour)}
              >
                {hour}
              </button>
            {/each}
          </div>
        </div>

        <div class="grid gap-1">
          <div
            bind:this={minuteListElement}
            class="h-36 overflow-y-auto rounded-md border bg-background p-1"
            role="group"
            aria-label="分候補"
            data-time-picker-minute-list
          >
            {#each minuteOptions as minute (minute)}
              <button
                type="button"
                disabled={isMinuteDisabled(minute)}
                data-time-picker-minute-option={minute}
                class={cn(
                  "h-8 w-full rounded-md text-sm font-medium tabular-nums hover:bg-accent hover:text-accent-foreground",
                  minute === selectedMinute && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  isMinuteDisabled(minute) && "cursor-not-allowed opacity-40"
                )}
                aria-pressed={minute === selectedMinute}
                aria-label={`${minute}分を選択`}
                onclick={() => selectMinute(minute)}
              >
                {minute}
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </Popover.Content>
</Popover.Root>
