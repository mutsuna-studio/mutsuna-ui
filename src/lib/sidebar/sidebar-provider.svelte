<script lang="ts">
import * as Tooltip from "@mutsuna/ui/tooltip";
import { cn, type WithElementRef } from "../utils.js";
import type { HTMLAttributes } from "svelte/elements";
import { SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME, SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON } from "./constants.js";
import { setSidebar } from "./context.svelte.js";

let {
  ref = $bindable(null),
  open = $bindable(true),
  onOpenChange = () => undefined,
  class: className,
  style,
  children,
  ...restProps
}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = $props();

const sidebar = setSidebar({
  open: () => open,
  setOpen: (value: boolean) => {
    open = value;
    onOpenChange(value);

    // sidebar状態を次回表示へ引き継ぐ。
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API非対応環境も維持する。
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
  },
});
</script>

<svelte:window onkeydown={sidebar.handleShortcutKeydown} />

<Tooltip.Provider delayDuration={0}>
	<div
		data-slot="sidebar-wrapper"
		style="--sidebar-width: {SIDEBAR_WIDTH}; --sidebar-width-icon: {SIDEBAR_WIDTH_ICON}; {style}"
		class={cn(
			"group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
			className
		)}
		bind:this={ref}
		{...restProps}
	>
		{@render children?.()}
	</div>
</Tooltip.Provider>
