<script module lang="ts">
export type TemplateInsertOption<Payload = unknown> = {
  readonly id: string;
  readonly name: string;
  readonly payload: Payload;
};

export type TemplateInsertTemplate<Payload = unknown, Category extends string = string> = {
  readonly id: string;
  readonly name: string;
  readonly category: Category;
  readonly payload: Payload;
};

export type TemplateInsertExistingOption = {
  readonly id: string;
  readonly name: string;
  readonly sourceId: string;
};

export type TemplateInsertMenuProps<Payload = unknown, Category extends string = string> = {
  readonly templates: readonly TemplateInsertTemplate<Payload, Category>[];
  readonly category: Category;
  readonly onApply: (payload: Payload) => void;
  readonly onSelectExisting?: (sourceId: string) => void;
  readonly label?: string;
  readonly defaultTemplates?: readonly TemplateInsertOption<Payload>[];
  readonly existingOptions?: readonly TemplateInsertExistingOption[];
};
</script>

<script lang="ts" generics="Payload, Category extends string">
import { Select as SelectRoot, SelectContent, SelectItem, SelectTrigger } from "@mutsuna/ui/select";

const { templates, category, onApply, onSelectExisting, label = "テンプレート挿入", defaultTemplates = [], existingOptions = [] }: TemplateInsertMenuProps<
  Payload,
  Category
> = $props();

const candidates = $derived([
  ...existingOptions,
  ...defaultTemplates,
  ...templates
    .filter((template) => template.category === category)
    .map((template) => ({
      id: template.id,
      name: template.name,
      payload: template.payload,
    })),
]);
let selectedId = $state("");

function applySelected(value: string): void {
  selectedId = value;
  const template = candidates.find((candidate) => candidate.id === value);

  if (template === undefined) {
    return;
  }

  if ("sourceId" in template) {
    onSelectExisting?.(template.sourceId);
  } else {
    onApply(template.payload);
  }
  selectedId = "";
}
</script>

{#if candidates.length > 0}
  <SelectRoot type="single" bind:value={selectedId} onValueChange={applySelected}>
    <SelectTrigger class="min-w-48">
      <span class="truncate">{selectedId === "" ? label : candidates.find((template) => template.id === selectedId)?.name}</span>
    </SelectTrigger>
    <SelectContent>
      {#each candidates as template (template.id)}
        <SelectItem value={template.id}>{template.name}</SelectItem>
      {/each}
    </SelectContent>
  </SelectRoot>
{/if}
