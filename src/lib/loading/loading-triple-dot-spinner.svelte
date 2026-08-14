<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";

export type LoadingTripleDotSpinnerProps = WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & {
  label?: string;
};

let {
  ref = $bindable(null),
  class: className,
  label = "読み込み中",
  ...restProps
}: LoadingTripleDotSpinnerProps = $props();
</script>

<!-- Adapted from Loading UI (triple-dot-spinner), MIT License. -->
<span
  bind:this={ref}
  {...restProps}
  role="status"
  aria-label={label}
  data-slot="loading-triple-dot-spinner"
  class={cn("size-6", "relative inline-flex items-center justify-center", className)}
>
  <span aria-hidden="true" class="loading-ui-motion relative block size-[18%] rounded-full bg-current">
    <span class="absolute top-1/2 left-1/2 size-full -translate-x-[200%] -translate-y-1/2 rounded-full bg-current"></span>
    <span class="absolute top-1/2 left-1/2 size-full translate-x-full -translate-y-1/2 rounded-full bg-current"></span>
  </span>
</span>

<style>
@keyframes loading-ui-triple-dot-rotation {
          0% {
            transform: rotate(0deg);
          }

          100% {
            transform: rotate(360deg);
          }
        }

  .loading-ui-motion { animation: loading-ui-triple-dot-rotation var(--duration, 2s) ease-in-out infinite; }


  @media (prefers-reduced-motion: reduce) {
    .loading-ui-motion,
    .loading-ui-wave-bar {
      animation: none;
      opacity: 0.65;
    }
  }
</style>
