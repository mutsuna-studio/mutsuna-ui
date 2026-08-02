<script lang="ts">
import { Toaster as Sonner, type ToasterProps as SonnerProps } from "svelte-sonner";
import { mode } from "mode-watcher";
import Loader2Icon from "@lucide/svelte/icons/loader-2";
import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
import OctagonXIcon from "@lucide/svelte/icons/octagon-x";
import InfoIcon from "@lucide/svelte/icons/info";
import TriangleAlertIcon from "@lucide/svelte/icons/triangle-alert";

let { richColors = true, ...restProps }: SonnerProps = $props();
</script>

<Sonner
	theme={mode.current}
	{richColors}
	class="toaster group"
	{...restProps}
>
	{#snippet loadingIcon()}
		<Loader2Icon class="size-4 animate-spin" />
	{/snippet}
	{#snippet successIcon()}
		<CircleCheckIcon class="size-4" />
	{/snippet}
	{#snippet errorIcon()}
		<OctagonXIcon class="size-4" />
	{/snippet}
	{#snippet infoIcon()}
		<InfoIcon class="size-4" />
	{/snippet}
	{#snippet warningIcon()}
		<TriangleAlertIcon class="size-4" />
	{/snippet}
</Sonner>
