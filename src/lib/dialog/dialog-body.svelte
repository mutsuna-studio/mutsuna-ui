<script lang="ts">
import { onDestroy } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef } from "../utils.js";

let { ref = $bindable(null), class: className, children, onscroll, ...restProps }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();

type ScrollbarState = "visible" | "fading-out" | null;

let scrollbarState = $state<ScrollbarState>(null);
let scrollbarHideTimeout: ReturnType<typeof setTimeout> | undefined;
let scrollbarFadeOutTimeout: ReturnType<typeof setTimeout> | undefined;

function clearScrollbarTimeouts(): void {
  if (scrollbarHideTimeout !== undefined) {
    globalThis.clearTimeout(scrollbarHideTimeout);
    scrollbarHideTimeout = undefined;
  }
  if (scrollbarFadeOutTimeout !== undefined) {
    globalThis.clearTimeout(scrollbarFadeOutTimeout);
    scrollbarFadeOutTimeout = undefined;
  }
}

function handleScroll(event: UIEvent & { currentTarget: EventTarget & HTMLDivElement }): void {
  clearScrollbarTimeouts();
  scrollbarState = "visible";
  scrollbarHideTimeout = globalThis.setTimeout(() => {
    scrollbarState = "fading-out";
    scrollbarFadeOutTimeout = globalThis.setTimeout(() => {
      scrollbarState = null;
      scrollbarFadeOutTimeout = undefined;
    }, 220);
  }, 700);
  onscroll?.(event);
}

onDestroy(clearScrollbarTimeouts);
</script>

<div
  bind:this={ref}
  data-slot="dialog-body"
  data-scrollbar-state={scrollbarState ?? undefined}
  class={cn("-mx-4 flex-1 min-h-0 overflow-y-auto px-4", className)}
  onscroll={handleScroll}
  {...restProps}
>
  {@render children?.()}
</div>

<style>
  [data-slot="dialog-body"] {
    scrollbar-color: transparent transparent;
    scrollbar-gutter: stable both-edges;
    scrollbar-width: thin;
  }

  [data-slot="dialog-body"][data-scrollbar-state="visible"],
  [data-slot="dialog-body"][data-scrollbar-state="fading-out"] {
    scrollbar-color: color-mix(in oklch, var(--primary) 72%, transparent) transparent;
  }

  [data-slot="dialog-body"]::-webkit-scrollbar {
    width: 0.625rem;
    height: 0.625rem;
  }

  [data-slot="dialog-body"]::-webkit-scrollbar-thumb {
    background-color: transparent;
    border: 0.1875rem solid transparent;
    border-radius: 9999px;
    background-clip: content-box;
  }

  [data-slot="dialog-body"][data-scrollbar-state="visible"]::-webkit-scrollbar-thumb {
    background-color: color-mix(in oklch, var(--primary) 72%, transparent);
    animation: dialog-scrollbar-fade-in 180ms ease-out both;
  }

  [data-slot="dialog-body"][data-scrollbar-state="fading-out"]::-webkit-scrollbar-thumb {
    animation: dialog-scrollbar-fade-out 220ms ease-in both;
  }

  [data-slot="dialog-body"][data-scrollbar-state="visible"]::-webkit-scrollbar-thumb:hover {
    background-color: var(--primary);
  }

  [data-slot="dialog-body"]::-webkit-scrollbar-button {
    display: none;
  }

  @keyframes dialog-scrollbar-fade-in {
    from {
      background-color: transparent;
    }

    to {
      background-color: color-mix(in oklch, var(--primary) 72%, transparent);
    }
  }

  @keyframes dialog-scrollbar-fade-out {
    from {
      background-color: color-mix(in oklch, var(--primary) 72%, transparent);
    }

    to {
      background-color: transparent;
    }
  }
</style>
