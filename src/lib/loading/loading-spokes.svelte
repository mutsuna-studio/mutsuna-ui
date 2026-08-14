<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";

export type LoadingSpokesProps = WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & {
  label?: string;
};

let {
  ref = $bindable(null),
  class: className,
  label = "読み込み中",
  ...restProps
}: LoadingSpokesProps = $props();
</script>

<!-- Adapted from Loading UI (spokes), MIT License. -->
<span
  bind:this={ref}
  {...restProps}
  role="status"
  aria-label={label}
  data-slot="loading-spokes"
  class={cn("size-6", "relative inline-flex items-center justify-center", className)}
>
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="loading-ui-motion size-full">
    <path d="M12 2V6M16.2 7.8L19.1 4.9M18 12H22M16.2 16.2L19.1 19.1M12 18V22M4.9 19.1L7.8 16.2M2 12H6M4.9 4.9L7.8 7.8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
  </svg>
</span>

<style>
@keyframes loading-ui-spokes-spin {
          to {
            transform: rotate(360deg);
          }
        }

  .loading-ui-motion { animation: loading-ui-spokes-spin var(--duration, 1s) linear infinite; }


  @media (prefers-reduced-motion: reduce) {
    .loading-ui-motion,
    .loading-ui-wave-bar {
      animation: none;
      opacity: 0.65;
    }
  }
</style>
