<script module lang="ts">
import type { ComponentProps, Snippet } from "svelte";
import type { WithoutChildren } from "../utils.js";
import Dialog from "../dialog/dialog.svelte";
import Drawer from "../drawer/drawer.svelte";
import type {
  ResponsiveOverlayMode,
  ResolvedResponsiveOverlayMode,
} from "../responsive-overlay/context.svelte.js";

type WithoutOpen<T> = T extends { open?: unknown } ? Omit<T, "open" | "defaultOpen"> : T;

export type ResponsiveDialogMode = ResponsiveOverlayMode;

export type ResponsiveDialogProps = {
  open?: boolean;
  breakpoint?: number;
  mode?: ResponsiveDialogMode;
  ssrMode?: ResolvedResponsiveOverlayMode;
  dialogProps?: WithoutOpen<WithoutChildren<ComponentProps<typeof Dialog>>>;
  drawerProps?: WithoutOpen<WithoutChildren<ComponentProps<typeof Drawer>>>;
  children?: Snippet;
};
</script>

<script lang="ts">
import { tick } from "svelte";
import { setResponsiveOverlayState } from "../responsive-overlay/context.svelte.js";

let {
  open = $bindable(false),
  breakpoint = 768,
  mode = "auto",
  ssrMode = "desktop",
  dialogProps,
  drawerProps,
  children,
}: ResponsiveDialogProps = $props();

const responsive = setResponsiveOverlayState({
  mode: () => mode,
  mobileQuery: () => `max-width: ${Math.max(1, breakpoint) - 1}px`,
  ssrMode: () => ssrMode,
});

$effect(() => {
  const preferred = responsive.preferred;
  const current = responsive.current;

  if (!responsive.clientSynchronized) {
    responsive.sync(open);
    return;
  }

  if (open || current === preferred) {
    return;
  }

  let cancelled = false;
  const activeElement = document.activeElement;
  const shouldRestoreFocus =
    activeElement === document.body ||
    responsive.trigger?.contains(activeElement) ||
    responsive.content?.contains(activeElement);

  void (async () => {
    await tick();

    if (cancelled || open) {
      return;
    }

    const focusedElement = document.activeElement;
    const oldTriggerHadFocus = responsive.trigger?.contains(focusedElement);
    responsive.sync(false);

    if (shouldRestoreFocus || oldTriggerHadFocus) {
      await tick();
      responsive.trigger?.focus();
    }
  })();

  return () => {
    cancelled = true;
  };
});
</script>

{#if responsive.current === "mobile"}
  <Drawer bind:open {...drawerProps}>
    {@render children?.()}
  </Drawer>
{:else}
  <Dialog bind:open {...dialogProps}>
    {@render children?.()}
  </Dialog>
{/if}
