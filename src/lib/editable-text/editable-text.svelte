<script lang="ts">
import { tick } from "svelte";
import type { HTMLButtonAttributes, HTMLInputAttributes } from "svelte/elements";
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";

type EditableTextCommit = {
  value: string;
  previousValue: string;
};

type EditableTextCancel = {
  value: string;
};

type InputAttributes = Omit<HTMLInputAttributes, "class" | "disabled" | "onblur" | "onkeydown" | "type" | "value">;

type Props = WithoutChildren<WithElementRef<Omit<HTMLButtonAttributes, "type" | "value">, HTMLButtonElement>> & {
  value?: string;
  placeholder?: string;
  inputClass?: string;
  inputProps?: InputAttributes;
  commitOnBlur?: boolean;
  selectOnEdit?: boolean;
  onCommit?: (detail: EditableTextCommit) => void;
  onCancel?: (detail: EditableTextCancel) => void;
};

let {
  ref = $bindable(null),
  value = $bindable(""),
  placeholder = "未設定",
  inputClass,
  inputProps,
  commitOnBlur = true,
  selectOnEdit = true,
  onCommit,
  onCancel,
  disabled,
  class: className,
  "aria-label": ariaLabel,
  "data-slot": dataSlot = "editable-text",
  ...restProps
}: Props = $props();

let inputRef: HTMLInputElement | null = $state(null);
let editing = $state(false);
let draftValue = $state("");

let isEmpty = $derived(value.trim().length === 0);
let displayValue = $derived(isEmpty ? placeholder : value);

async function startEditing() {
  if (disabled) return;

  draftValue = value;
  editing = true;

  await tick();
  inputRef?.focus();

  if (selectOnEdit) {
    inputRef?.select();
  }
}

function commitEditing() {
  const previousValue = value;

  editing = false;
  value = draftValue;

  if (draftValue !== previousValue) {
    onCommit?.({ value: draftValue, previousValue });
  }
}

function cancelEditing() {
  editing = false;
  draftValue = value;
  onCancel?.({ value });
}

function handleInputKeydown(event: KeyboardEvent) {
  if (event.isComposing) return;

  if (event.key === "Enter") {
    event.preventDefault();
    commitEditing();
  }

  if (event.key === "Escape") {
    event.preventDefault();
    cancelEditing();
  }
}

function handleInputBlur() {
  if (commitOnBlur) {
    commitEditing();
    return;
  }

  cancelEditing();
}
</script>

{#if editing}
	<input
		bind:this={inputRef}
		{...inputProps}
		data-slot={`${dataSlot}-input`}
		class={cn(
			"bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-6 w-full min-w-0 rounded-sm border border-transparent px-0.5 py-0 text-sm leading-6 transition-colors focus-visible:ring-3 aria-invalid:ring-3 outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
			inputClass
		)}
		type="text"
		aria-label={ariaLabel ?? placeholder}
		{disabled}
		bind:value={draftValue}
		onkeydown={handleInputKeydown}
		onblur={handleInputBlur}
	/>
{:else}
	<button
		bind:this={ref}
		{...restProps}
		data-slot={dataSlot}
		class={cn(
			"focus-visible:border-ring focus-visible:ring-ring/50 -mx-0.5 inline-flex h-6 max-w-full items-center truncate rounded-sm border border-transparent px-0.5 py-0 text-left text-sm leading-6 text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50",
			isEmpty && "text-muted-foreground",
			className
		)}
		type="button"
		aria-label={ariaLabel}
		{disabled}
		onclick={startEditing}
	>
		<span class="truncate">{displayValue}</span>
	</button>
{/if}
