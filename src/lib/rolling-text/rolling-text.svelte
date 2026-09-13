<script module lang="ts">
import type { HTMLAttributes } from "svelte/elements";

export type RollingTextDirection = "up" | "down";
export type RollingTextAlign = "start" | "center" | "end";

export type RollingTextProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  value: string;
  widthValues?: readonly string[];
  align?: RollingTextAlign;
  direction?: RollingTextDirection;
  duration?: number;
  onPrevious?: (steps: number) => void;
  onNext?: (steps: number) => void;
  wheelThreshold?: number;
  wheelResetDelay?: number;
  wheelMode?: "gesture" | "continuous";
};
</script>

<script lang="ts">
import { onDestroy, untrack } from "svelte";
import { cn } from "../utils.js";
import { wheelNavigation } from "./wheel-navigation.js";

let {
  value,
  widthValues,
  align = "start",
  direction = "up",
  duration = 280,
  onPrevious,
  onNext,
  wheelThreshold = 4,
  wheelResetDelay = 160,
  wheelMode = "gesture",
  class: className,
  style,
  "aria-live": ariaLive = "off",
  ...restProps
}: RollingTextProps = $props();

let current = $state(untrack(() => value));
let previous = $state<string | null>(null);
let revision = $state(0);
let activeDirection = $state(untrack(() => direction));
let lastValue = untrack(() => value);
let cleanupTimer: ReturnType<typeof setTimeout> | undefined;
const sizingValues = $derived(widthValues?.length ? widthValues : [current]);

$effect(() => {
  const nextValue = value;
  const nextDuration = duration;

  untrack(() => {
    if (nextValue === lastValue) return;
    previous = lastValue;
    current = nextValue;
    lastValue = nextValue;
    revision += 1;
    if (cleanupTimer) clearTimeout(cleanupTimer);
    cleanupTimer = setTimeout(() => {
      previous = null;
    }, nextDuration);
  });
});

$effect(() => {
  activeDirection = direction;
});

function handlePrevious(steps: number) {
  activeDirection = "up";
  onPrevious?.(steps);
}

function handleNext(steps: number) {
  activeDirection = "down";
  onNext?.(steps);
}

onDestroy(() => {
  if (cleanupTimer) clearTimeout(cleanupTimer);
});
</script>

<span
  {...restProps}
  data-slot="rolling-text"
  data-direction={activeDirection}
  data-align={align}
  class={cn("rolling-text", className)}
  aria-live={ariaLive}
  aria-atomic="true"
  style={`--rolling-text-duration: ${duration}ms; ${style ?? ""}`}
  use:wheelNavigation={{ onPrevious: onPrevious ? handlePrevious : undefined, onNext: onNext ? handleNext : undefined, threshold: wheelThreshold, resetDelay: wheelResetDelay, mode: wheelMode }}
>
  <span class="rolling-text-size" aria-hidden="true">
    {#each sizingValues as sizingValue}
      <span>{sizingValue}</span>
    {/each}
  </span>
  <span class="rolling-text-visual" aria-hidden="true">
    {#if previous !== null}
      {#key `${revision}-out`}
        <span class="rolling-text-item rolling-text-item-out">{previous}</span>
      {/key}
    {/if}
    {#key `${revision}-in`}
      <span class="rolling-text-item" class:rolling-text-item-in={previous !== null}>{current}</span>
    {/key}
  </span>
  <span class="sr-only">{current}</span>
</span>

<style>
  .rolling-text { display: inline-grid; min-width: 0; overflow: hidden; vertical-align: bottom; }
  .rolling-text[data-align="start"] { text-align: start; }
  .rolling-text[data-align="center"] { text-align: center; }
  .rolling-text[data-align="end"] { text-align: end; }
  .rolling-text-size { display: grid; grid-area: 1 / 1; visibility: hidden; white-space: pre; }
  .rolling-text-size > span { grid-area: 1 / 1; }
  .rolling-text-visual { display: grid; grid-area: 1 / 1; min-width: 0; overflow: hidden; }
  .rolling-text-item { grid-area: 1 / 1; display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: pre; }
  .rolling-text-item-in { animation: rolling-text-in var(--rolling-text-duration) cubic-bezier(0.22, 1, 0.36, 1) both; }
  .rolling-text-item-out { animation: rolling-text-out var(--rolling-text-duration) cubic-bezier(0.22, 1, 0.36, 1) both; }
  [data-direction="down"] .rolling-text-item-in { animation-name: rolling-text-in-down; }
  [data-direction="down"] .rolling-text-item-out { animation-name: rolling-text-out-down; }

  @keyframes rolling-text-in { from { opacity: 0; transform: translateY(75%); } to { opacity: 1; transform: translateY(0); } }
  @keyframes rolling-text-out { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-75%); } }
  @keyframes rolling-text-in-down { from { opacity: 0; transform: translateY(-75%); } to { opacity: 1; transform: translateY(0); } }
  @keyframes rolling-text-out-down { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(75%); } }

  @media (prefers-reduced-motion: reduce) {
    .rolling-text-item { animation: none; }
    .rolling-text-item-out { display: none; }
  }
</style>
