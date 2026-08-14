<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";

export type LoadingSatelliteRingProps = WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & {
  label?: string;
};

let {
  ref = $bindable(null),
  class: className,
  label = "読み込み中",
  ...restProps
}: LoadingSatelliteRingProps = $props();
</script>

<!-- Adapted from Loading UI (satellite-ring), MIT License. -->
<span
  bind:this={ref}
  {...restProps}
  role="status"
  aria-label={label}
  data-slot="loading-satellite-ring"
  class={cn("size-6", "relative inline-flex items-center justify-center", className)}
>
  <span aria-hidden="true" class="loading-ui-motion relative block size-full rounded-full border-2 border-current/25">
    <span class="absolute top-0 left-0 size-1/3 -translate-x-1/2 translate-y-1/2 rounded-full bg-current"></span>
  </span>
</span>

<style>
@keyframes loading-ui-satellite-ring-rotation {
          0% {
            transform: rotate(0deg);
          }

          100% {
            transform: rotate(360deg);
          }
        }

  .loading-ui-motion { animation: loading-ui-satellite-ring-rotation var(--duration, 1.5s) linear infinite; }


  @media (prefers-reduced-motion: reduce) {
    .loading-ui-motion,
    .loading-ui-wave-bar {
      animation: none;
      opacity: 0.65;
    }
  }
</style>
