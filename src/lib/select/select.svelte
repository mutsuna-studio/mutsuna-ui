<script lang="ts" module>
export type { SelectSearchableOption } from "../internal/select/types.js";
</script>

<script lang="ts">
import { Select as SelectPrimitive } from "bits-ui";
import { setSelectLabel } from "../internal/select/label-context.js";
import SearchableSelect from "../internal/select/searchable-select.svelte";
import type { SelectRootProps } from "../internal/select/types.js";

let {
  open = $bindable(false),
  value = $bindable(""),
  type = "single",
  disabled = false,
  searchable = false,
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
  ...restProps
}: SelectRootProps = $props();
setSelectLabel({ get label() { return label; }, get id() { return id; }, get invalid() { return ariaInvalid; }, get describedby() { return ariaDescribedby; } });
</script>

{#if searchable}
  <SearchableSelect bind:open bind:value {disabled} {freeText} {options} {label} {id} {name}
    {placeholder} {emptyLabel} {contentSide} {contentAlign} {size} class={className}
    {ariaLabel} aria-invalid={ariaInvalid} aria-describedby={ariaDescribedby} {maxLength} {leading} {onValueChange} />
{:else}
  <SelectPrimitive.Root bind:open bind:value={value as never} {type} {name} {disabled} {onValueChange} {...restProps} />
{/if}
