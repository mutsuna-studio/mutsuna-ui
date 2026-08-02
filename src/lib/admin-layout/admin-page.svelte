<script lang="ts">
import type { Snippet } from "svelte";
import { cn } from "../utils.js";

interface Props {
  children?: Snippet;
  class?: string;
  maxWidth?: "none" | "3xl" | "4xl" | "5xl" | "6xl";
}

let { children, class: className, maxWidth = "none" }: Props = $props();

const maxWidthClass = $derived(
  maxWidth === "3xl"
    ? "max-w-3xl"
    : maxWidth === "4xl"
      ? "max-w-4xl"
      : maxWidth === "5xl"
        ? "max-w-5xl"
        : maxWidth === "6xl"
          ? "max-w-6xl"
          : undefined,
);
</script>

<main class={cn("grid w-full content-start gap-4 pt-3", maxWidthClass, maxWidth !== "none" && "mx-auto", className)}>
  {@render children?.()}
</main>
