<script lang="ts">
import FloatingField from "../internal/floating-field.svelte";
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
        data-floating-control={floating ? "" : undefined}
		class={cn(
			"dark:bg-input/30 border-input focus-visible:border-ring focus-visible:bg-ring/[0.04] aria-invalid:border-destructive aria-invalid:bg-destructive/[0.05] disabled:bg-input/50 dark:disabled:bg-input/80 h-8 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors file:h-6 file:text-sm file:font-medium md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
			floating && "floating-control h-10",
			className
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
        data-floating-control={floating ? "" : undefined}
		class={cn(
			"dark:bg-input/30 border-input focus-visible:border-ring focus-visible:bg-ring/[0.04] aria-invalid:border-destructive aria-invalid:bg-destructive/[0.05] disabled:bg-input/50 dark:disabled:bg-input/80 h-8 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors file:h-6 file:text-sm file:font-medium md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
			floating && "floating-control h-10",
			className
		)}
		{type}
		bind:value
		{...restProps}
	/>
{/if}

{/snippet}

{#if floating}
  <FloatingField label={label!} for={inputId!} raised={alwaysRaised}>
    {@render control()}
  </FloatingField>
{:else}
  {@render control()}
{/if}
