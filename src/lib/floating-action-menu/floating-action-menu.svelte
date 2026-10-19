<script module lang="ts">
import type { Snippet } from "svelte";
export type FloatingActionMenuPosition = { x: number; y: number };
export type FloatingActionMenuProps = {
  open?: boolean;
  ref?: HTMLButtonElement | null;
  ariaLabel?: string;
  disabled?: boolean;
  /** Viewport coordinates; otherwise placed near the top-right edge. */
  position?: FloatingActionMenuPosition | null;
  /** Render in the normal layout without a floating surface; default is floating. */
  placement?: "floating" | "inline";
  /** Shortcuts shown directly when the viewport is wide enough. */
  actions?: Snippet;
  /** Keep overflow beside shortcuts, or show it only in compact viewports. */
  overflow?: "always" | "compact";
  /** DropdownMenu items and groups, owned by the consumer. */
  children: Snippet<[{ close: () => void }]>;
  onCloseAutoFocus?: (event: Event) => void;
  class?: string;
};
</script>
<script lang="ts">
import { mergeProps, Portal } from "bits-ui";
import { Ellipsis } from "@lucide/svelte";
import { Button } from "../button/index.js";
import * as Tooltip from "../tooltip/index.js";
import * as Menu from "../dropdown-menu/index.js";
import { cn } from "../utils.js";
let { open = $bindable(false), ref = $bindable(null), ariaLabel = "操作メニュー", disabled = false, position, placement = "floating", children, actions, overflow = "always", onCloseAutoFocus, class: className }: FloatingActionMenuProps = $props();
const tooltipId = $props.id();
let tooltipOpen = $state(false);
let size = $state({ width: 44, height: 44 });
function measure(node: HTMLElement) {
  const update = () => { size = { width: node.offsetWidth, height: node.offsetHeight }; };
  update(); const observer = new ResizeObserver(update); observer.observe(node);
  return { destroy() { observer.disconnect(); } };
}
$effect(() => {
  if (!actions || overflow !== "compact") return;
  const query = matchMedia("(min-width: 768px)");
  const update = () => { if (query.matches) open = false; };
  update(); query.addEventListener("change", update);
  return () => query.removeEventListener("change", update);
});
function close() { open = false; }
$effect(() => { if (disabled) open = false; if (disabled || open) tooltipOpen = false; });
</script>
<Tooltip.Provider delayDuration={200}>
<Portal disabled={placement === "inline"}>
  <div use:measure data-slot="floating-action-menu" data-placement={placement} class="floating-anchor" class:shortcuts-only={Boolean(actions) && overflow === "compact"} style:left={placement === "floating" && position ? `clamp(12px, ${position.x}px, calc(100vw - ${size.width}px - 12px))` : undefined} style:top={placement === "floating" && position ? `clamp(12px, ${position.y}px, calc(100dvh - ${size.height}px - 12px))` : undefined} style:right={placement === "floating" && position ? "auto" : undefined}>
    {#if actions}<fieldset class="floating-actions" {disabled} aria-label={ariaLabel}>{@render actions()}</fieldset>{/if}
    <Menu.Root bind:open>
      <span class="overflow-trigger"><Tooltip.Root bind:open={tooltipOpen} disabled={disabled || open}>
        <Menu.Trigger bind:ref>{#snippet child({ props: menuProps })}<Tooltip.Trigger>{#snippet child({ props: tooltipProps })}<Button {...mergeProps(tooltipProps, menuProps)} variant={placement === "inline" ? "ghost" : "outline"} icon={Ellipsis} class={cn("floating-action-trigger", className)} aria-label={ariaLabel} aria-describedby={tooltipOpen ? tooltipId : undefined} {disabled} />{/snippet}</Tooltip.Trigger>{/snippet}</Menu.Trigger>
        <Tooltip.Content id={tooltipId} side="bottom" role="tooltip">{ariaLabel}</Tooltip.Content>
      </Tooltip.Root></span>
      <Menu.Content preventScroll={false} align="end" sideOffset={8} collisionPadding={12} class="w-56 max-w-[calc(100vw-24px)] max-h-[min(24rem,var(--bits-dropdown-menu-content-available-height))]" aria-label={ariaLabel} {onCloseAutoFocus}>
        {@render children({ close })}
      </Menu.Content>
    </Menu.Root>
  </div>
</Portal>
</Tooltip.Provider>
<style>
  .floating-anchor { display: flex; align-items: flex-start; gap: 6px; width: max-content; max-width: calc(100vw - 24px); position: fixed; right: 24px; top: clamp(12px, 88px, calc(100dvh - 56px)); z-index: 50; }
  .overflow-trigger { display: flex; }
  .floating-actions { display: none; margin: 0; min-inline-size: 0; align-items: center; gap: 2px; padding: 3px; border: 1px solid var(--border); border-radius: 12px; background: var(--background); box-shadow: 0 3px 14px rgb(0 0 0 / .1); }
  .floating-actions:disabled { opacity: .5; }
  @media (min-width: 768px) { .floating-actions { display: flex; } .shortcuts-only .overflow-trigger { display: none; } }
  .floating-anchor :global(.floating-action-trigger) { width: 44px; height: 44px; padding: 0; border-radius: 12px; background: var(--background); box-shadow: 0 3px 14px rgb(0 0 0 / .1); }
  .floating-anchor[data-placement="inline"] { position: static; max-width: 100%; z-index: auto; }
  .floating-anchor[data-placement="inline"] .floating-actions { padding: 0; border: 0; border-radius: 0; background: transparent; box-shadow: none; }
  .floating-anchor[data-placement="inline"] :global(.floating-action-trigger) { background: transparent; box-shadow: none; }
</style>
