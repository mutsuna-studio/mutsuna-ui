<script lang="ts">
import Button from "../button/button.svelte";
import { type RollingTextDirection } from "../rolling-text/rolling-text.svelte";
import NumericRollerInput from "../rolling-text/numeric-roller-input.svelte";
import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";

let { label, value, options, disabled = false, onStep, canPrevious, canNext, onValueChange, ref = $bindable(null), onTab, onEnter, onYearMonthInput }: {
  ref?: HTMLInputElement | null;
  onTab?: () => void;
  onYearMonthInput?: (digits: string) => void;
  onEnter?: () => void;
  label: string;
  value: number;
  options: { value: number; label: string }[];
  disabled?: boolean;
  onStep?: (offset: number) => void;
  canPrevious?: boolean;
  canNext?: boolean;
  onValueChange: (value: number) => void;
} = $props();
let direction = $state<RollingTextDirection>("up");
const index = $derived(options.findIndex((option) => option.value === value));
const inactive = $derived(disabled || options.length === 0);
const selectedLabel = $derived(options[index]?.label ?? String(value));

function move(offset: number) {
  if (inactive) return;
  if (onStep) {
    direction = offset > 0 ? "down" : "up";
    onStep(offset);
    return;
  }
  const nextIndex = index < 0
    ? (offset > 0 ? options.findIndex((option) => option.value > value) : options.reduce((found, option, i) => option.value < value ? i : found, -1))
    : Math.max(0, Math.min(options.length - 1, index + offset));
  if (nextIndex < 0) return;
  direction = offset > 0 ? "down" : "up";
  onValueChange(options[nextIndex].value);
}
function normalize(draft: string): string {
  if (!draft || !options.length || (onYearMonthInput && draft.length > 4)) return String(value);
  const requested = Number(draft);
  return String(options.reduce((nearest, option) => Math.abs(option.value - requested) < Math.abs(nearest.value - requested) ? option : nearest).value);
}
</script>

<div class="grid min-w-0 justify-items-center gap-1">
  <Button type="button" variant="ghost" size="icon-sm" aria-label={`${label}を1つ戻す`} disabled={inactive || !(canPrevious ?? value > (options[0]?.value ?? value))} onclick={() => move(-1)}><ChevronUpIcon /></Button>
  <NumericRollerInput bind:ref value={String(value)} {label} displayValue={selectedLabel} widthValues={options.map((option) => option.label)} {direction}
    digits={onYearMonthInput ? 6 : Math.max(2, ...options.map((option) => String(option.value).length))}
    onTextCommit={onYearMonthInput ? (text) => { if (/^\d{0,4}$/.test(text)) return false; onYearMonthInput?.(text); return true; } : undefined} min={options[0]?.value} max={options.at(-1)?.value} disabled={inactive} class="w-full text-lg"
    {normalize} onCommit={(next) => onValueChange(Number(next))} onStep={move} {onTab} {onEnter}
    onBoundary={(end) => { if (options.length) onValueChange(options[end ? options.length - 1 : 0].value); }} />
  <Button type="button" variant="ghost" size="icon-sm" aria-label={`${label}を1つ進める`} disabled={inactive || !(canNext ?? value < (options.at(-1)?.value ?? value))} onclick={() => move(1)}><ChevronDownIcon /></Button>
</div>
