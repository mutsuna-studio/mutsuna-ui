<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";

export type LoadingOrbitRingProps = WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & {
  label?: string;
};

let {
  ref = $bindable(null),
  class: className,
  label = "読み込み中",
  ...restProps
}: LoadingOrbitRingProps = $props();
</script>

<!-- Adapted from Loading UI (orbit-ring), MIT License. -->
<span
  bind:this={ref}
  {...restProps}
  role="status"
  aria-label={label}
  data-slot="loading-orbit-ring"
  class={cn("size-6", "relative inline-flex items-center justify-center", className)}
>
  <span aria-hidden="true" class="loading-ui-motion relative block size-full">
    <span class="absolute inset-0 rounded-full border-2 border-current opacity-25"></span>
    <span class="absolute top-1/2 left-1/2 size-7/6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-transparent border-b-current"></span>
  </span>
</span>

<style>
@keyframes loading-ui-orbit-ring-rotation {
          0% {
            transform: rotate(0deg);
          }

          100% {
            transform: rotate(360deg);
          }
        }

  .loading-ui-motion { animation: loading-ui-orbit-ring-rotation var(--duration, 1s) linear infinite; }


  @media (prefers-reduced-motion: reduce) {
    .loading-ui-motion,
    .loading-ui-wave-bar {
      animation: none;
      opacity: 0.65;
    }
  }
</style>
