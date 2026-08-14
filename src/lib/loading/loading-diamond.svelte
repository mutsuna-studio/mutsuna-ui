<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";

export type LoadingDiamondProps = WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & {
  label?: string;
};

let {
  ref = $bindable(null),
  class: className,
  label = "読み込み中",
  ...restProps
}: LoadingDiamondProps = $props();
</script>

<!-- Adapted from Loading UI (diamond), MIT License. -->
<span
  bind:this={ref}
  {...restProps}
  role="status"
  aria-label={label}
  data-slot="loading-diamond"
  class={cn("size-6", "relative inline-flex items-center justify-center", className)}
>
  <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" class="size-full">
    <rect class="loading-ui-motion loading-ui-diamond-pixel" x="8" y="0" width="4" height="4"></rect>
    <rect class="loading-ui-motion loading-ui-diamond-pixel" x="12" y="4" width="4" height="4"></rect>
    <rect class="loading-ui-motion loading-ui-diamond-pixel" x="16" y="8" width="4" height="4"></rect>
    <rect class="loading-ui-motion loading-ui-diamond-pixel" x="12" y="12" width="4" height="4"></rect>
    <rect class="loading-ui-motion loading-ui-diamond-pixel" x="8" y="16" width="4" height="4"></rect>
    <rect class="loading-ui-motion loading-ui-diamond-pixel" x="4" y="12" width="4" height="4"></rect>
    <rect class="loading-ui-motion loading-ui-diamond-pixel" x="0" y="8" width="4" height="4"></rect>
    <rect class="loading-ui-motion loading-ui-diamond-pixel" x="4" y="4" width="4" height="4"></rect>
  </svg>
</span>

<style>
@keyframes loading-ui-diamond-spin { 0% { opacity: 0; } 1% { opacity: 1; } 100% { opacity: 0; } }

  .loading-ui-diamond-pixel { animation: loading-ui-diamond-spin 0.8s ease-in-out infinite; }
  .loading-ui-diamond-pixel:nth-child(2) { animation-delay: 0.1s; }
  .loading-ui-diamond-pixel:nth-child(3) { animation-delay: 0.2s; }
  .loading-ui-diamond-pixel:nth-child(4) { animation-delay: 0.3s; }
  .loading-ui-diamond-pixel:nth-child(5) { animation-delay: 0.4s; }
  .loading-ui-diamond-pixel:nth-child(6) { animation-delay: 0.5s; }
  .loading-ui-diamond-pixel:nth-child(7) { animation-delay: 0.6s; }
  .loading-ui-diamond-pixel:nth-child(8) { animation-delay: 0.7s; }


  @media (prefers-reduced-motion: reduce) {
    .loading-ui-motion,
    .loading-ui-wave-bar {
      animation: none;
      opacity: 0.65;
    }
  }
</style>
