<script lang="ts">
import { Toaster as Sonner, type ToasterProps as SonnerProps } from "svelte-sonner";
import { mode } from "mode-watcher";
import Loader2Icon from "@lucide/svelte/icons/loader-2";
import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
import OctagonXIcon from "@lucide/svelte/icons/octagon-x";
import InfoIcon from "@lucide/svelte/icons/info";
import TriangleAlertIcon from "@lucide/svelte/icons/triangle-alert";

let { richColors = true, closeButton = true, ...restProps }: SonnerProps = $props();
</script>

<Sonner
	theme={mode.current}
	{richColors}
	{closeButton}
	class="mutsuna-toaster toaster group"
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

<style>
	:global(.mutsuna-toaster [data-sonner-toast][data-styled="true"] [data-button]) {
		order: 2;
		width: 1.5rem;
		height: 1.5rem;
		margin: 0 0 0 auto;
		padding: 0;
		border-radius: 0.25rem;
		color: inherit;
		background: transparent;
		font-size: 0;
	}

	:global(.mutsuna-toaster [data-sonner-toast][data-styled="true"] [data-button]::before) {
		width: 1rem;
		height: 1rem;
		content: "";
		background-color: currentColor;
		mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='14' height='14' x='8' y='8' rx='2' ry='2'/%3E%3Cpath d='M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2'/%3E%3C/svg%3E") center / contain no-repeat;
	}

	:global(.mutsuna-toaster [data-sonner-toast][data-styled="true"] [data-close-button]) {
		position: static;
		order: 3;
		width: 1.5rem;
		height: 1.5rem;
		margin: 0;
		padding: 0;
		border: 0;
		border-radius: 0.25rem;
		transform: none;
		color: inherit;
		background: transparent !important;
	}

	:global(.mutsuna-toaster [data-sonner-toast][data-styled="true"] [data-button]:hover),
	:global(.mutsuna-toaster [data-sonner-toast][data-styled="true"] [data-close-button]:hover) {
		background: transparent !important;
		opacity: 0.7;
	}

	:global(.mutsuna-toaster [data-sonner-toast][data-styled="true"] [data-button]:focus-visible),
	:global(.mutsuna-toaster [data-sonner-toast][data-styled="true"] [data-close-button]:focus-visible) {
		outline: 2px solid currentColor;
		outline-offset: 2px;
		box-shadow: none;
	}
</style>
