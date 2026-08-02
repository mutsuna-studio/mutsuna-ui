<script lang="ts">
import Checkbox from "@mutsuna/ui/checkbox/checkbox.svelte";
import * as Dialog from "@mutsuna/ui/dialog";
import * as DropdownMenu from "@mutsuna/ui/dropdown-menu";
import Input from "@mutsuna/ui/input/input.svelte";
import Label from "@mutsuna/ui/label/label.svelte";
import { SortableList } from "@mutsuna/ui/sortable-list";
import { Select as SelectRoot, SelectContent, SelectItem, SelectTrigger } from "@mutsuna/ui/select";
import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
import GripVerticalIcon from "@lucide/svelte/icons/grip-vertical";
import ListOrderedIcon from "@lucide/svelte/icons/list-ordered";
import Trash2Icon from "@lucide/svelte/icons/trash-2";
import Badge from "@mutsuna/ui/badge/badge.svelte";
import Button from "@mutsuna/ui/button/button.svelte";
import { EditableText } from "@mutsuna/ui/editable-text";

export type EditorOption = { value: string; label: string };
export type EditorVisibilityOption = { value: string; label: string };
export type EditorField = {
  kind: "fixed" | "category" | "note" | "optional" | "custom";
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "email" | "tel";
  required: boolean;
  enabled: boolean;
  options: EditorOption[];
  visibility?: string;
};

export type FormTemplateEditorProps = {
  fields: EditorField[];
  optionalCatalog?: Readonly<Record<string, EditorField>>;
  customKeyPrefix?: string;
  maxCustomFields?: number;
  lockedOptionValues?: readonly string[];
  visibilityOptions?: readonly EditorVisibilityOption[];
  allowFixedRequired?: boolean;
};

let {
  fields = $bindable(),
  optionalCatalog = {},
  customKeyPrefix = "customField",
  maxCustomFields = 5,
  lockedOptionValues = [],
  visibilityOptions = [],
  allowFixedRequired = false,
}: FormTemplateEditorProps = $props();

let optionDialogField = $state<EditorField | null>(null);
let optionDialogOpen = $state(false);
const availableOptionalKeys = $derived(Object.keys(optionalCatalog).filter((key) => !fields.some((field) => field.key === key)));
const customCount = $derived(fields.filter((field) => field.kind === "custom").length);
const isProtected = (field: EditorField) => field.kind === "fixed" || field.kind === "category" || field.kind === "note";
const isRequiredLocked = (field: EditorField) => (field.kind === "fixed" && !allowFixedRequired) || field.kind === "category";

function addOptional(key: string): void {
  const source = optionalCatalog[key];
  if (source === undefined || fields.some((field) => field.key === key)) return;
  fields.push({ ...source, options: source.options.map((option) => ({ ...option })) });
}

function addCustom(): void {
  if (customCount >= maxCustomFields) return;
  const used = new Set(fields.map((field) => field.key));
  let suffix = 1;
  while (used.has(`${customKeyPrefix}${suffix}`)) suffix += 1;
  fields.push({
    kind: "custom",
    key: `${customKeyPrefix}${suffix}`,
    label: "追加項目",
    type: "text",
    required: false,
    enabled: true,
    options: [],
    visibility: visibilityOptions[0]?.value,
  });
}

function deleteField(key: string): void {
  fields = fields.filter((field) => field.key !== key);
}

function changeType(field: EditorField, value: string): void {
  field.type = value as EditorField["type"];
  if (field.type === "select" && field.options.length === 0) addOption(field);
}

function addOption(field: EditorField): void {
  const maximum = field.kind === "category" ? 20 : 10;
  if (field.options.length >= maximum) return;
  const used = new Set(field.options.map((option) => option.value));
  let suffix = 1;
  while (used.has(`option${suffix}`)) suffix += 1;
  field.options.push({ value: `option${suffix}`, label: "新しい選択肢" });
}

function deleteOption(field: EditorField, option: EditorOption): void {
  if (field.options.length <= 1 || lockedOptionValues.includes(option.value)) return;
  field.options.splice(field.options.indexOf(option), 1);
}
</script>

<div class="flex flex-wrap justify-end gap-2">
  {#if availableOptionalKeys.length > 0 || customCount < maxCustomFields}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>{#snippet child({ props })}<Button {...props} type="button" variant="outline" size="sm">項目を追加</Button>{/snippet}</DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        {#each availableOptionalKeys as key (key)}<DropdownMenu.Item onclick={() => addOptional(key)}>{optionalCatalog[key]?.label}</DropdownMenu.Item>{/each}
        {#if availableOptionalKeys.length > 0 && customCount < maxCustomFields}<DropdownMenu.Separator />{/if}
        {#if customCount < maxCustomFields}<DropdownMenu.Item onclick={addCustom}>自由な質問</DropdownMenu.Item>{/if}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {/if}
</div>

<SortableList bind:items={fields} getKey={(field) => field.key} getLabel={(field) => field.label} class="grid gap-3" itemClass="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border p-3 sm:gap-3">
  {#snippet children(field, _index, controls)}
    {@const protectedField = isProtected(field)}
    <div class="flex items-center gap-1">
      <button class="cursor-grab touch-none rounded-md p-2 text-muted-foreground hover:bg-muted" type="button" aria-label={`${field.label}をドラッグして並べ替え`} {...controls.dragHandleProps}><GripVerticalIcon class="size-4" /></button>
      <div class="flex flex-col"><Button variant="ghost" size="icon-sm" type="button" aria-label="上へ移動" onclick={controls.moveUp} disabled={!controls.canMoveUp}><ChevronUpIcon /></Button><Button variant="ghost" size="icon-sm" type="button" aria-label="下へ移動" onclick={controls.moveDown} disabled={!controls.canMoveDown}><ChevronDownIcon /></Button></div>
    </div>
    <div class="grid min-w-0 gap-2">
      <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <EditableText value={field.label} placeholder="項目名を入力" inputProps={{ maxlength: 120 }} aria-label={`${field.label || "新しい項目"}を編集`} class="min-w-0 w-full" onCommit={(detail) => (field.label = detail.value)} />
        <div class="flex shrink-0 items-center gap-1">
          {#if isRequiredLocked(field)}<Badge variant="outline">必須</Badge>{:else if field.kind === "fixed"}<Badge variant="outline">常時表示</Badge><Label class="cursor-pointer"><Checkbox bind:checked={field.required} />必須</Label>{:else}<Label class="cursor-pointer"><Checkbox bind:checked={field.enabled} />表示</Label><Label class="cursor-pointer"><Checkbox bind:checked={field.required} disabled={!field.enabled} />必須</Label>{/if}
          {#if field.type === "select"}<Button variant="ghost" size="icon-sm" type="button" aria-label="選択肢を編集" onclick={() => { optionDialogField = field; optionDialogOpen = true; }}><ListOrderedIcon /></Button>{/if}
        </div>
      </div>
      {#if field.kind === "custom" || (visibilityOptions.length > 0 && (field.kind === "note" || field.kind === "optional"))}
        <div class="grid gap-2 sm:grid-cols-2">
          {#if field.kind === "custom"}<SelectRoot type="single" value={field.type} onValueChange={(value) => changeType(field, value)}><SelectTrigger class="w-full"><span>{field.type === "text" ? "1行入力" : field.type === "textarea" ? "複数行入力" : field.type === "select" ? "選択式" : "チェック"}</span></SelectTrigger><SelectContent><SelectItem value="text">1行入力</SelectItem><SelectItem value="textarea">複数行入力</SelectItem><SelectItem value="select">選択式</SelectItem><SelectItem value="checkbox">チェック</SelectItem></SelectContent></SelectRoot>{/if}
          {#if visibilityOptions.length > 0}<SelectRoot type="single" value={field.visibility ?? visibilityOptions[0]?.value} onValueChange={(value) => (field.visibility = value)}><SelectTrigger class="w-full"><span>{visibilityOptions.find((option) => option.value === field.visibility)?.label ?? visibilityOptions[0]?.label}</span></SelectTrigger><SelectContent>{#each visibilityOptions as option (option.value)}<SelectItem value={option.value}>{option.label}</SelectItem>{/each}</SelectContent></SelectRoot>{/if}
        </div>
      {/if}
    </div>
    <Button variant="ghost" size="icon-sm" type="button" aria-label={protectedField ? `${field.label}は削除できません` : `${field.label}を削除`} disabled={protectedField} onclick={() => deleteField(field.key)}><Trash2Icon /></Button>
  {/snippet}
</SortableList>

<Dialog.Root bind:open={optionDialogOpen}>
  <Dialog.Content class="max-w-2xl">
    {#if optionDialogField}{@const field = optionDialogField}
      <Dialog.Header><Dialog.Title>{field.label || "選択式の項目"}の選択肢</Dialog.Title><Dialog.Description>上から順に表示。最大{field.kind === "category" ? 20 : 10}件。</Dialog.Description></Dialog.Header>
      <Dialog.Body class="grid gap-4 py-4">
        <SortableList bind:items={field.options} getKey={(option) => option.value} getLabel={(option) => option.label} isLocked={(option) => lockedOptionValues.includes(option.value)} class="grid gap-3" itemClass="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border p-3">
          {#snippet children(option, _index, controls)}
            <div class="flex items-center gap-1"><button class="cursor-grab rounded-md p-2 text-muted-foreground" type="button" disabled={controls.locked} {...controls.dragHandleProps}><GripVerticalIcon class="size-4" /></button><div class="flex flex-col"><Button variant="ghost" size="icon-sm" type="button" onclick={controls.moveUp} disabled={!controls.canMoveUp}><ChevronUpIcon /></Button><Button variant="ghost" size="icon-sm" type="button" onclick={controls.moveDown} disabled={!controls.canMoveDown}><ChevronDownIcon /></Button></div></div>
            <Input bind:value={option.label} aria-label="選択肢" disabled={controls.locked} />
            <Button variant="ghost" size="icon-sm" type="button" aria-label={`${option.label}を削除`} disabled={controls.locked || field.options.length <= 1} onclick={() => deleteOption(field, option)}><Trash2Icon /></Button>
          {/snippet}
        </SortableList>
        <Button type="button" variant="outline" onclick={() => addOption(field)} disabled={field.options.length >= (field.kind === "category" ? 20 : 10)}>選択肢を追加</Button>
      </Dialog.Body>
      <Dialog.Footer><Dialog.Close>{#snippet child({ props })}<Button type="button" {...props}>完了</Button>{/snippet}</Dialog.Close></Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
