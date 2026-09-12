<script module lang="ts">
import type { Snippet } from "svelte";
import type { HTMLButtonAttributes, HTMLInputAttributes, HTMLTextareaAttributes } from "svelte/elements";
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";

export type EditableTextCommit = {
  value: string;
  previousValue: string;
};

export type EditableTextCancel = {
  value: string;
};

type InputAttributes = Omit<HTMLInputAttributes, "class" | "disabled" | "onblur" | "onkeydown" | "type" | "value">;
type TextareaAttributes = Omit<HTMLTextareaAttributes, "class" | "disabled" | "onblur" | "oninput" | "onkeydown" | "value">;
type EditableTextEditOn = "click" | "doubleClick";

/** Spread onto a button or a component forwarding button attributes and attachments. */
export type EditableTextTriggerProps = Pick<HTMLButtonAttributes, "class" | "type" | "disabled" | "aria-label"> & {
  "data-slot": string;
  onclick: (event: MouseEvent) => void;
  ondblclick: (event: MouseEvent) => void;
  onkeydown: (event: KeyboardEvent) => void;
} & Record<string, unknown>;

export type EditableTextProps = WithoutChildren<WithElementRef<Omit<HTMLButtonAttributes, "type" | "value">, HTMLButtonElement>> & {
  value?: string;
  placeholder?: string;
  inputClass?: string;
  inputProps?: InputAttributes;
  multiline?: boolean;
  textareaProps?: TextareaAttributes;
  /** doubleClick keeps single-click actions; F2 starts keyboard editing. */
  editOn?: EditableTextEditOn;
  trigger?: Snippet<[{ value: string; props: EditableTextTriggerProps }]>;
  commitOnBlur?: boolean;
  selectOnEdit?: boolean;
  onCommit?: (detail: EditableTextCommit) => void;
  onCancel?: (detail: EditableTextCancel) => void;
};

</script>

<script lang="ts">
import { onDestroy, tick } from "svelte";
import { createAttachmentKey } from "svelte/attachments";

let {
  ref = $bindable(null),
  value = $bindable(""),
  placeholder = "未設定",
  inputClass,
  inputProps,
  multiline = false,
  textareaProps,
  editOn = "click",
  trigger,
  commitOnBlur = true,
  selectOnEdit = true,
  onCommit,
  onCancel,
  disabled,
  class: className,
  onclick,
  onkeydown,
  ondblclick,
  "aria-label": ariaLabel,
  "data-slot": dataSlot = "editable-text",
  ...restProps
}: EditableTextProps = $props();

let inputRef: HTMLInputElement | HTMLTextAreaElement | null = $state(null);
let editing = $state(false);
let draftValue = $state("");
let editingRect = $state<DOMRect>();
const triggerAttachment = createAttachmentKey();
let clickTimer: ReturnType<typeof setTimeout> | undefined;

let isEmpty = $derived(value.trim().length === 0);
let displayValue = $derived(isEmpty ? placeholder : value);

const editorProps = $derived({
  "data-slot": `${dataSlot}-${multiline ? "textarea" : "input"}`,
  class: cn(
    "-mx-0.5 w-full min-w-0 border-0 bg-transparent px-0.5 py-0 text-sm leading-6 outline-none aria-invalid:text-destructive disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    multiline ? "min-h-6 resize-none overflow-hidden" : "h-6",
    inputClass
  ),
  "aria-label": ariaLabel ?? placeholder,
  disabled,
  onkeydown: handleInputKeydown,
  onblur: handleInputBlur,
});

function attachTrigger(node: HTMLButtonElement) {
  ref = node;
  return () => { ref = null; };
}

const triggerProps: EditableTextTriggerProps = $derived({
  [triggerAttachment]: attachTrigger,
  ...restProps,
  class: className,
  type: "button" as const,
  disabled,
  "aria-label": ariaLabel,
  "data-slot": dataSlot,
  onclick: handleDisplayClick,
  ondblclick: handleDisplayDoubleClick,
  onkeydown: handleDisplayKeydown,
});

async function startEditing(event: MouseEvent | KeyboardEvent) {
  if (disabled || editing || event.defaultPrevented) return;

  clearTimeout(clickTimer);
  editingRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  draftValue = value;
  editing = true;

  await tick();
  if (!editing || disabled) return;
  resizeTextarea();
  inputRef?.focus();

  if (selectOnEdit) {
    inputRef?.select();
  }
}

async function finishEditing(commit: boolean, restoreFocus = false) {
  if (!editing) return;
  editing = false;

  if (commit) {
    const previousValue = value;
    value = draftValue;
    if (value !== previousValue) onCommit?.({ value, previousValue });
  } else {
    draftValue = value;
    onCancel?.({ value });
  }

  if (restoreFocus) {
    await tick();
    if (!editing && !disabled) ref?.focus({ preventScroll: true });
  }
}

function handleInputKeydown(event: KeyboardEvent) {
  // Safari may end composition before dispatching its confirming Enter.
  if (event.isComposing || event.keyCode === 229) return;
  const commit = event.key === "Enter" && (!multiline || event.metaKey || event.ctrlKey);
  if (!commit && event.key !== "Escape") return;
  event.preventDefault();
  event.stopPropagation();
  void finishEditing(commit, true);
}

function resizeTextarea() {
  if (!multiline || !(inputRef instanceof HTMLTextAreaElement)) return;
  inputRef.style.height = "auto";
  inputRef.style.height = `${inputRef.scrollHeight}px`;
}

function handleInputBlur() {
  void finishEditing(commitOnBlur && !disabled);
}

function handleDisplayKeydown(event: KeyboardEvent) {
  onkeydown?.(event as KeyboardEvent & { currentTarget: HTMLButtonElement });
  if (editOn !== "doubleClick" || event.key !== "F2" || event.defaultPrevented || disabled) return;
  void startEditing(event);
  event.preventDefault();
}

function handleDisplayClick(event: MouseEvent) {
  if (disabled) return;
  if (editOn === "click") {
    onclick?.(event as MouseEvent & { currentTarget: HTMLButtonElement });
    void startEditing(event);
    return;
  }

  if (event.detail === 0) {
    onclick?.(event as MouseEvent & { currentTarget: HTMLButtonElement });
    return;
  }

  clearTimeout(clickTimer);
  const target = event.currentTarget as HTMLElement;
  if (onclick) {
    clickTimer = setTimeout(() => {
      if (!disabled && !editing && target.isConnected) onclick?.(event as MouseEvent & { currentTarget: HTMLButtonElement });
    }, 250);
  }
}

function handleDisplayDoubleClick(event: MouseEvent) {
  clearTimeout(clickTimer);
  if (disabled) return;
  ondblclick?.(event as MouseEvent & { currentTarget: HTMLButtonElement });
  if (editOn === "doubleClick") void startEditing(event);
}

$effect(() => {
  if (disabled) {
    clearTimeout(clickTimer);
    if (editing) void finishEditing(false);
  }
});

onDestroy(() => clearTimeout(clickTimer));
</script>

{#if editing}
	{#if multiline}
		<textarea
			bind:this={inputRef}
			{...textareaProps}
			{...editorProps}
			style:width={editingRect && `${editingRect.width}px`}
			style:height={editingRect && `${editingRect.height}px`}
			rows={textareaProps?.rows ?? 1}
			bind:value={draftValue}
			oninput={resizeTextarea}
		></textarea>
	{:else}
		<input
			bind:this={inputRef}
			{...inputProps}
			{...editorProps}
			style:width={editingRect && `${editingRect.width}px`}
			style:height={editingRect && `${editingRect.height}px`}
			type="text"
			bind:value={draftValue}
		/>
	{/if}
{:else if trigger}
  {@render trigger({ value: displayValue, props: triggerProps })}
{:else}
	<button
		{...triggerProps}
		data-slot={dataSlot}
		class={cn(
			"focus-visible:ring-ring/40 -mx-0.5 inline-flex w-fit! max-w-full rounded-sm border-0 px-0.5 py-0 text-left text-sm leading-6 text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
			multiline ? "min-h-6 items-start" : "h-6 items-center truncate",
			isEmpty && "text-muted-foreground",
			className
		)}
	>
		<span class={multiline ? "whitespace-pre-wrap break-words" : "truncate"}>{displayValue}</span>
	</button>
{/if}
