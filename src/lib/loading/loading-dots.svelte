<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";

export type LoadingDotsProps = WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & {
  count?: number;
  label?: string;
};

let {
  ref = $bindable(null),
  class: className,
  count = 3,
  label = "読み込み中",
  ...restProps
}: LoadingDotsProps = $props();

const safeCount = $derived(Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 3);
const itemIndexes = $derived(Array.from({ length: safeCount }, (_, index) => index));

function itemStyle(index: number): string {
  return `--loading-index: ${index}`;
}
</script>

<!-- Adapted from Loading UI (dots), MIT License. -->
<span
  bind:this={ref}
  {...restProps}
  role="status"
  aria-label={label}
  data-slot="loading-dots"
  class={cn("h-2 w-8", "inline-flex items-center justify-center gap-[12%]", className)}
>
  {#each itemIndexes as index (index)}
    <span
      aria-hidden="true"
      data-slot="loading-item"
      class={cn("loading-ui-item", "aspect-square grow rounded-full bg-current")}
      style={itemStyle(index)}
    ></span>
  {/each}
</span>

<style>
@keyframes loading-ui-dots-blink {
          0%,
          100% {
            opacity: 0.2;
          }

          20% {
            opacity: 1;
          }
        }

  .loading-ui-item {
    animation: loading-ui-dots-blink var(--duration, 1.4s) infinite both;
    animation-delay: calc(var(--delay, 0.2s) * var(--loading-index));
  }

  @media (prefers-reduced-motion: reduce) {
    .loading-ui-item {
      animation: none;
      opacity: 0.65;
    }
  }
</style>
