<script lang="ts">
  import { onMount, tick, untrack } from 'svelte';
  import { createSvelteTable } from '@mutsuna/ui/data-table';
  import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, getPaginationRowModel, type ColumnDef } from '@tanstack/table-core';
  import type { ProjectRow } from '../data-table-fixtures.js';
  import X from '@lucide/svelte/icons/x';
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import ArrowUp from '@lucide/svelte/icons/arrow-up';
  import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right';
  import ColumnsIcon from '@lucide/svelte/icons/columns-3-cog';
  import { Button } from '@mutsuna/ui/button';
  import { Badge } from '@mutsuna/ui/badge';
  import { Checkbox } from '@mutsuna/ui/checkbox';
  import * as DropdownMenu from '@mutsuna/ui/dropdown-menu';
  import { Input } from '@mutsuna/ui/input';
  import * as Table from '@mutsuna/ui/table';
  import TableSearchFilters from './TableSearchFilters.svelte';
  import { projects, emptyConditions, countMatches, matchesQuery, matchesDate, matchesAmount, includesSelected, type Conditions, type Range } from './searchable-table-model.js';

  let { initialQuery = '' }: { initialQuery?: string } = $props();
  const uid = $props.id();
  let applied = $state<Conditions>({ ...emptyConditions(), query: untrack(() => initialQuery) });
  let draft = $state<Conditions>({ ...emptyConditions(), query: untrack(() => initialQuery) });
  let query = $derived(draft.query);
  let panelOpen = $state(false);
  let searchArea: HTMLDivElement;
  let panel = $state<TableSearchFilters>();
  let suppressOpen = false;
  function openPanel() {
    if (suppressOpen || panelOpen) return;
    draft = { ...applied, query, statuses: [...applied.statuses], owners: [...applied.owners], range: { ...applied.range } };
    panelOpen = true;
  }
  function focusSearch() { suppressOpen = true; searchInput?.focus(); suppressOpen = false; }
  function closePanel(restoreFocus = false) { panelOpen = false; if (restoreFocus) focusSearch(); }
  function applyPanel(conditions: Conditions) { commit({ ...conditions, query: conditions.query.trim() }); draft = { ...conditions, query: applied.query }; closePanel(true); }

  let searchInput = $state<HTMLInputElement | null>(null);
  let chipsElement = $state<HTMLDivElement>();
  let scrollElement = $state<HTMLDivElement>();
  let tableElement = $state<HTMLTableElement | null>(null);
  let overflow = $state(false);
  let page = $state(0);
  let descending = $state(true);
  let selected = $state<Record<string, boolean>>({});
  let visibleColumns = $state(['status', 'totalAmount', 'owner', 'updatedAt']);
  const optionalColumns = [
    { id: 'status', label: '状態' },
    { id: 'totalAmount', label: '金額' },
    { id: 'owner', label: '担当者' },
    { id: 'updatedAt', label: '更新日時' },
  ];
  const pageSize = 5;
  const queryDirty = $derived(query !== applied.query);
  function commit(next: Conditions) { applied = next; page = 0; }
  function submitSearch(event: SubmitEvent) { event.preventDefault(); if (panelOpen) panel?.submit(); else applyPanel({ ...applied, query }); }
  const columns: ColumnDef<ProjectRow>[] = [
    { accessorKey: 'project' },
    { accessorKey: 'status', filterFn: (row, id, values: string[]) => includesSelected(row.getValue(id), values) },
    { accessorKey: 'owner', filterFn: (row, id, values: string[]) => includesSelected(row.getValue(id), values) },
    { accessorKey: 'updatedAt', filterFn: (row, _id, range: Range) => matchesDate(row.original, range) },
    { accessorKey: 'totalAmount', filterFn: (row, _id, range: Range) => matchesAmount(row.original, range) },
  ];
  const table = createSvelteTable({
    data: projects, columns, getRowId: row => row.id,
    getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
    globalFilterFn: (row, _id, value: string) => matchesQuery(row.original, value),
    get state() { return {
      globalFilter: applied.query,
      columnFilters: [{ id: 'status', value: applied.statuses }, { id: 'owner', value: applied.owners },
        { id: 'updatedAt', value: applied.range }, { id: 'totalAmount', value: applied.range }],
      sorting: [{ id: 'updatedAt', desc: descending }], pagination: { pageIndex: page, pageSize },
    }; },
    onPaginationChange: updater => { page = (typeof updater === 'function' ? updater({ pageIndex: page, pageSize }) : updater).pageIndex; },
  });
  const filtered = $derived.by(() => { applied; return table.getFilteredRowModel().rows; });
  const visible = $derived.by(() => { applied; descending; page; return table.getRowModel().rows.map(row => row.original); });
  const selectedCount = $derived(Object.values(selected).filter(Boolean).length);
  const allVisibleSelected = $derived(visible.length > 0 && visible.every(row => selected[row.id]));
  const someVisibleSelected = $derived(visible.some(row => selected[row.id]) && !allVisibleSelected);
  function setRowSelected(id: string, checked: boolean) { selected = { ...selected, [id]: checked }; }
  function setVisibleSelected(checked: boolean) {
    selected = { ...selected, ...Object.fromEntries(visible.map(row => [row.id, checked])) };
  }
  const pageCount = $derived(Math.max(1, Math.ceil(filtered.length / pageSize)));
  const chips = $derived([
    ...applied.statuses.map(value => ({ id: `status:${value}`, label: `状態: ${value}` })),
    ...applied.owners.map(value => ({ id: `owner:${value}`, label: `担当者: ${value}` })),
    ...(applied.range.from || applied.range.to ? [{ id: 'date', label: `更新日: ${applied.range.from || '指定なし'} ～ ${applied.range.to || '指定なし'}` }] : []),
    ...(applied.range.min !== undefined || applied.range.max !== undefined ? [{ id: 'amount', label: `金額: ${applied.range.min?.toLocaleString('ja-JP') ?? '指定なし'} ～ ${applied.range.max?.toLocaleString('ja-JP') ?? '指定なし'} 円` }] : []),
  ]);
  async function removeCondition(id: string, returnToSearch = false) {
    const index = chips.findIndex(chip => chip.id === id);
    const next = { ...applied, range: { ...applied.range } };
    if (id === 'query') { next.query = ''; draft.query = ''; }
    else if (id.startsWith('status:')) next.statuses = applied.statuses.filter(value => `status:${value}` !== id);
    else if (id.startsWith('owner:')) next.owners = applied.owners.filter(value => `owner:${value}` !== id);
    else if (id === 'date') { next.range.from = ''; next.range.to = ''; }
    else if (id === 'amount') { next.range.min = undefined; next.range.max = undefined; }
    commit(next);
    await tick();
    const remaining = chipsElement?.querySelectorAll<HTMLButtonElement>('[data-condition]');
    const target = returnToSearch ? undefined : remaining?.[Math.min(index, remaining.length - 1)];
    if (target) target.focus(); else focusSearch();
  }
  async function reset() { draft = emptyConditions(); commit(emptyConditions()); closePanel(); await tick(); focusSearch(); }
  onMount(() => {
    const update = () => { overflow = Boolean(scrollElement && scrollElement.scrollWidth > scrollElement.clientWidth + 1); };
    const observer = new ResizeObserver(update);
    if (scrollElement) observer.observe(scrollElement);
    if (tableElement) observer.observe(tableElement);
    update();
    return () => observer.disconnect();
  });
</script>

<svelte:window onpointerdown={event => { if (panelOpen && !searchArea?.contains(event.target as Node)) closePanel(); }} onfocusin={event => { if (panelOpen && !searchArea?.contains(event.target as Node)) closePanel(); }} onkeydown={event => { if (panelOpen && event.key === 'Escape') { event.preventDefault(); draft.query = applied.query; closePanel(true); } }} />
<section class="grid min-w-0 w-full max-w-5xl gap-4" aria-labelledby={`${uid}-title`}>
  <h2 id={`${uid}-title`} class="text-lg font-semibold">プロジェクト一覧</h2>
  <div class="min-w-0 rounded-xl border bg-background">
  <div bind:this={searchArea} class="relative flex flex-wrap items-center gap-2 px-4 pt-3 pb-2">
    <form id={`${uid}-search-form`} class="flex min-w-0 flex-[1_1_20rem] gap-2" onsubmit={submitSearch}>
      <label for={`${uid}-search`} class="sr-only">検索</label>
      <Input bind:ref={searchInput} id={`${uid}-search`} bind:value={draft.query} onfocus={openPanel} onclick={openPanel} aria-controls={panelOpen ? `${uid}-panel` : undefined} class="placeholder:text-foreground" placeholder="名前・ID・担当者で検索" aria-describedby={`${uid}-search-hint`} onkeydown={event => {
          if (event.key === 'Enter' && event.isComposing) event.preventDefault();
          if (event.key === 'Escape') { draft.query = applied.query; event.preventDefault(); }
        }} />
    </form>
    <Button variant="outline" aria-expanded={panelOpen} aria-controls={panelOpen ? `${uid}-panel` : undefined} aria-label="詳細条件" onclick={() => panelOpen ? closePanel(true) : openPanel()}>詳細条件</Button>
    {#if panelOpen}<TableSearchFilters bind:this={panel} id={`${uid}-panel`} bind:draft onApply={applyPanel} onCancel={() => closePanel(true)} count={countMatches} />{/if}
    {#if chips.length || query || applied.query}<Button variant="ghost" size="sm" onclick={reset}>すべて解除</Button>{/if}
    <Button type="submit" form={`${uid}-search-form`} class="ml-auto shrink-0">検索</Button>
    <div id={`${uid}-search-hint`} class={queryDirty ? 'flex w-full flex-wrap items-center gap-x-2 text-xs text-muted-foreground' : 'sr-only'}>
      {#if queryDirty}<span>検索語は未反映です。Enterまたは検索で反映します。</span><Button variant="ghost" size="sm" onclick={() => { draft.query = applied.query; focusSearch(); }}>入力を取り消す</Button>
      {:else}<span>スペース区切りで複数語を検索できます。</span>{/if}
    </div>
  </div>
  {#if chips.length}
    <div bind:this={chipsElement} class="flex flex-wrap gap-1.5 px-4 pb-3" aria-label="適用中の条件">
      {#each chips as chip (chip.id)}<Button data-condition={chip.id} variant="secondary" class="h-auto min-h-8 max-w-full whitespace-normal py-1 text-left" aria-label={`${chip.label}を解除`} onclick={() => removeCondition(chip.id)}><span class="min-w-0 break-words">{chip.label}</span><X class="shrink-0" aria-hidden="true" /></Button>{/each}
    </div>
  {/if}
  <div class="grid min-w-0 border-t">
    {#if overflow}<p id={`${uid}-scroll-hint`} class="flex items-center gap-1 border-b bg-muted/30 px-4 py-2 text-xs text-muted-foreground"><ArrowLeftRight class="size-3.5" aria-hidden="true" />横にスクロールして、すべての列を確認できます。</p>{/if}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (横スクロール領域をキーボードでも操作可能にする) -->
    <div bind:this={scrollElement} data-overflow={overflow} role="region" aria-label="プロジェクト表のスクロール領域" aria-describedby={overflow ? `${uid}-scroll-hint` : undefined} tabindex={overflow ? 0 : undefined}
      class="table-scroll min-w-0 overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
      <Table.Root bind:ref={tableElement} aria-label="プロジェクト検索結果" class="table-fixed" style={filtered.length ? `min-width: ${22.75 + visibleColumns.length * 8}rem` : undefined}>
        <Table.Header><Table.Row>
          <Table.Head scope="col" class="selection w-11"><Checkbox aria-label="このページの行をすべて選択" checked={allVisibleSelected} indeterminate={someVisibleSelected} disabled={!visible.length} onCheckedChange={setVisibleSelected} /></Table.Head>
          <Table.Head scope="col" class="identity">プロジェクト</Table.Head>
          {#if visibleColumns.includes('status')}<Table.Head scope="col" class="w-[16%]">状態</Table.Head>{/if}
          {#if visibleColumns.includes('totalAmount')}<Table.Head scope="col" class="w-[14%] text-right">金額</Table.Head>{/if}
          {#if visibleColumns.includes('owner')}<Table.Head scope="col" class="w-[18%]">担当者</Table.Head>{/if}
          {#if visibleColumns.includes('updatedAt')}<Table.Head scope="col" class="w-[22%]" aria-sort={descending ? 'descending' : 'ascending'}><Button variant="ghost" size="sm" onclick={() => { descending = !descending; page = 0; }} aria-label={`更新日時を${descending ? '古い' : '新しい'}順に並べ替え`}>更新日時{#if descending}<ArrowDown aria-hidden="true" />{:else}<ArrowUp aria-hidden="true" />{/if}</Button></Table.Head>{/if}
          <Table.Head scope="col" class="settings w-11 text-right">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                {#snippet child({ props })}<Button {...props} variant="ghost" size="icon-sm" icon={ColumnsIcon} aria-label="表示列を選択" title="表示列を選択" />{/snippet}
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end" class="w-44">
                <DropdownMenu.Label>表示する列</DropdownMenu.Label>
                <DropdownMenu.CheckboxGroup bind:value={visibleColumns}>
                  {#each optionalColumns as column (column.id)}
                    <DropdownMenu.CheckboxItem value={column.id} closeOnSelect={false}>{column.label}</DropdownMenu.CheckboxItem>
                  {/each}
                </DropdownMenu.CheckboxGroup>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Table.Head>
        </Table.Row></Table.Header>
        <Table.Body>
          {#each visible as row (row.id)}
            <Table.Row data-state={selected[row.id] ? 'selected' : undefined}>
              <Table.Cell class="selection"><Checkbox aria-label={`${row.project}を選択`} checked={Boolean(selected[row.id])} onCheckedChange={checked => setRowSelected(row.id, checked)} /></Table.Cell>
              <Table.Cell class="identity"><span class="font-medium">{row.project}</span><span class="mt-1 block text-xs text-muted-foreground">{row.id}</span></Table.Cell>
              {#if visibleColumns.includes('status')}<Table.Cell><Badge variant="outline">{row.status}</Badge></Table.Cell>{/if}
              {#if visibleColumns.includes('totalAmount')}<Table.Cell class="text-right font-mono tabular-nums">{row.total}</Table.Cell>{/if}
              {#if visibleColumns.includes('owner')}<Table.Cell>{row.owner}</Table.Cell>{/if}
              {#if visibleColumns.includes('updatedAt')}<Table.Cell class="font-mono tabular-nums">{row.updatedAt}</Table.Cell>{/if}
              <Table.Cell aria-hidden="true" />
            </Table.Row>
          {:else}
            <Table.Row><Table.Cell colspan={3 + visibleColumns.length} class="h-52 whitespace-normal text-center">
              <p class="font-medium">条件に一致するプロジェクトがありません</p><p class="mt-2 text-sm text-muted-foreground">条件を一つずつ解除して、検索範囲を広げてください。</p>
              <div class="mt-4 flex flex-wrap justify-center gap-2">
                {#if applied.query}<Button variant="outline" onclick={() => removeCondition('query', true)}>検索語だけ解除</Button>{/if}
                {#if chips.length}<Button variant="ghost" onclick={() => removeCondition(chips[chips.length - 1].id)}>条件を1つ解除</Button>{/if}
              </div>
            </Table.Cell></Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  </div>
  <footer class="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
    <div class="flex flex-wrap items-center gap-2">
      <p role="status" aria-live="polite" aria-atomic="true" class="text-sm text-muted-foreground"><span class="font-mono tabular-nums">{filtered.length}</span>件 / 全<span class="font-mono tabular-nums">{projects.length}</span>件{#if selectedCount} · <span class="font-mono tabular-nums">{selectedCount}</span>件を選択中{/if}</p>
      {#if selectedCount}<Button variant="ghost" size="sm" onclick={() => selected = {}}>選択を解除</Button>{/if}
    </div>
  {#if filtered.length}
    <nav aria-label="検索結果のページ切り替え" class="flex flex-wrap items-center gap-3">
      <p class="w-28 shrink-0 text-right font-mono text-sm text-muted-foreground tabular-nums">{page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)}件を表示</p>
      {#if pageCount > 1}<div class="flex items-center gap-3"><Button variant="outline" class="w-16" disabled={page === 0} onclick={() => table.previousPage()}>前へ</Button><span class="w-12 shrink-0 text-center font-mono text-sm tabular-nums">{page + 1} / {pageCount}</span><Button variant="outline" class="w-16" disabled={page + 1 >= pageCount} onclick={() => table.nextPage()}>次へ</Button></div>{/if}
    </nav>
  {/if}
  </footer>
  </div>
</section>

<style>
  .table-scroll > :global([data-slot="table-container"]) { overflow: visible; }
  .table-scroll :global(.identity) { white-space: normal; overflow-wrap: anywhere; }
  .table-scroll[data-overflow="true"] :global(.selection) { position: sticky; left: 0; z-index: 2; background: var(--background); }
  .table-scroll[data-overflow="true"] :global(.identity) { position: sticky; left: 2.75rem; z-index: 1; background: var(--background); border-right: 1px solid var(--border); }
  .table-scroll[data-overflow="true"] :global(th.settings) { position: sticky; right: 0; z-index: 3; background: var(--background); }
</style>
