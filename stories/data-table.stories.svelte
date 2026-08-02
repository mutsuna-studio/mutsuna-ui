<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";
import type { ColumnDef, RowSelectionState, SortingState, Updater } from "@tanstack/table-core";
import { getCoreRowModel, getSortedRowModel } from "@tanstack/table-core";
import Badge from "@mutsuna/ui/badge/badge.svelte";
import Button from "@mutsuna/ui/button/button.svelte";
import Checkbox from "@mutsuna/ui/checkbox/checkbox.svelte";
import Empty from "@mutsuna/ui/empty/empty.svelte";
import EmptyDescription from "@mutsuna/ui/empty/empty-description.svelte";
import EmptyHeader from "@mutsuna/ui/empty/empty-header.svelte";
import EmptyTitle from "@mutsuna/ui/empty/empty-title.svelte";
import Table from "@mutsuna/ui/table/table.svelte";
import TableBody from "@mutsuna/ui/table/table-body.svelte";
import TableCell from "@mutsuna/ui/table/table-cell.svelte";
import TableHead from "@mutsuna/ui/table/table-head.svelte";
import TableHeader from "@mutsuna/ui/table/table-header.svelte";
import TableRow from "@mutsuna/ui/table/table-row.svelte";
import { createSvelteTable, FlexRender } from "@mutsuna/ui/data-table";
import { projects, type ProjectRow } from "./data-table-fixtures.js";

const { Story } = defineMeta({
  title: "Patterns/Data Table",
  component: Table,
  tags: ["autodocs"],
});
</script>

<script lang="ts">
const columns: ColumnDef<ProjectRow>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => row.original.id,
  },
  {
    accessorKey: "project",
    header: "プロジェクト",
    cell: ({ row }) => row.original.project,
  },
  {
    accessorKey: "owner",
    header: "担当者",
    cell: ({ row }) => row.original.owner,
  },
  {
    accessorKey: "updatedAt",
    header: "更新日時",
    cell: ({ row }) => row.original.updatedAt,
  },
  {
    accessorKey: "totalAmount",
    header: "金額",
    cell: ({ row }) => row.original.total,
  },
  {
    accessorKey: "status",
    header: "状態",
    cell: ({ row }) => row.original.status,
  },
];

const table = createSvelteTable({
  data: projects,
  columns,
  getCoreRowModel: getCoreRowModel(),
});

const emptyTable = createSvelteTable({
  data: [] as ProjectRow[],
  columns,
  getCoreRowModel: getCoreRowModel(),
});

let sorting = $state<SortingState>([{ id: "totalAmount", desc: false }]);
let rowSelection = $state<RowSelectionState>({});

function applyUpdater<TValue>(updater: Updater<TValue>, value: TValue): TValue {
  return updater instanceof Function ? updater(value) : updater;
}

function updateSorting(updater: Updater<SortingState>): void {
  sorting = applyUpdater(updater, sorting);
}

function updateRowSelection(updater: Updater<RowSelectionState>): void {
  rowSelection = applyUpdater(updater, rowSelection);
}

function toggleSort(columnId: string): void {
	const currentSort = sorting.find((sort) => sort.id === columnId);

	if (!currentSort || currentSort.desc) {
		sorting = [{ id: columnId, desc: false }];
		return;
	}

	sorting = [{ id: columnId, desc: true }];
}

function isRightAlignedColumn(columnId: string): boolean {
	return columnId === "totalAmount" || columnId === "status";
}

function getHeaderClass(columnId: string): string | undefined {
	if (columnId === "totalAmount") {
		return "w-32 min-w-32 text-right";
	}

	return isRightAlignedColumn(columnId) ? "text-right" : undefined;
}

function getSortLabel(columnId: string): string {
	const sort = sorting.find((item) => item.id === columnId);

	if (!sort) {
		return "並び替え";
	}

	return sort.desc ? "降順で並び替え中" : "昇順で並び替え中";
}

const selectedRowCount = $derived(
	Object.values(rowSelection).filter((selected) => selected).length
);
const allRowsSelected = $derived(
	projects.length > 0 && projects.every((project) => rowSelection[project.id])
);
const someRowsSelected = $derived(selectedRowCount > 0 && !allRowsSelected);

function setAllRowsSelected(checked: boolean): void {
	rowSelection = checked
		? Object.fromEntries(projects.map((project) => [project.id, true]))
		: {};
}

function setRowSelected(rowId: string, checked: boolean): void {
	rowSelection = {
		...rowSelection,
		[rowId]: checked,
	};
}

function clearRowSelection(): void {
	rowSelection = {};
}

function isActivationKey(event: KeyboardEvent): boolean {
	return event.key === "Enter" || event.key === " ";
}

function handleSelectAllKeydown(event: KeyboardEvent): void {
	if (!isActivationKey(event)) {
		return;
	}

	event.preventDefault();
	setAllRowsSelected(!allRowsSelected);
}

function handleRowSelectionKeydown(event: KeyboardEvent, rowId: string): void {
	if (!isActivationKey(event)) {
		return;
	}

	event.preventDefault();
	setRowSelected(rowId, !rowSelection[rowId]);
}

const advancedTable = createSvelteTable({
  data: projects,
  columns,
  enableRowSelection: true,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getRowId: (row) => row.id,
  get state() {
    return {
      rowSelection,
      sorting,
    };
  },
  onRowSelectionChange: updateRowSelection,
  onSortingChange: updateSorting,
});

const advancedHeaderGroups = $derived.by(() => {
  sorting;
  rowSelection;

  return advancedTable.getHeaderGroups();
});

const advancedRows = $derived.by(() => {
  sorting;
  rowSelection;

  return advancedTable.getRowModel().rows;
});
</script>

<Story name="Default" asChild>
	<div class="max-w-5xl overflow-hidden rounded-md border">
		<Table>
			<TableHeader>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<TableRow>
						{#each headerGroup.headers as header (header.id)}
							<TableHead class={isRightAlignedColumn(header.column.id) ? "text-right" : undefined}>
								{#if !header.isPlaceholder}
									<FlexRender content={header.column.columnDef.header} context={header.getContext()} />
								{/if}
							</TableHead>
						{/each}
					</TableRow>
				{/each}
			</TableHeader>
			<TableBody>
				{#each table.getRowModel().rows as row (row.id)}
					<TableRow>
						{#each row.getVisibleCells() as cell (cell.id)}
							<TableCell class={isRightAlignedColumn(cell.column.id) ? "text-right" : undefined}>
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							</TableCell>
						{/each}
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</div>
</Story>

<Story name="Selectable And Sortable" asChild>
	<div class="grid max-w-5xl gap-3">
		<div class="flex items-center justify-between gap-3">
			<p class="text-muted-foreground text-sm">{selectedRowCount}件を選択中</p>
			<Button type="button" variant="outline" size="sm" disabled={selectedRowCount === 0} onclick={clearRowSelection}>
				選択を解除
			</Button>
		</div>
		<div class="overflow-hidden rounded-md border">
			<Table>
				<TableHeader>
					{#each advancedHeaderGroups as headerGroup (headerGroup.id)}
						<TableRow>
							<TableHead class="w-10">
								<div
									role="button"
									tabindex="0"
									aria-label="すべての項目を選択"
									class="grid size-4 place-items-center"
									onclick={() => setAllRowsSelected(!allRowsSelected)}
									onkeydown={handleSelectAllKeydown}
								>
									<Checkbox
										checked={allRowsSelected}
										indeterminate={someRowsSelected}
										class="pointer-events-none"
									/>
								</div>
							</TableHead>
							{#each headerGroup.headers as header (header.id)}
								<TableHead class={getHeaderClass(header.column.id)}>
									{#if !header.isPlaceholder}
											<Button
												type="button"
												variant="ghost"
												size="sm"
												aria-label={`${header.column.columnDef.header}を${getSortLabel(header.column.id)}`}
												class={isRightAlignedColumn(header.column.id)
													? "ml-auto h-7 w-full min-w-max gap-1.5 px-2"
													: "-ml-2 h-7 min-w-max gap-1.5 px-2"}
												onclick={() => toggleSort(header.column.id)}
										>
											<span class="whitespace-nowrap">
												<FlexRender content={header.column.columnDef.header} context={header.getContext()} />
											</span>
											<ArrowUpDownIcon class="shrink-0" aria-hidden="true" />
										</Button>
									{/if}
								</TableHead>
							{/each}
						</TableRow>
					{/each}
				</TableHeader>
				<TableBody>
					{#each advancedRows as row (row.id)}
						<TableRow data-state={rowSelection[row.id] ? "selected" : undefined}>
							<TableCell>
								<div
									role="button"
									tabindex="0"
									aria-label={`${row.original.id}を選択`}
									class="grid size-4 place-items-center"
									onclick={() => setRowSelected(row.id, !rowSelection[row.id])}
									onkeydown={(event) => handleRowSelectionKeydown(event, row.id)}
								>
									<Checkbox
										checked={Boolean(rowSelection[row.id])}
										class="pointer-events-none"
									/>
								</div>
							</TableCell>
							{#each row.getVisibleCells() as cell (cell.id)}
								<TableCell class={isRightAlignedColumn(cell.column.id) ? "text-right" : undefined}>
									{#if cell.column.id === "status"}
										<Badge class="w-16 justify-center" variant={row.original.status === "確定" ? "secondary" : "outline"}>
											{row.original.status}
										</Badge>
									{:else}
										<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
									{/if}
								</TableCell>
							{/each}
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	</div>
</Story>

<Story name="Empty" asChild>
	<div class="max-w-5xl overflow-hidden rounded-md border">
		<Table>
			<TableHeader>
				{#each emptyTable.getHeaderGroups() as headerGroup (headerGroup.id)}
					<TableRow>
						{#each headerGroup.headers as header (header.id)}
							<TableHead class={isRightAlignedColumn(header.column.id) ? "text-right" : undefined}>
								{#if !header.isPlaceholder}
									<FlexRender content={header.column.columnDef.header} context={header.getContext()} />
								{/if}
							</TableHead>
						{/each}
					</TableRow>
				{/each}
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell colspan={columns.length}>
						<Empty class="min-h-52 border-0 p-0">
							<EmptyHeader>
								<EmptyTitle>項目がありません</EmptyTitle>
								<EmptyDescription>条件に一致する項目はまだありません。</EmptyDescription>
							</EmptyHeader>
						</Empty>
					</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	</div>
</Story>
