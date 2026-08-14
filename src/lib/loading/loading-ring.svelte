<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";

export type LoadingRingProps = WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & {
  label?: string;
};

let {
  ref = $bindable(null),
  class: className,
  label = "読み込み中",
  ...restProps
}: LoadingRingProps = $props();
</script>

<!-- Adapted from Loading UI (ring), MIT License. -->
<span
  bind:this={ref}
  {...restProps}
  role="status"
  aria-label={label}
  data-slot="loading-ring"
  class={cn("size-6", "relative inline-flex items-center justify-center", className)}
>
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="loading-ui-motion size-full">
    <path d="M21 12.0004C20.9999 13.901 20.3981 15.7528 19.2809 17.2904C18.1637 18.8279 16.5885 19.9723 14.7809 20.5596C12.9733 21.1469 11.0262 21.1468 9.21864 20.5594C7.41109 19.9721 5.83588 18.8276 4.71876 17.29C3.60165 15.7523 2.99999 13.9005 3 11.9999C3.00001 10.0993 3.60171 8.24755 4.71884 6.70994C5.83598 5.17233 7.4112 4.02785 9.21877 3.44052C11.0263 2.85319 12.9734 2.85316 14.781 3.44044" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
  </svg>
</span>

<style>
@keyframes loading-ui-ring-spin {
          to {
            transform: rotate(360deg);
          }
        }

  .loading-ui-motion { animation: loading-ui-ring-spin var(--duration, 1s) linear infinite; }


  @media (prefers-reduced-motion: reduce) {
    .loading-ui-motion,
    .loading-ui-wave-bar {
      animation: none;
      opacity: 0.65;
    }
  }
</style>
