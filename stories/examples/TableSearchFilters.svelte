<script lang="ts">
  import { fly } from 'svelte/transition';
  import { Button } from '@mutsuna/ui/button';
  import TableDateRange from './TableDateRange.svelte';
  import { Input } from '@mutsuna/ui/input';
  import { emptyConditions, statusOptions, ownerOptions, type Conditions } from './searchable-table-model.js';
  import { FilterSelect } from '@mutsuna/ui/filter-select';
  let { draft = $bindable(), onApply, onCancel, count, id }: { draft: Conditions; onApply: (value: Conditions) => void; onCancel: () => void; count: (value: Conditions) => number; id: string } = $props();
  const uid = $props.id();
  let form: HTMLFormElement;
  export function submit() { form.requestSubmit(); }
  const dateError = $derived(draft.range.from && draft.range.to && draft.range.from > draft.range.to ? '開始日は終了日以前にしてください。' : '');
  const amountError = $derived([draft.range.min, draft.range.max].some(value => value !== undefined && (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)))
    ? '金額は0以上の整数で入力してください。'
    : draft.range.min !== undefined && draft.range.max !== undefined && draft.range.min > draft.range.max ? '下限は上限以下にしてください。' : '');
  const invalid = $derived(Boolean(dateError || amountError));
  const previewCount = $derived(invalid ? undefined : count(draft));
  function apply(event: SubmitEvent) { event.preventDefault(); if (!invalid) onApply(draft); }
</script>
<section {id} aria-label="詳細条件" transition:fly|global={{ y: -8, duration: 160 }} class="absolute inset-x-0 top-full z-30 mx-0 flex max-h-[min(38rem,65dvh)] flex-col rounded-b-xl border bg-background shadow-lg">
  <div class="min-h-0 overflow-y-auto p-4">
    <p class="mb-3 text-xs text-muted-foreground">複数選択は、いずれかに一致。未選択・空欄は制限なし。</p>
    <form bind:this={form} id={`${uid}-form`} onsubmit={apply} class="grid gap-3">
        {#each [{ key: 'statuses' as const, label: '状態', options: statusOptions }, { key: 'owners' as const, label: '担当者', options: ownerOptions }] as group}
          <FilterSelect searchable disablePortal label={group.label} class="w-full" ariaLabel={group.label} placeholderLabel="すべて" bind:values={draft[group.key]} options={group.options.map(value => ({ value, label: value }))} />
        {/each}
        <fieldset class="grid min-w-0 gap-2">
          <legend class="sr-only">更新日</legend>
          <TableDateRange bind:from={draft.range.from} bind:to={draft.range.to} />
          {#if dateError}<p id={`${uid}-date-error`} class="text-sm text-destructive" role="alert">{dateError}</p>{/if}
        </fieldset>
        <fieldset class="grid min-w-0 gap-2">
          <legend class="sr-only">金額</legend>
          <div class="grid grid-cols-2 gap-3">
            <Input label="金額の下限（円）" aria-label="下限（円）" type="number" min="0" step="1" bind:value={draft.range.min} aria-invalid={Boolean(amountError)} aria-describedby={amountError ? `${uid}-amount-error` : undefined} />
            <Input label="金額の上限（円）" aria-label="上限（円）" type="number" min="0" step="1" bind:value={draft.range.max} aria-invalid={Boolean(amountError)} aria-describedby={amountError ? `${uid}-amount-error` : undefined} />
          </div>
          {#if amountError}<p id={`${uid}-amount-error`} class="text-sm text-destructive" role="alert">{amountError}</p>{/if}
        </fieldset>
      </form>
  </div>
  <div class="flex shrink-0 flex-wrap items-center gap-2 border-t bg-background p-3">
    <Button variant="ghost" class="mr-auto" onclick={() => draft = emptyConditions()}>入力をクリア</Button>
    <Button variant="outline" onclick={onCancel}>キャンセル</Button>
    <Button form={`${uid}-form`} type="submit" disabled={invalid}>{previewCount === undefined ? '入力を確認' : `検索（${previewCount}件）`}</Button>
  </div>
</section>
