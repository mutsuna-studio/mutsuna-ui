<script lang="ts">
import { tick } from "svelte";
import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
import * as Popover from "@mutsuna/ui/popover";
import Button from "@mutsuna/ui/button/button.svelte";
import RollingText, { type RollingTextDirection } from "../rolling-text/rolling-text.svelte";
import { wheelNavigation } from "../rolling-text/wheel-navigation.js";
import NumericRollerInput from "../rolling-text/numeric-roller-input.svelte";
import { parseDateTimeInput, type ExcelDateSystem } from "../date-time-input/index.js";
import { cn } from "../utils.js";

interface Props {
  excelDateSystem?: ExcelDateSystem;
  value?: string;
  minuteStep?: number;
  minuteInputStep?: number;
  minValue?: string;
  disabled?: boolean;
  class?: string;
  triggerClass?: string;
}

let { excelDateSystem = "1900", value = $bindable("09:00"), minuteStep = 15, minuteInputStep = 5, minValue, disabled = false, class: className, triggerClass }: Props = $props();

let open = $state(false);
let hourDirection = $state<RollingTextDirection>("up");
let minuteDirection = $state<RollingTextDirection>("up");
let hourInput = $state<HTMLInputElement | null>(null);
let minuteInput = $state<HTMLInputElement | null>(null);

const hourOptions = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
const minuteOptions = $derived.by(() => {
  const step = validMinuteStep();
  return Array.from({ length: Math.ceil(60 / step) }, (_, index) => String(index * step).padStart(2, "0"));
});
const selectedHour = $derived(readTimeParts(value).hour);
const selectedMinute = $derived(readTimeParts(value).minute);

function commitFullTime(text: string): boolean {
  if (/^\d{0,2}$/.test(text)) return false;
  const parsed = parseDateTimeInput(text, "time", { excelDateSystem });
  if (parsed) {
    const [hour, minute] = parsed.split(":");
    commitTime(`${hour}:${normalizeMinute(minute, selectedMinute)}`);
  }
  return true;
}
function commitTime(input: string): void {
  const nextValue = clampToMinimum(input);
  value = nextValue;
}

function changeHour(offset: number, direction: RollingTextDirection): void {
  if (disabled || offset === 0) return;
  hourDirection = direction;
  const next = modulo(Number(selectedHour) + offset, hourOptions.length);
  commitTime(`${hourOptions[next]}:${selectedMinute}`);
}

function changeMinute(offset: number, direction: RollingTextDirection): void {
  if (disabled || offset === 0) return;
  minuteDirection = direction;
  const step = validMinuteStep();
  const currentIndex = Math.round(Number(selectedMinute) / step) % minuteOptions.length;
  const next = modulo(currentIndex + offset, minuteOptions.length);
  commitTime(`${selectedHour}:${minuteOptions[next]}`);
}

function changeTime(offset: number, direction: RollingTextDirection): void {
  if (disabled || offset === 0) return;
  hourDirection = direction;
  minuteDirection = direction;
  const currentMinutes = Number(selectedHour) * 60 + Number(selectedMinute);
  const nextMinutes = modulo(currentMinutes + offset * validMinuteStep(), 24 * 60);
  const nextHour = String(Math.floor(nextMinutes / 60)).padStart(2, "0");
  const nextMinute = String(nextMinutes % 60).padStart(2, "0");
  commitTime(`${nextHour}:${nextMinute}`);
}

function validMinuteStep(): number {
  return minuteStep > 0 && minuteStep <= 60 ? minuteStep : 15;
}

function clampToMinimum(input: string): string {
  const minimum = minValue === undefined ? undefined : normalizeTime(minValue, "00:00");
  return minimum !== undefined && input < minimum ? minimum : input;
}

function readTimeParts(input: string): { hour: string; minute: string } {
  const [hour = "", minute = ""] = input.split(":");
  return { hour: normalizeHour(hour, "09"), minute: normalizeMinute(minute, "00") };
}

function normalizeTime(input: string, fallback: string): string {
  const compact = input.trim();
  const fallbackParts = readTimeParts(fallback);
  const colonMatch = compact.match(/^(\d{1,2})(?::(\d{0,2}))?$/);
  if (colonMatch) return `${normalizeHour(colonMatch[1] ?? "", fallbackParts.hour)}:${normalizeMinute(colonMatch[2] ?? "0", fallbackParts.minute)}`;
  if (/^\d{3,4}$/.test(compact)) return `${normalizeHour(compact.slice(0, -2), fallbackParts.hour)}:${normalizeMinute(compact.slice(-2), fallbackParts.minute)}`;
  return `${fallbackParts.hour}:${fallbackParts.minute}`;
}

function normalizeHour(input: string, fallback: string): string {
  const parsed = Number.parseInt(input.trim(), 10);
  return Number.isNaN(parsed) ? fallback : String(Math.min(Math.max(parsed, 0), 23)).padStart(2, "0");
}

function normalizeMinute(input: string, fallback: string): string {
  const parsed = Number.parseInt(input.trim(), 10);
  if (Number.isNaN(parsed)) return fallback;
  const step = minuteInputStep > 0 && minuteInputStep <= 60 ? minuteInputStep : 5;
  const rounded = Math.round(Math.min(Math.max(parsed, 0), 59) / step) * step;
  return String(Math.min(Math.max(rounded, 0), 60 - step)).padStart(2, "0");
}

function modulo(input: number, length: number): number {
  return ((input % length) + length) % length;
}
</script>

<Popover.Root bind:open>
  <div
    class={cn("w-28", className)}
    use:wheelNavigation={{ mode: "continuous", threshold: 24, disabled, onPrevious: (steps) => changeTime(-steps, "up"), onNext: (steps) => changeTime(steps, "down") }}
  >
    <Popover.Trigger>
      {#snippet child({ props })}
        <Button {...props} aria-label="時間" {disabled} variant="outline" size="sm" class={cn("border-input h-10 w-full justify-center bg-transparent px-3 text-base font-semibold tabular-nums hover:bg-transparent focus-visible:border-ring focus-visible:bg-ring/[0.04] focus-visible:ring-0 aria-expanded:border-ring aria-expanded:bg-ring/[0.04] dark:hover:bg-input/30 dark:aria-expanded:bg-ring/[0.04]", triggerClass)}>
          <span class="time-trigger-value" aria-hidden="true">
            <RollingText value={selectedHour} widthValues={hourOptions} direction={hourDirection} duration={180} align="center" />
            <span>:</span>
            <RollingText value={selectedMinute} widthValues={minuteOptions} direction={minuteDirection} duration={180} align="center" />
          </span>
        </Button>
      {/snippet}
    </Popover.Trigger>
  </div>
  <Popover.Content onOpenAutoFocus={(event) => { event.preventDefault(); void tick().then(() => hourInput?.focus()); }} class="w-auto p-2" align="start" sideOffset={6}>
    <div class="time-rollers" aria-label="時刻を選択">
      <div class="time-roller-column">
        <Button variant="ghost" size="icon-sm" aria-label="時を1つ戻す" onclick={() => changeHour(-1, "up")}><ChevronUpIcon /></Button>
        <NumericRollerInput bind:ref={hourInput} value={selectedHour} label="時" widthValues={hourOptions} direction={hourDirection} min={0} max={23} {disabled} class="w-[3.75rem] text-2xl"
          onTextCommit={commitFullTime} normalize={(draft) => normalizeHour(draft, selectedHour)} onCommit={(next) => commitTime(`${next}:${selectedMinute}`)}
          onStep={(offset) => changeHour(offset, offset > 0 ? "down" : "up")} onTab={() => minuteInput?.focus()} onEnter={() => minuteInput?.focus()} advanceKeys={[":"]} />
        <Button variant="ghost" size="icon-sm" aria-label="時を1つ進める" onclick={() => changeHour(1, "down")}><ChevronDownIcon /></Button>
      </div>
      <span class="time-separator" aria-hidden="true">:</span>
      <div class="time-roller-column">
        <Button variant="ghost" size="icon-sm" aria-label="分を1目盛り戻す" onclick={() => changeMinute(-1, "up")}><ChevronUpIcon /></Button>
        <NumericRollerInput bind:ref={minuteInput} value={selectedMinute} label="分" widthValues={minuteOptions} direction={minuteDirection} min={0} max={59} {disabled} class="w-[3.75rem] text-2xl"
          normalize={(draft) => normalizeMinute(draft, selectedMinute)} onCommit={(next) => commitTime(`${selectedHour}:${next}`)}
          onStep={(offset) => changeMinute(offset, offset > 0 ? "down" : "up")} onTab={() => hourInput?.focus()} />
        <Button variant="ghost" size="icon-sm" aria-label="分を1目盛り進める" onclick={() => changeMinute(1, "down")}><ChevronDownIcon /></Button>
      </div>
    </div>
    <div class="sr-only" data-time-picker-selected-value>{selectedHour}:{selectedMinute}</div>
  </Popover.Content>
</Popover.Root>

<style>
  .time-trigger-value { display: inline-grid; grid-template-columns: 2ch auto 2ch; align-items: center; gap: 0.125rem; }
  .time-rollers { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 0.25rem; }
  .time-roller-column { display: grid; justify-items: center; gap: 0.125rem; }
  .time-separator { align-self: center; font-size: 1.25rem; font-weight: 600; line-height: 1; }
</style>
