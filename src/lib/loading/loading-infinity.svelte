<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";

export type LoadingInfinityProps = WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & {
  label?: string;
};

let {
  ref = $bindable(null),
  class: className,
  label = "読み込み中",
  ...restProps
}: LoadingInfinityProps = $props();
</script>

<!-- Adapted from Loading UI (infinity), MIT License. -->
<span
  bind:this={ref}
  {...restProps}
  role="status"
  aria-label={label}
  data-slot="loading-infinity"
  class={cn("size-6", "relative inline-flex items-center justify-center", className)}
>
  <svg aria-hidden="true" viewBox="0 0 100 100" fill="none" class="size-full">
    <path class="loading-ui-motion" d="M24.3 30C11.4 30 5 43.3 5 50s6.4 20 19.3 20c19.3 0 32.1-40 51.4-40C88.6 30 95 43.3 95 50s-6.4 20-19.3 20C56.4 70 43.6 30 24.3 30z" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-dasharray="205.271142578125 51.317785644531256"></path>
  </svg>
</span>

<style>
@keyframes loading-ui-infinity-dash {
          to {
            stroke-dashoffset: 256.58892822265625;
          }
        }

  .loading-ui-motion { animation: loading-ui-infinity-dash var(--duration, 2s) linear infinite; transform: scale(0.8); transform-origin: 50px 50px; }


  @media (prefers-reduced-motion: reduce) {
    .loading-ui-motion,
    .loading-ui-wave-bar {
      animation: none;
      opacity: 0.65;
    }
  }
</style>
