<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";

export type LoadingTypingProps = WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & {
  count?: number;
  label?: string;
};

let {
  ref = $bindable(null),
  class: className,
  count = 3,
  label = "読み込み中",
  ...restProps
}: LoadingTypingProps = $props();

const safeCount = $derived(Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 3);
const itemIndexes = $derived(Array.from({ length: safeCount }, (_, index) => index));

function itemStyle(index: number): string {
  return `--loading-index: ${index}`;
}
</script>

<!-- Adapted from Loading UI (typing), MIT License. -->
<span
  bind:this={ref}
  {...restProps}
  role="status"
  aria-label={label}
  data-slot="loading-typing"
  class={cn("h-2 w-8", "inline-flex items-center gap-[12%]", className)}
>
  {#each itemIndexes as index (index)}
    <span
      aria-hidden="true"
      data-slot="loading-item"
      class={cn("loading-ui-item", "inline-block aspect-square grow rounded-full bg-current")}
      style={itemStyle(index)}
    ></span>
  {/each}
</span>

<style>
@keyframes loading-ui-typing {
          0%,
          100% {
            transform: translateY(0);
            opacity: 0.5;
          }

          50% {
            transform: translateY(-50%);
            opacity: 1;
          }
        }

  .loading-ui-item {
    animation: loading-ui-typing var(--duration, 1s) infinite;
    animation-delay: calc(var(--delay, 160ms) * var(--loading-index));
  }

  @media (prefers-reduced-motion: reduce) {
    .loading-ui-item {
      animation: none;
      opacity: 0.65;
    }
  }
</style>
