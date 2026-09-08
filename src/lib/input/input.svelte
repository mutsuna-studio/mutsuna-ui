<script lang="ts">
import type { HTMLInputAttributes, HTMLInputTypeAttribute } from "svelte/elements";
import { cn, type WithElementRef } from "../utils.js";

type InputType = Exclude<HTMLInputTypeAttribute, "file">;

type Props = { label?: string } & WithElementRef<Omit<HTMLInputAttributes, "type"> & ({ type: "file"; files?: FileList } | { type?: InputType; files?: undefined })>;

let {
  label,
  id,
  placeholder,
  ref = $bindable(null),
  value = $bindable(),
  type,
  files = $bindable(),
  class: className,
  "data-slot": dataSlot = "input",
  ...restProps
}: Props = $props();
const generatedId = $props.id();
const inputId = $derived(id ?? (label ? generatedId : undefined));
const floating = $derived(Boolean(label) && !["file", "hidden", "checkbox", "radio", "range", "color", "button", "submit", "reset", "image"].includes(type ?? "text"));
const alwaysRaised = $derived(["date", "datetime-local", "month", "time", "week"].includes(type ?? "text"));
</script>

{#snippet control()}
{#if type === "file"}
	<input
		id={inputId}
		placeholder={floating ? (placeholder || " ") : placeholder}
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			"dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 h-8 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors file:h-6 file:text-sm file:font-medium focus-visible:ring-3 aria-invalid:ring-3 md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
			className,
      floating && "floating-control"
		)}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else}
	<input
		id={inputId}
		placeholder={floating ? (placeholder || " ") : placeholder}
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			"dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 h-8 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors file:h-6 file:text-sm file:font-medium focus-visible:ring-3 aria-invalid:ring-3 md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
			className,
      floating && "floating-control"
		)}
		{type}
		bind:value
		{...restProps}
	/>
{/if}

{/snippet}

{#if floating}
  <div class="floating-input" class:always-raised={alwaysRaised}>
    {@render control()}
    <fieldset aria-hidden="true"><legend><span>{label}</span></legend></fieldset>
    <label for={inputId}>{label}</label>
  </div>
{:else}
  {@render control()}
{/if}

<style>
  .floating-input { --floating-border-width: 1px; position: relative; width: 100%; min-width: 0; }
  .floating-input :global(.floating-control) { border-color: transparent; box-shadow: none; }
  fieldset {
    position: absolute; inset: -0.5rem 0 0; margin: 0; padding: 0 calc(0.625rem - 0.25rem - var(--floating-border-width));
    border: var(--floating-border-width) solid var(--color-input); border-radius: var(--radius-lg);
    pointer-events: none; min-width: 0;
  }
  legend { padding: 0; height: 1rem; max-width: 0; overflow: hidden; font-size: 0.75rem; white-space: nowrap; transition: max-width 150ms ease; }
  legend span { padding: 0 0.25rem; visibility: hidden; }
  label { position: absolute; left: 0.625rem; top: 50%; transform: translateY(-50%); max-width: calc(100% - 1.25rem); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-muted-foreground); font-size: 0.875rem; line-height: 1rem; cursor: text; transition: top 150ms ease, font-size 150ms ease; }
  .floating-input:has(input:focus) label,
  .floating-input:has(input:not(:placeholder-shown)) label,
  .floating-input:has(input:autofill) label,
  .always-raised label { top: 0; font-size: 0.75rem; }
  .floating-input:has(input:focus) legend,
  .floating-input:has(input:not(:placeholder-shown)) legend,
  .floating-input:has(input:autofill) legend,
  .always-raised legend { max-width: 100%; }
  .floating-input:has(input:focus) { --floating-border-width: 2px; }
  .floating-input:has(input:focus) fieldset { border-color: var(--color-ring); }
  .floating-input:has(input:focus) label { color: var(--color-foreground); }
  .floating-input:has(input[aria-invalid="true"]) fieldset { border-color: var(--color-destructive); }
  .floating-input:has(input[aria-invalid="true"]) label { color: var(--color-destructive); }
  .floating-input:has(input:disabled) label { opacity: 0.5; cursor: not-allowed; }
  .floating-input:has(input:disabled) fieldset { opacity: 0.5; }
  .floating-input :global(input:not(:focus)::placeholder) { color: transparent; }
  @media (prefers-reduced-motion: reduce) { label, legend { transition: none; } }
</style>
