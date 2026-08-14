<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";

export type LoadingDualArcProps = WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & {
  label?: string;
};

let {
  ref = $bindable(null),
  class: className,
  label = "読み込み中",
  ...restProps
}: LoadingDualArcProps = $props();
</script>

<!-- Adapted from Loading UI (dual-arc), MIT License. -->
<span
  bind:this={ref}
  {...restProps}
  role="status"
  aria-label={label}
  data-slot="loading-dual-arc"
  class={cn("size-6", "relative inline-flex items-center justify-center", className)}
>
  <span aria-hidden="true" class="loading-ui-motion size-full rounded-full border-[5px] border-transparent border-y-current"></span>
</span>

<style>
@keyframes loading-ui-dual-arc-spin {
          to {
            transform: rotate(360deg);
          }
        }

  .loading-ui-motion { animation: loading-ui-dual-arc-spin var(--duration, 1s) linear infinite; }


  @media (prefers-reduced-motion: reduce) {
    .loading-ui-motion,
    .loading-ui-wave-bar {
      animation: none;
      opacity: 0.65;
    }
  }
</style>
