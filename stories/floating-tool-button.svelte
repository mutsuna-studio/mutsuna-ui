<script lang="ts">
import { mergeProps } from "bits-ui";
import type { LucideIcon } from "@lucide/svelte";
import { Button } from "@mutsuna/ui/button";
import * as Tooltip from "@mutsuna/ui/tooltip";
let { label, ariaLabel, icon, disabled = false, expanded, triggerProps = {}, onclick }: {
  label: string; ariaLabel?: string; icon: LucideIcon; disabled?: boolean; expanded?: boolean;
  triggerProps?: Record<string, unknown>; onclick?: (event: MouseEvent) => void;
} = $props();
const tooltipId = $props.id();
let tooltipOpen = $state(false);
const menuExpanded = $derived(triggerProps["aria-expanded"] === true || triggerProps["aria-expanded"] === "true");
const actionProps = $derived(onclick ? { onclick } : {});
$effect(() => { if (disabled || menuExpanded) tooltipOpen = false; });
const expandedProps = $derived(expanded === undefined ? {} : { "aria-haspopup": "dialog" as const, "aria-expanded": expanded });
</script>
<Tooltip.Root bind:open={tooltipOpen} disabled={disabled || menuExpanded}>
  <Tooltip.Trigger>{#snippet child({ props })}<Button {...(mergeProps(props, triggerProps, expandedProps, actionProps) as typeof props)} variant="ghost" size="icon-lg" {icon} aria-label={ariaLabel ?? label} aria-describedby={tooltipOpen ? tooltipId : undefined} {disabled} />{/snippet}</Tooltip.Trigger>
  <Tooltip.Content id={tooltipId} side="bottom" role="tooltip">{label}</Tooltip.Content>
</Tooltip.Root>
