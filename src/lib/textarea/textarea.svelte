<script lang="ts">
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";
import type { HTMLTextareaAttributes } from "svelte/elements";

type Props = WithoutChildren<WithElementRef<HTMLTextareaAttributes>> & {
  label?: string;
};

let {
  label,
  id,
  placeholder,
  ref = $bindable(null),
  value = $bindable(),
  class: className,
  "data-slot": dataSlot = "textarea",
  ...restProps
}: Props = $props();
const generatedId = $props.id();
const textareaId = $derived(id ?? (label ? generatedId : undefined));
const floating = $derived(Boolean(label));
</script>

{#snippet control()}
<textarea
	id={textareaId}
	placeholder={floating ? (placeholder || " ") : placeholder}
	bind:this={ref}
	data-slot={dataSlot}
	class={cn(
		"border-input dark:bg-input/30 focus-visible:border-ring focus-visible:bg-ring/[0.04] aria-invalid:border-destructive aria-invalid:bg-destructive/[0.05] disabled:bg-input/50 dark:disabled:bg-input/80 rounded-lg border bg-transparent px-2.5 py-2 text-base transition-colors md:text-sm placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full outline-none disabled:cursor-not-allowed disabled:opacity-50",
		floating && "floating-control min-h-20 pt-4",
		className
	)}
	bind:value
	{...restProps}
></textarea>
{/snippet}

{#if floating}
  <div class="floating-textarea">
    {@render control()}
    <fieldset aria-hidden="true"><legend><span>{label}</span></legend></fieldset>
    <label for={textareaId}>{label}</label>
  </div>
{:else}
  {@render control()}
{/if}

<style>
  .floating-textarea { --floating-outline: var(--color-input); position: relative; width: 100%; min-width: 0; interpolate-size: allow-keywords; }
  .floating-textarea :global(.floating-control) { border-color: transparent; background-clip: padding-box; box-shadow: none; resize: vertical; }
  fieldset { position: absolute; inset: -0.5rem 0 0; margin: 0; padding: 0 calc(0.75rem - 0.25rem - 1px); border: 1px solid var(--floating-outline); border-radius: var(--radius-lg); pointer-events: none; min-width: 0; }
  legend { width: 0; max-width: 100%; height: 1rem; overflow: hidden; padding: 0; font-size: 0.75rem; white-space: nowrap; transition: width 280ms cubic-bezier(0.16, 1, 0.3, 1); }
  legend span { padding: 0 0.25rem; visibility: hidden; }
  label { position: absolute; left: 0.75rem; top: 1.25rem; transform: translateY(-50%); max-width: calc(100% - 1.5rem); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-muted-foreground); font-size: 0.875rem; line-height: 1rem; cursor: text; transition: top 180ms cubic-bezier(0.2, 0, 0, 1), font-size 180ms cubic-bezier(0.2, 0, 0, 1), color 150ms ease; }
  .floating-textarea:has(textarea:focus) label,
  .floating-textarea:has(textarea:not(:placeholder-shown)) label,
  .floating-textarea:has(textarea:autofill) label { top: 0; font-size: 0.75rem; }
  .floating-textarea:has(textarea:focus) legend,
  .floating-textarea:has(textarea:not(:placeholder-shown)) legend,
  .floating-textarea:has(textarea:autofill) legend { width: max-content; }
  .floating-textarea:has(textarea:focus-visible) { --floating-outline: var(--color-ring); }
  .floating-textarea:has(textarea[aria-invalid="true"]) { --floating-outline: var(--color-destructive); }
  .floating-textarea:has(textarea:focus) label { color: var(--color-ring); }
  .floating-textarea:has(textarea[aria-invalid="true"]) label { color: var(--color-destructive); }
  .floating-textarea:has(textarea:disabled) label { opacity: 0.5; cursor: not-allowed; }
  .floating-textarea :global(textarea:not(:focus)::placeholder) { color: transparent; }
  @media (prefers-reduced-motion: reduce) { label, legend { transition: none; } }
</style>
