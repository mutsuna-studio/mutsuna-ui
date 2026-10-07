<script lang="ts">
import FloatingField from "../floating-field.svelte";
import CheckIcon from "@lucide/svelte/icons/check";
import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
import PlusIcon from "@lucide/svelte/icons/plus";
import { Portal } from "bits-ui";
import { tick } from "svelte";
import { cn } from "../../utils.js";

import type { SelectRootProps, SelectSearchableOption } from "./types.js";
import { getListPosition, observeListPosition } from "./position.js";
import { nextEnabledIndex } from "./navigation.js";

let {
  open = $bindable(false),
  value = $bindable(""),
  disabled = false,
  freeText = false,
  options = [],
  label,
  id,
  name,
  placeholder = "選択してください",
  emptyLabel = "一致する候補がありません。",
  contentSide = "bottom",
  contentAlign = "start",
  size = "default",
  class: className,
  ariaLabel,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedby,
  maxLength,
  leading,
  onValueChange,
}: SelectRootProps = $props();

const instanceId = $props.id();
const controlId = $derived(id ?? (label ? `${instanceId}-control` : undefined));
const listboxId = `${instanceId}-listbox`;
let activeIndex = $state(-1);
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
  if (disabled) resetSearch();
});

$effect(() => {
  if (!open || disabled || !triggerElement) return;
  return observeListPosition(triggerElement, updateSearchableListPosition);
});

function focusSearchInput(): void {
  if (disabled) {
    return;
  }

  open = true;
  activeIndex = -1;
  searchDirty = false;
  inputText = freeText ? value : "";
  void tick().then(updateSearchableListPosition);
}

function updateSearchText(event: Event): void {
  if (event.currentTarget instanceof HTMLInputElement) {
    inputText = event.currentTarget.value;
    activeIndex = -1;
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

  resetSearch();
}

function resetSearch(): void {
  open = false;
  inputText = "";
  searchDirty = false;
  activeIndex = -1;
}

function commitValue(nextValue: string): void {
  if (disabled) return;
  value = nextValue;
  resetSearch();
  onValueChange?.(value);
}

function selectOption(option: SelectSearchableOption): void {
  if (!option.disabled) commitValue(freeText ? option.label : option.value);
}

function applyFreeTextValue(text: string): void {
  commitValue(text.trim());
}

function handleKeydown(event: KeyboardEvent): void {
  if (disabled || event.isComposing || event.keyCode === 229) return;
  if (event.key === "Escape" && open) {
    event.preventDefault();
    event.stopPropagation();
    resetSearch();
  } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    activeIndex = nextEnabledIndex(filteredOptions, open ? activeIndex : -1, direction);
    open = true;
    void tick().then(() => document.getElementById(`${listboxId}-${activeIndex}`)?.scrollIntoView({ block: "nearest" }));
  } else if (event.key === "Enter" && open) {
    const option = filteredOptions[activeIndex];
    if (option && !option.disabled) {
      event.preventDefault();
      selectOption(option);
    } else if (freeText && searchDirty) {
      event.preventDefault();
      applyFreeTextValue(inputText);
    }
  }
}

function toggleSearchableOptions(): void {
  if (disabled) return;
  const wasOpen = open;
  inputElement?.focus();
  if (wasOpen) resetSearch();
  else open = true;
}

function updateSearchableListPosition(): void {
  if (!triggerElement) return;
  const position = getListPosition(triggerElement, contentSide, contentAlign);
  if (position) {
    portalTarget = position.target;
    listboxStyle = position.style;
  }
}
</script>

  <div class="relative" onfocusout={closeWhenFocusLeaves}>
    {#if name}
      <input type="hidden" {name} value={value} />
    {/if}
    {#snippet control()}
    <div
      bind:this={triggerElement}
      data-slot="select-trigger"
      data-floating-control={label ? "" : undefined}
      data-state={open ? "open" : "closed"}
      data-size={size}
      data-placeholder={!hasSelectedValue}
      data-disabled={disabled ? "" : undefined}
      class={cn(
        "border-input data-placeholder:text-muted-foreground dark:bg-input/30 focus-within:border-ring focus-within:bg-ring/[0.04] dark:hover:bg-input/50 gap-1.5 rounded-lg border bg-transparent py-2 pr-2 pl-2.5 text-sm transition-colors data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] flex w-fit items-center justify-between whitespace-nowrap outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        label && "w-full data-[size=default]:h-10 data-[size=sm]:h-10",
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
        id={controlId}
        class={cn(
          "min-w-0 flex-1 bg-transparent p-0 text-sm outline-none placeholder:text-foreground disabled:cursor-not-allowed",
          !hasSelectedValue && "placeholder:text-muted-foreground"
        )}
        value={inputText}
        placeholder={selectedLabel}
        autocomplete="off"
        role="combobox"
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={open && filteredOptions[activeIndex] && !filteredOptions[activeIndex].disabled ? `${listboxId}-${activeIndex}` : undefined}
        maxlength={maxLength}
        {disabled}
        onfocus={focusSearchInput}
        oninput={updateSearchText}
        onkeydown={handleKeydown}
      />
      <button
        type="button"
        class="flex size-4 shrink-0 items-center justify-center text-muted-foreground disabled:cursor-not-allowed"
        aria-label="候補を表示"
        {disabled}
        onpointerdown={(event) => event.preventDefault()}
        onclick={toggleSearchableOptions}
      >
        <ChevronDownIcon class="size-4" aria-hidden="true" />
      </button>
    </div>

    {/snippet}
    {#if label}
      <FloatingField {label} for={controlId!} raised>{@render control()}</FloatingField>
    {:else}
      {@render control()}
    {/if}

    {#if open}
      <Portal to={portalTarget}>
        <div
          id={listboxId}
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
              tabindex="-1"
              onpointerdown={(event) => event.preventDefault()}
              onclick={() => applyFreeTextValue(inputText)}
            >
              <PlusIcon class="size-4 text-muted-foreground" aria-hidden="true" />
              <span class="min-w-0 flex-1 truncate">「{normalizedInputText}」を選択</span>
            </button>
          {/if}
          {#each filteredOptions as option, index (option.value)}
            <button
              type="button"
              role="option"
              aria-selected={(freeText ? option.label : option.value) === value}
              id={`${listboxId}-${index}`}
              tabindex="-1"
              data-highlighted={index === activeIndex ? "" : undefined}
              disabled={option.disabled}
              class="data-highlighted:bg-accent data-highlighted:text-accent-foreground relative flex w-full min-w-0 items-start gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-left text-sm outline-hidden hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
              onpointerdown={(event) => event.preventDefault()}
              onclick={() => selectOption(option)}
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
