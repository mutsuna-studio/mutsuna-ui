<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";

export type LoadingPulseProps = WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & {
  label?: string;
};

let {
  ref = $bindable(null),
  class: className,
  label = "読み込み中",
  ...restProps
}: LoadingPulseProps = $props();
</script>

<!-- Adapted from Loading UI (pulse), MIT License. -->
<span
  bind:this={ref}
  {...restProps}
  role="status"
  aria-label={label}
  data-slot="loading-pulse"
  class={cn("size-6", "relative inline-flex items-center justify-center", className)}
>
  <span aria-hidden="true" class="loading-ui-motion absolute inset-0 rounded-full border-2 border-current"></span>
</span>

<style>
@keyframes loading-ui-thin-pulse {
          0%,
          100% {
            transform: scale(0.95);
            opacity: 0.8;
          }

          50% {
            transform: scale(1.05);
            opacity: 0.4;
          }
        }

  .loading-ui-motion { animation: loading-ui-thin-pulse var(--duration, 1.5s) ease-in-out infinite; }


  @media (prefers-reduced-motion: reduce) {
    .loading-ui-motion,
    .loading-ui-wave-bar {
      animation: none;
      opacity: 0.65;
    }
  }
</style>
