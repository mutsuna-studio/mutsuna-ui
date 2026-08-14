<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";

export type LoadingMorphingInfinityProps = WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & {
  label?: string;
};

let {
  ref = $bindable(null),
  class: className,
  label = "読み込み中",
  ...restProps
}: LoadingMorphingInfinityProps = $props();
</script>

<!-- Adapted manually from Loading UI (morphing-infinity), MIT License. -->
<span
  bind:this={ref}
  {...restProps}
  role="status"
  aria-label={label}
  data-slot="loading-morphing-infinity"
  class={cn("size-6", "relative inline-flex items-center justify-center", className)}
>
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="size-full"
  >
    <path
      class="loading-ui-motion"
      d="M 12 8 C 14.21 8 16 9.79 16 12 C 16 14.21 14.21 16 12 16 C 9.79 16 8 14.21 8 12 C 8 9.79 9.79 8 12 8 Z"
    ></path>
  </svg>
</span>

<style>
  @keyframes loading-ui-morphing-infinity {
    0%,
    100% {
      d: path("M 12 8 C 14.21 8 16 9.79 16 12 C 16 14.21 14.21 16 12 16 C 9.79 16 8 14.21 8 12 C 8 9.79 9.79 8 12 8 Z");
    }

    25%,
    75% {
      d: path("M 12 12 C 14 8.5 19 8.5 19 12 C 19 15.5 14 15.5 12 12 C 10 8.5 5 8.5 5 12 C 5 15.5 10 15.5 12 12 Z");
    }

    50% {
      d: path("M 12 16 C 14.21 16 16 14.21 16 12 C 16 9.79 14.21 8 12 8 C 9.79 8 8 9.79 8 12 C 8 14.21 9.79 16 12 16 Z");
    }
  }

  .loading-ui-motion {
    animation: loading-ui-morphing-infinity var(--duration, 5s) ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .loading-ui-motion {
      animation: none;
      opacity: 0.65;
    }
  }
</style>
