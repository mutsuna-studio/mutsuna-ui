<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";

export type LoadingTwinOrbitProps = WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & {
  label?: string;
};

let {
  ref = $bindable(null),
  class: className,
  label = "読み込み中",
  ...restProps
}: LoadingTwinOrbitProps = $props();
</script>

<!-- Adapted from Loading UI (twin-orbit), MIT License. -->
<span
  bind:this={ref}
  {...restProps}
  role="status"
  aria-label={label}
  data-slot="loading-twin-orbit"
  class={cn("size-6", "relative inline-flex items-center justify-center", className)}
>
  <span aria-hidden="true" class="relative block size-[28%] rounded-full bg-current">
    <span class="loading-ui-motion absolute inset-0 rounded-full bg-current"></span>
    <span class="loading-ui-motion loading-ui-motion-delayed absolute inset-0 rounded-full bg-current"></span>
  </span>
</span>

<style>
@keyframes loading-ui-twin-orbit-rotate {
          100% {
            transform: rotate(360deg) translate(155%);
          }
        }

  .loading-ui-motion { animation: loading-ui-twin-orbit-rotate var(--duration, 1s) ease infinite; transform: rotate(0deg) translate(155%); }
  .loading-ui-motion-delayed { animation-delay: calc(var(--duration, 1s) / 2); }


  @media (prefers-reduced-motion: reduce) {
    .loading-ui-motion,
    .loading-ui-wave-bar {
      animation: none;
      opacity: 0.65;
    }
  }
</style>
