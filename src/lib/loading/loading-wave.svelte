<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";

export type LoadingWaveProps = WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & {
  label?: string;
};

let {
  ref = $bindable(null),
  class: className,
  label = "読み込み中",
  ...restProps
}: LoadingWaveProps = $props();
</script>

<!-- Adapted from Loading UI (wave), MIT License. -->
<span
  bind:this={ref}
  {...restProps}
  role="status"
  aria-label={label}
  data-slot="loading-wave"
  class={cn("h-2 w-8", "inline-flex items-center justify-center gap-[2.5%]", className)}
>
  <span aria-hidden="true" class="loading-ui-wave-bar h-1/2"></span>
  <span aria-hidden="true" class="loading-ui-wave-bar h-3/4"></span>
  <span aria-hidden="true" class="loading-ui-wave-bar h-full"></span>
  <span aria-hidden="true" class="loading-ui-wave-bar h-3/4"></span>
  <span aria-hidden="true" class="loading-ui-wave-bar h-1/2"></span>
</span>

<style>
@keyframes loading-ui-wave {
          0%,
          100% {
            transform: scaleY(1);
          }

          50% {
            transform: scaleY(0.6);
          }
        }

  .loading-ui-wave-bar { width: 12.5%; border-radius: 9999px; background: currentColor; animation: loading-ui-wave var(--duration, 1s) ease-in-out infinite; }
  .loading-ui-wave-bar:nth-child(2) { animation-delay: calc(var(--delay, 100ms) * 1); }
  .loading-ui-wave-bar:nth-child(3) { animation-delay: calc(var(--delay, 100ms) * 2); }
  .loading-ui-wave-bar:nth-child(4) { animation-delay: calc(var(--delay, 100ms) * 3); }
  .loading-ui-wave-bar:nth-child(5) { animation-delay: calc(var(--delay, 100ms) * 4); }


  @media (prefers-reduced-motion: reduce) {
    .loading-ui-motion,
    .loading-ui-wave-bar {
      animation: none;
      opacity: 0.65;
    }
  }
</style>
