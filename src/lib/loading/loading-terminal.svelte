<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";

export type LoadingTerminalProps = WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & {
  label?: string;
};

let {
  ref = $bindable(null),
  class: className,
  label = "読み込み中",
  ...restProps
}: LoadingTerminalProps = $props();
</script>

<!-- Adapted from Loading UI (terminal), MIT License. -->
<span
  bind:this={ref}
  {...restProps}
  role="status"
  aria-label={label}
  data-slot="loading-terminal"
  class={cn("h-2 w-8", "inline-flex items-center justify-center gap-[0.25em]", className)}
>
  <span aria-hidden="true" class="font-mono">&gt;</span>
  <span aria-hidden="true" class="loading-ui-motion inline-block h-[1em] w-[0.5em] bg-current"></span>
</span>

<style>
@keyframes loading-ui-terminal-blink {
          0%,
          100% {
            opacity: 1;
          }

          50% {
            opacity: 0;
          }
        }

  .loading-ui-motion { animation: loading-ui-terminal-blink var(--duration, 1s) step-end infinite; }


  @media (prefers-reduced-motion: reduce) {
    .loading-ui-motion,
    .loading-ui-wave-bar {
      animation: none;
      opacity: 0.65;
    }
  }
</style>
