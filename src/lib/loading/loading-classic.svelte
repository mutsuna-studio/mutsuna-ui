<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";

export type LoadingClassicProps = WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & {
  label?: string;
};

let {
  ref = $bindable(null),
  class: className,
  label = "読み込み中",
  ...restProps
}: LoadingClassicProps = $props();
</script>

<!-- Adapted from Loading UI (classic), MIT License. -->
<span
  bind:this={ref}
  {...restProps}
  role="status"
  aria-label={label}
  data-slot="loading-classic"
  class={cn("size-6", "relative inline-flex items-center justify-center", className)}
>
  <span aria-hidden="true" class="relative top-1/2 left-1/2 block size-full">
    {#each Array.from({ length: 12 }, (_, index) => index) as index (index)}
      <span class="loading-ui-motion loading-ui-classic-item absolute top-[-3.9%] left-[-10%] block h-[8%] w-[24%] rounded-(--radius) bg-current" style:transform={`rotate(${index * 30}deg) translate(146%)`} style:animation-delay={`calc(var(--duration, 1.2s) / 12 * ${index - 12})`}></span>
    {/each}
  </span>
</span>

<style>
@keyframes loading-ui-classic-fade {
          0% {
            opacity: 1;
          }

          100% {
            opacity: 0.15;
          }
        }

  .loading-ui-classic-item { animation: loading-ui-classic-fade var(--duration, 1.2s) linear infinite; }


  @media (prefers-reduced-motion: reduce) {
    .loading-ui-motion,
    .loading-ui-wave-bar {
      animation: none;
      opacity: 0.65;
    }
  }
</style>
