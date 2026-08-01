<script lang="ts">
import CheckIcon from "@lucide/svelte/icons/check";
import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
import PlusIcon from "@lucide/svelte/icons/plus";
import { Portal, Select as SelectPrimitive } from "bits-ui";
import { tick, type Snippet } from "svelte";
import { cn } from "../utils.js";

export interface SelectSearchableOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

type SelectRootProps = Omit<SelectPrimitive.RootProps, "onValueChange" | "type" | "value"> & {
  type?: "single";
  value?: string;
  onValueChange?: (value: string) => void;
  searchable?: boolean;
  freeText?: boolean;
  options?: readonly SelectSearchableOption[];
  id?: string;
  name?: string;
  placeholder?: string;
  emptyLabel?: string;
  contentSide?: "bottom" | "top";
  contentAlign?: "start" | "end";
  size?: "sm" | "default";
  class?: string;
  ariaLabel?: string;
  maxLength?: number;
  leading?: Snippet;
};

let {
  open = $bindable(false),
  value = $bindable(""),
  type = "single",
  disabled = false,
  searchable = false,
  freeText = false,
  options = [],
  id,
  name,
  placeholder = "選択してください",
  emptyLabel = "一致する候補がありません。",
  contentSide = "bottom",
  contentAlign = "start",
  size = "default",
  class: className,
  ariaLabel,
  maxLength,
  leading,
  onValueChange,
  ...restProps
}: SelectRootProps = $props();

let inputText = $state("");
let searchDirty = $state(false);
let inputElement = $state<HTMLInputElement | null>(null);
let triggerElement = $state<HTMLDivElement | null>(null);
let listboxStyle = $state("");
let portalTarget = $state<Element | string>("body");

const selectedOption = $derived(options.find((option) => option.value === value));
const selectedLabel = $derived(freeText ? (value.trim() === "" ? placeholder : value) : (selectedOption?.label ?? placeholder));
const hasSelectedValue = $derived(freeText ? value.trim() !== "" : selectedOption !== undefined);
const normalizedInputText = $derived(inputText.trim());
const hasExactFreeTextOption = $derived(options.some((option) => option.label === normalizedInputText));
const filteredOptions = $derived.by(() => {
  const keyword = searchDirty ? inputText.trim().toLowerCase() : "";

  if (keyword === "") {
    return options;
  }

  return options.filter((option) => `${option.label} ${option.description ?? ""}`.toLowerCase().includes(keyword));
});

$effect(() => {
  if (!open) {
    return;
  }

  void tick().then(updateSearchableListPosition);

  const handleLayoutChange = () => {
    updateSearchableListPosition();
  };

  window.addEventListener("resize", handleLayoutChange);
  document.addEventListener("scroll", handleLayoutChange, true);

  return () => {
    window.removeEventListener("resize", handleLayoutChange);
    document.removeEventListener("scroll", handleLayoutChange, true);
  };
});

function focusSearchInput(): void {
  if (disabled) {
    return;
  }

  open = true;
  searchDirty = false;
  inputText = freeText ? value : "";
  void tick().then(updateSearchableListPosition);
}

function updateSearchText(event: Event): void {
  if (event.currentTarget instanceof HTMLInputElement) {
    inputText = event.currentTarget.value;
    searchDirty = true;
    open = true;
    void tick().then(updateSearchableListPosition);
  }
}

function closeWhenFocusLeaves(event: FocusEvent): void {
  if (!(event.currentTarget instanceof HTMLElement)) {
    return;
  }

  if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
    return;
  }

  if (freeText && searchDirty) {
    applyFreeTextValue(inputText);
    return;
  }

  open = false;
  inputText = "";
  searchDirty = false;
}

function applyFreeTextValue(text: string): void {
  value = text.trim();
  inputText = "";
  searchDirty = false;
  open = false;
  onValueChange?.(value);
  inputElement?.blur();
  setTimeout(() => inputElement?.blur(), 0);
}

function selectSearchableOption(event: PointerEvent, option: SelectSearchableOption): void {
  event.preventDefault();

  if (option.disabled) {
    return;
  }

  value = freeText ? option.label : option.value;
  inputText = "";
  searchDirty = false;
  open = false;
  onValueChange?.(value);
  inputElement?.blur();
  setTimeout(() => inputElement?.blur(), 0);
}

function applyFreeTextBeforeBlur(event: PointerEvent): void {
  event.preventDefault();
  applyFreeTextValue(inputText);
}

function applyFreeTextOnEnter(event: KeyboardEvent): void {
  if (!freeText || event.key !== "Enter" || event.isComposing || event.keyCode === 229) {
    return;
  }

  event.preventDefault();
  applyFreeTextValue(inputText);
}

function applyFreeTextOnBlur(): void {
  if (freeText && searchDirty) {
    applyFreeTextValue(inputText);
  }
}

function toggleSearchableOptions(event: PointerEvent): void {
  event.preventDefault();

  if (disabled) {
    return;
  }

  open = !open;
  if (open) {
    inputElement?.focus();
    void tick().then(updateSearchableListPosition);
  }
}

function updateSearchableListPosition(): void {
  if (!triggerElement || typeof window === "undefined") {
    return;
  }

  const rect = triggerElement.getBoundingClientRect();
  const dialogContent = triggerElement.closest('[data-slot="dialog-content"]');
  const target = dialogContent ?? "body";
  portalTarget = target;
  const viewportPadding = 8;
  const sideOffset = 4;
  const listWidth = Math.max(rect.width, 144);
  const bottomSpace = window.innerHeight - rect.bottom - viewportPadding - sideOffset;
  const topSpace = rect.top - viewportPadding - sideOffset;
  const shouldOpenTop = contentSide === "top" || (contentSide === "bottom" && bottomSpace < 144 && topSpace > bottomSpace);
  const availableHeight = Math.max(96, Math.min(256, shouldOpenTop ? topSpace : bottomSpace));
  const left =
    contentAlign === "end"
      ? Math.min(Math.max(rect.right - listWidth, viewportPadding), window.innerWidth - listWidth - viewportPadding)
      : Math.min(Math.max(rect.left, viewportPadding), window.innerWidth - listWidth - viewportPadding);

  if (dialogContent instanceof HTMLElement) {
    const containerRect = dialogContent.getBoundingClientRect();
    const relativeLeft = left - containerRect.left;
    const relativeTop = shouldOpenTop ? rect.top - containerRect.top - sideOffset : rect.bottom - containerRect.top + sideOffset;
    const transform = shouldOpenTop ? "transform:translateY(-100%);" : "";
    listboxStyle = `position:absolute;left:${relativeLeft}px;top:${relativeTop}px;${transform}width:${listWidth}px;max-height:${availableHeight}px;`;
    return;
  }

  const vertical = shouldOpenTop
    ? `bottom:${Math.max(window.innerHeight - rect.top + sideOffset, viewportPadding)}px;`
    : `top:${Math.min(rect.bottom + sideOffset, window.innerHeight - viewportPadding)}px;`;
  listboxStyle = `position:fixed;left:${left}px;${vertical}width:${listWidth}px;max-height:${availableHeight}px;`;
}
</script>

{#if searchable}
  <div class="relative" onfocusout={closeWhenFocusLeaves}>
    {#if name}
      <input type="hidden" {name} value={value} />
    {/if}
    <div
      bind:this={triggerElement}
      data-slot="select-trigger"
      data-size={size}
      data-placeholder={!hasSelectedValue}
      data-disabled={disabled ? "" : undefined}
      class={cn(
        "border-input data-placeholder:text-muted-foreground dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/50 dark:hover:bg-input/50 gap-1.5 rounded-lg border bg-transparent py-2 pr-2 pl-2.5 text-sm transition-colors focus-within:ring-3 data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] flex w-fit items-center justify-between whitespace-nowrap outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
    >
      {#if leading}
        <span class="flex shrink-0 items-center [&_svg:not([class*='size-'])]:size-4">
          {@render leading()}
        </span>
      {/if}
      <input
        bind:this={inputElement}
        {id}
        class={cn(
          "min-w-0 flex-1 bg-transparent p-0 text-sm outline-none placeholder:text-foreground disabled:cursor-not-allowed",
          !hasSelectedValue && "placeholder:text-muted-foreground"
        )}
        value={inputText}
        placeholder={selectedLabel}
        autocomplete="off"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={open ? "select-searchable-listbox" : undefined}
        maxlength={maxLength}
        {disabled}
        onfocus={focusSearchInput}
        oninput={updateSearchText}
        onkeydown={applyFreeTextOnEnter}
        onblur={applyFreeTextOnBlur}
      />
      <button
        type="button"
        class="flex size-4 shrink-0 items-center justify-center text-muted-foreground disabled:cursor-not-allowed"
        aria-label="候補を表示"
        {disabled}
        onpointerdown={toggleSearchableOptions}
      >
        <ChevronDownIcon class="size-4" aria-hidden="true" />
      </button>
    </div>

    {#if open}
      <Portal to={portalTarget}>
        <div
          id="select-searchable-listbox"
          role="listbox"
          style={listboxStyle}
          class="pointer-events-auto z-[70] min-w-36 overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
        >
          {#if freeText && searchDirty && normalizedInputText !== "" && !hasExactFreeTextOption}
            <button
              type="button"
              role="option"
              aria-selected={normalizedInputText === value}
              class="flex w-full min-w-0 items-center gap-1.5 rounded-md border border-dashed px-1.5 py-1 text-left text-sm outline-hidden hover:bg-accent hover:text-accent-foreground"
              onpointerdown={applyFreeTextBeforeBlur}
            >
              <PlusIcon class="size-4 text-muted-foreground" aria-hidden="true" />
              <span class="min-w-0 flex-1 truncate">「{normalizedInputText}」を選択</span>
            </button>
          {/if}
          {#each filteredOptions as option (option.value)}
            <button
              type="button"
              role="option"
              aria-selected={(freeText ? option.label : option.value) === value}
              disabled={option.disabled}
              class="relative flex w-full min-w-0 items-start gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-left text-sm outline-hidden hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
              onpointerdown={(event) => selectSearchableOption(event, option)}
            >
              <span class="min-w-0 flex-1">
                <span class="block truncate">{option.label}</span>
                {#if option.description}
                  <span class="block truncate text-muted-foreground">{option.description}</span>
                {/if}
              </span>
              <span class="absolute end-2 flex size-3.5 items-center justify-center">
                {#if (freeText ? option.label : option.value) === value}
                  <CheckIcon class="size-4" aria-hidden="true" />
                {/if}
              </span>
            </button>
          {:else}
            <p class="rounded-md px-2 py-3 text-sm text-muted-foreground">{emptyLabel}</p>
          {/each}
        </div>
      </Portal>
    {/if}
  </div>
{:else}
  <SelectPrimitive.Root bind:open bind:value={value as never} {type} {name} {disabled} {onValueChange} {...restProps} />
{/if}
