<script lang="ts">
import { Toaster as Sonner, type ToasterProps as SonnerProps } from "svelte-sonner";
import { mode } from "mode-watcher";
import Loader2Icon from "@lucide/svelte/icons/loader-2";
import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
import OctagonXIcon from "@lucide/svelte/icons/octagon-x";
import InfoIcon from "@lucide/svelte/icons/info";
import TriangleAlertIcon from "@lucide/svelte/icons/triangle-alert";

let {
	richColors = true,
	closeButton = true,
	duration = 4000,
	toastOptions,
	style,
	...restProps
}: SonnerProps = $props();

let progressDuration = $derived(toastOptions?.duration ?? duration);
</script>

<Sonner
	theme={mode.current}
	{richColors}
	{closeButton}
	{duration}
	{toastOptions}
	class="mutsuna-toaster toaster group"
	data-mutsuna-progress={Number.isFinite(progressDuration) && progressDuration > 0}
	style={`--mutsuna-toast-duration: ${progressDuration}ms; ${style ?? ""}`}
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
	:global(.mutsuna-toaster [data-sonner-toast][data-styled="true"] [data-icon]) {
		align-self: flex-start;
		margin-block-start: 0.125rem;
	}

	:global(
		.mutsuna-toaster[data-mutsuna-progress="true"]
			[data-sonner-toast][data-styled="true"]:not([data-type="loading"])
	) {
		overflow: hidden;
		padding-inline-end: 3.25rem;
	}

	:global(
		.mutsuna-toaster
			[data-sonner-toast][data-styled="true"]:has([data-button]):has([data-close-button])
	) {
		min-block-size: 3.75rem;
	}

	:global(
		.mutsuna-toaster[data-mutsuna-progress="true"]
			[data-sonner-toast][data-styled="true"]:not([data-type="loading"])::after
	) {
		position: absolute;
		inset-inline: 0;
		bottom: 0;
		height: 2px;
		content: "";
		transform: scaleX(1);
		transform-origin: left;
		border-radius: 999px;
		background: currentColor;
		opacity: 0.55;
		pointer-events: none;
		animation: mutsuna-toast-progress var(--mutsuna-toast-duration) linear forwards;
	}

	:global(
		.mutsuna-toaster[dir="rtl"][data-mutsuna-progress="true"]
			[data-sonner-toast][data-styled="true"]:not([data-type="loading"])::after
	) {
		transform-origin: right;
	}

	:global(
		.mutsuna-toaster[data-mutsuna-progress="true"]
			[data-sonner-toast][data-styled="true"]:not([data-type="loading"])[data-expanded="true"]::after
	),
	:global(
		.mutsuna-toaster[data-mutsuna-progress="true"]
			[data-sonner-toast][data-styled="true"]:not([data-type="loading"]):hover::after
	),
	:global(
		.mutsuna-toaster[data-mutsuna-progress="true"]
			[data-sonner-toast][data-styled="true"]:not([data-type="loading"]):active::after
	) {
		animation-play-state: paused;
	}

	:global(.mutsuna-toaster [data-sonner-toast][data-styled="true"] [data-button]) {
		position: absolute;
		inset-inline-end: 0.75rem;
		top: calc(50% + 0.125rem);
		order: 2;
		width: 1.5rem;
		height: 1.5rem;
		margin: 0;
		padding: 0;
		border-radius: 0.25rem;
		color: inherit;
		background: transparent;
		font-size: 0;
		justify-content: center;
		transition: opacity 150ms ease;
	}

	:global(.mutsuna-toaster [data-sonner-toast][data-styled="true"] [data-button]::before) {
		width: 1rem;
		height: 1rem;
		flex: none;
		content: "";
		background-color: currentColor;
		mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='14' height='14' x='8' y='8' rx='2' ry='2'/%3E%3Cpath d='M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2'/%3E%3C/svg%3E") center / contain no-repeat;
	}

	:global(
		.mutsuna-toaster [data-sonner-toast][data-styled="true"] [data-button][data-copied="true"]::before
	) {
		mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m20 6-11 11-5-5'/%3E%3C/svg%3E") center / contain no-repeat;
	}

	:global(.mutsuna-toaster [data-sonner-toast][data-styled="true"] [data-close-button]) {
		position: absolute;
		inset-inline-start: auto;
		inset-inline-end: 0.75rem;
		top: calc(50% - 1.625rem);
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
		transition: opacity 150ms ease;
	}

	:global(.mutsuna-toaster [data-sonner-toast][data-styled="true"] [data-close-button] svg) {
		width: 1rem;
		height: 1rem;
		flex: none;
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

	@keyframes mutsuna-toast-progress {
		to {
			transform: scaleX(0);
		}
	}

</style>
