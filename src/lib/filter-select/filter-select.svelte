<script lang="ts" module>
export interface FilterSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
</script>

<script lang="ts">
import * as Popover from "@mutsuna/ui/popover";
import { Input } from "@mutsuna/ui/input";
import { Checkbox } from "@mutsuna/ui/checkbox";
import ListFilterIcon from "@lucide/svelte/icons/list-filter";
import Button from "@mutsuna/ui/button/button.svelte";
import {
  DropdownMenu,
  DropdownMenuCheckboxGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@mutsuna/ui/dropdown-menu";
import {
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@mutsuna/ui/select";
import { cn } from "../utils.js";

interface Props {
  /** 検索付き複数選択の枠内ラベル。 */
  label?: string;
  searchable?: boolean;
  disablePortal?: boolean;
  searchPlaceholder?: string;
  emptyLabel?: string;
  type?: "single" | "multiple";
  value?: string;
  values?: string[];
  options: readonly FilterSelectOption[];
  ariaLabel: string;
  size?: "sm" | "default";
  class?: string;
  disabled?: boolean;
  fallbackLabel?: string;
  placeholderLabel?: string;
  clearLabel?: string;
  selectedCountSuffix?: string;
}

let {
  label,
  searchable = false,
  disablePortal = false,
  searchPlaceholder = "候補を検索",
  emptyLabel = "一致する候補がありません",
  type = "multiple",
  value = $bindable(""),
  values = $bindable([]),
  options,
  ariaLabel,
  size = "sm",
  class: className = "w-full sm:w-40",
  disabled = false,
  fallbackLabel = "選択してください",
  placeholderLabel = "フィルター",
  clearLabel = "選択を解除",
  selectedCountSuffix = "件選択",
}: Props = $props();

let search = $state("");
let open = $state(false);
const normalize = (text: string) => text.normalize("NFKC").toLocaleLowerCase().trim();
const visibleOptions = $derived(options.filter(option => values.includes(option.value) || normalize(option.label).includes(normalize(search))));
const selectedLabel = $derived(options.find((option) => option.value === value)?.label ?? fallbackLabel);
const selectedOptions = $derived(options.filter((option) => values.includes(option.value)));
const summary = $derived(selectedOptions.length ? `${selectedOptions.slice(0, 2).map(option => option.label).join("、")}${selectedOptions.length > 2 ? ` ほか${selectedOptions.length - 2}件` : ""}` : placeholderLabel);
const isMultipleEmpty = $derived(values.length === 0);
const isSingleEmpty = $derived(value === "");
const multipleLabel = $derived.by(() => {
  if (selectedOptions.length === 0) {
    return placeholderLabel;
  }

  if (selectedOptions.length === 1) {
    return selectedOptions[0]?.label ?? fallbackLabel;
  }

  return `${selectedOptions.length}${selectedCountSuffix}`;
});
</script>

{#if type === "multiple" && searchable}
  <Popover.Root bind:open onOpenChange={next => { if (next) search = ""; }}>
    <Popover.Trigger disabled={disabled}>
      {#snippet child({ props })}
        <div class={label ? cn("floating-select", className) : "contents"}>
          <Button {...props} type="button" variant="outline" {size} class={cn("justify-between", label ? "floating-select-control h-10 w-full" : className)} aria-label={`${ariaLabel}、${values.length}件選択`} {disabled}>
            <span class="min-w-0 truncate text-left">{summary}</span><span class="shrink-0 text-xs text-muted-foreground">{values.length ? `${values.length}${selectedCountSuffix}` : "選択"}</span>
          </Button>
          {#if label}
            <fieldset aria-hidden="true"><legend><span>{label}</span></legend></fieldset>
            <span class="floating-select-label" aria-hidden="true">{label}</span>
          {/if}
        </div>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content align="start" portalProps={{ disabled: disablePortal }} class="w-72 max-w-[calc(100vw-2rem)]" aria-label={ariaLabel} onEscapeKeydown={event => event.stopPropagation()}>
      <Input onkeydown={event => { if (event.key === "Enter") event.preventDefault(); }} bind:value={search} aria-label={`${ariaLabel}の候補を検索`} placeholder={searchPlaceholder} />
      <div class="max-h-48 overflow-y-auto" role="group" aria-label={`${ariaLabel}の候補`}>
        {#each visibleOptions as option (option.value)}
          <label class="flex min-h-9 items-center gap-2 rounded px-1 text-sm"><Checkbox aria-label={option.label} disabled={option.disabled} checked={values.includes(option.value)} onCheckedChange={checked => values = checked ? [...values, option.value] : values.filter(value => value !== option.value)} /><span class="min-w-0 break-words">{option.label}</span></label>
        {:else}<p class="py-4 text-center text-sm text-muted-foreground">{emptyLabel}</p>{/each}
      </div>
      <div class="flex items-center justify-between border-t pt-2"><span class="text-xs text-muted-foreground">{values.length}{selectedCountSuffix}</span><Button type="button" variant="ghost" size="sm" disabled={!values.length} onclick={() => values = []}>{clearLabel}</Button><Button type="button" variant="outline" size="sm" onclick={() => open = false}>完了</Button></div>
    </Popover.Content>
  </Popover.Root>
{:else if type === "multiple"}
  <DropdownMenu>
    <DropdownMenuTrigger disabled={disabled}>
      {#snippet child({ props })}
        <Button
          {...props}
          type="button"
          variant="outline"
          {size}
          class={cn(className, isMultipleEmpty && "border-dashed text-muted-foreground")}
          aria-label={ariaLabel}
          disabled={disabled}
        >
          <ListFilterIcon aria-hidden="true" />
          <span class="truncate">{multipleLabel}</span>
        </Button>
      {/snippet}
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-48">
      {#if !isMultipleEmpty}
        <DropdownMenuItem onclick={() => (values = [])}>
          {clearLabel}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
      {/if}
      <DropdownMenuCheckboxGroup bind:value={values}>
        {#each options as option (option.value)}
          <DropdownMenuCheckboxItem
            value={option.value}
            disabled={option.disabled}
            closeOnSelect={false}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        {/each}
      </DropdownMenuCheckboxGroup>
    </DropdownMenuContent>
  </DropdownMenu>
{:else}
  <SelectRoot type="single" bind:value {disabled}>
    <SelectTrigger
      {size}
      class={cn(className, isSingleEmpty && "border-dashed text-muted-foreground")}
      aria-label={ariaLabel}
    >
      <ListFilterIcon aria-hidden="true" />
      <span class="truncate">{selectedLabel}</span>
    </SelectTrigger>
    <SelectContent>
      {#each options as option (option.value)}
        <SelectItem value={option.value} disabled={option.disabled}>{option.label}</SelectItem>
      {/each}
    </SelectContent>
  </SelectRoot>
{/if}

<style>
  .floating-select { --floating-outline: var(--color-input); position: relative; min-width: 0; }
  .floating-select :global(.floating-select-control) { border-color: transparent; background-clip: padding-box; box-shadow: none; }
  .floating-select fieldset { position: absolute; inset: -0.5rem 0 0; margin: 0; padding: 0 calc(0.75rem - 0.25rem - 1px); border: 1px solid var(--floating-outline); border-radius: var(--radius-lg); pointer-events: none; min-width: 0; }
  .floating-select legend { width: max-content; max-width: 100%; height: 1rem; overflow: hidden; padding: 0; font-size: 0.75rem; white-space: nowrap; }
  .floating-select legend span { padding: 0 0.25rem; visibility: hidden; }
  .floating-select-label { position: absolute; left: 0.75rem; top: 0; transform: translateY(-50%); max-width: calc(100% - 1.5rem); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-muted-foreground); font-size: 0.75rem; line-height: 1rem; pointer-events: none; }
  .floating-select:has(:global(button:focus-visible)) { --floating-outline: var(--color-ring); }
  .floating-select:has(:global(button:focus-visible)) .floating-select-label { color: var(--color-ring); }
  .floating-select:has(:global(button:disabled)) { opacity: 0.5; }
</style>
