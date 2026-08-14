<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";

export type LoadingBarsProps = WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & {
  count?: number;
  label?: string;
};

let {
  ref = $bindable(null),
  class: className,
  count = 3,
  label = "読み込み中",
  ...restProps
}: LoadingBarsProps = $props();

const safeCount = $derived(Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 3);
const itemIndexes = $derived(Array.from({ length: safeCount }, (_, index) => index));

function itemStyle(index: number): string {
  return `--loading-index: ${index}; width: ${100 / safeCount}%`;
}
</script>

<!-- Adapted from Loading UI (bars), MIT License. -->
<span
  bind:this={ref}
  {...restProps}
  role="status"
  aria-label={label}
  data-slot="loading-bars"
  class={cn("size-6", "inline-flex items-stretch gap-[5%]", className)}
>
  {#each itemIndexes as index (index)}
    <span
      aria-hidden="true"
      data-slot="loading-item"
      class={cn("loading-ui-item", "inline-block h-full rounded-[1px] bg-current")}
      style={itemStyle(index)}
    ></span>
  {/each}
</span>

<style>
@keyframes loading-ui-wave-bars {
          0%,
          100% {
            transform: scaleY(1);
            opacity: 0.5;
          }

          50% {
            transform: scaleY(0.6);
            opacity: 1;
          }
        }

  .loading-ui-item {
    animation: loading-ui-wave-bars var(--duration, 1.2s) ease-in-out infinite;
    animation-delay: calc(var(--delay, 0.2s) * var(--loading-index));
  }

  @media (prefers-reduced-motion: reduce) {
    .loading-ui-item {
      animation: none;
      opacity: 0.65;
    }
  }
</style>
