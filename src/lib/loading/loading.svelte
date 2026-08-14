<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithoutChildren } from "../utils.js";
import type { LoadingVariant } from "./loading-variants.js";
import LoadingDots from "./loading-dots.svelte";
import LoadingBars from "./loading-bars.svelte";
import LoadingBouncingDots from "./loading-bouncing-dots.svelte";
import LoadingTyping from "./loading-typing.svelte";
import LoadingArc from "./loading-arc.svelte";
import LoadingClassic from "./loading-classic.svelte";
import LoadingClockRing from "./loading-clock-ring.svelte";
import LoadingConcentricRing from "./loading-concentric-ring.svelte";
import LoadingDiamond from "./loading-diamond.svelte";
import LoadingDualArc from "./loading-dual-arc.svelte";
import LoadingInfinity from "./loading-infinity.svelte";
import LoadingMorphingInfinity from "./loading-morphing-infinity.svelte";
import LoadingOrbitRing from "./loading-orbit-ring.svelte";
import LoadingPulse from "./loading-pulse.svelte";
import LoadingPulseDot from "./loading-pulse-dot.svelte";
import LoadingQuarterRing from "./loading-quarter-ring.svelte";
import LoadingRing from "./loading-ring.svelte";
import LoadingSatelliteRing from "./loading-satellite-ring.svelte";
import LoadingSpokes from "./loading-spokes.svelte";
import LoadingSwirling from "./loading-swirling.svelte";
import LoadingTerminal from "./loading-terminal.svelte";
import LoadingTripleDotSpinner from "./loading-triple-dot-spinner.svelte";
import LoadingTwinOrbit from "./loading-twin-orbit.svelte";
import LoadingWave from "./loading-wave.svelte";

export type { LoadingVariant } from "./loading-variants.js";
export type LoadingSize = "sm" | "md" | "lg";
export type LoadingProps = WithoutChildren<HTMLAttributes<HTMLSpanElement>> & {
  variant?: LoadingVariant;
  size?: LoadingSize;
  count?: number;
  label?: string;
};

let {
  variant = "dots",
  size = "md",
  count,
  label = "読み込み中",
  class: className,
  ...restProps
}: LoadingProps = $props();

const sizeClasses: Record<LoadingVariant, Record<LoadingSize, string>> = {
  "dots": { sm: "h-1.5 w-6", md: "h-2 w-8", lg: "h-3 w-12" },
  "bars": { sm: "size-4", md: "size-6", lg: "size-8" },
  "bouncing-dots": { sm: "h-1.5 w-6", md: "h-2 w-8", lg: "h-3 w-12" },
  "typing": { sm: "h-1.5 w-6", md: "h-2 w-8", lg: "h-3 w-12" },
  "arc": { sm: "size-4", md: "size-6", lg: "size-8" },
  "classic": { sm: "size-4", md: "size-6", lg: "size-8" },
  "clock-ring": { sm: "size-4", md: "size-6", lg: "size-8" },
  "concentric-ring": { sm: "size-4", md: "size-6", lg: "size-8" },
  "diamond": { sm: "size-4", md: "size-6", lg: "size-8" },
  "dual-arc": { sm: "size-4", md: "size-6", lg: "size-8" },
  "infinity": { sm: "size-4", md: "size-6", lg: "size-8" },
  "morphing-infinity": { sm: "size-4", md: "size-6", lg: "size-8" },
  "orbit-ring": { sm: "size-4", md: "size-6", lg: "size-8" },
  "pulse": { sm: "size-4", md: "size-6", lg: "size-8" },
  "pulse-dot": { sm: "size-4", md: "size-6", lg: "size-8" },
  "quarter-ring": { sm: "size-4", md: "size-6", lg: "size-8" },
  "ring": { sm: "size-4", md: "size-6", lg: "size-8" },
  "satellite-ring": { sm: "size-4", md: "size-6", lg: "size-8" },
  "spokes": { sm: "size-4", md: "size-6", lg: "size-8" },
  "swirling": { sm: "size-4", md: "size-6", lg: "size-8" },
  "terminal": { sm: "h-1.5 w-6", md: "h-2 w-8", lg: "h-3 w-12" },
  "triple-dot-spinner": { sm: "size-4", md: "size-6", lg: "size-8" },
  "twin-orbit": { sm: "size-4", md: "size-6", lg: "size-8" },
  "wave": { sm: "h-1.5 w-6", md: "h-2 w-8", lg: "h-3 w-12" },
};
</script>

{#if variant === "dots"}
  <LoadingDots {count} {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "bars"}
  <LoadingBars {count} {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "bouncing-dots"}
  <LoadingBouncingDots {count} {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "typing"}
  <LoadingTyping {count} {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "arc"}
  <LoadingArc {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "classic"}
  <LoadingClassic {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "clock-ring"}
  <LoadingClockRing {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "concentric-ring"}
  <LoadingConcentricRing {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "diamond"}
  <LoadingDiamond {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "dual-arc"}
  <LoadingDualArc {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "infinity"}
  <LoadingInfinity {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "morphing-infinity"}
  <LoadingMorphingInfinity {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "orbit-ring"}
  <LoadingOrbitRing {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "pulse"}
  <LoadingPulse {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "pulse-dot"}
  <LoadingPulseDot {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "quarter-ring"}
  <LoadingQuarterRing {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "ring"}
  <LoadingRing {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "satellite-ring"}
  <LoadingSatelliteRing {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "spokes"}
  <LoadingSpokes {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "swirling"}
  <LoadingSwirling {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "terminal"}
  <LoadingTerminal {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "triple-dot-spinner"}
  <LoadingTripleDotSpinner {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "twin-orbit"}
  <LoadingTwinOrbit {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{:else if variant === "wave"}
  <LoadingWave {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />
{/if}
