<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import SearchIcon from "@lucide/svelte/icons/search";
import Button from "@mutsuna/ui/button/button.svelte";
import InputGroup from "@mutsuna/ui/input-group/input-group.svelte";
import InputGroupAddon from "@mutsuna/ui/input-group/input-group-addon.svelte";
import InputGroupInput from "@mutsuna/ui/input-group/input-group-input.svelte";
import type { FilterSelectOption } from "@mutsuna/ui/filter-select/filter-select.svelte";
import FilterSelect from "@mutsuna/ui/filter-select/filter-select.svelte";

const { Story } = defineMeta({
  title: "UI/Filter Select",
  component: FilterSelect,
  tags: ["autodocs"],
});
</script>

<script lang="ts">
const bookingStatusSingleOptions: FilterSelectOption[] = [
	{ value: "all", label: "すべて" },
	{ value: "requested", label: "承認待ち" },
	{ value: "confirmed", label: "確定" },
	{ value: "cancelled", label: "キャンセル" },
];

const bookingStatusOptions: FilterSelectOption[] = [
	{ value: "requested", label: "承認待ち" },
	{ value: "confirmed", label: "確定" },
	{ value: "cancelled", label: "キャンセル" },
];

const resourceOptions: FilterSelectOption[] = [
	{ value: "meeting_room_a", label: "会議室 A" },
	{ value: "booth_1", label: "個室ブース 1" },
	{ value: "terrace", label: "テラス席", disabled: true },
];

let bookingStatus = $state("all");
let bookingStatuses = $state<string[]>([]);
let timelineResources = $state<string[]>([]);
let disabledStatuses = $state<string[]>(["confirmed"]);
</script>

<Story name="Default" asChild>
	<FilterSelect
		bind:values={bookingStatuses}
		ariaLabel="予約状態で絞り込み"
		options={bookingStatusOptions}
		placeholderLabel="予約状態"
	/>
</Story>

<Story name="Single" asChild>
	<FilterSelect
		type="single"
		bind:value={bookingStatus}
		ariaLabel="予約状態で絞り込み"
		options={bookingStatusSingleOptions}
	/>
</Story>

<Story name="Toolbar" asChild>
	<div class="flex w-full max-w-3xl flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
		<InputGroup class="w-full sm:max-w-xs">
			<InputGroupAddon>
				<SearchIcon aria-hidden="true" />
			</InputGroupAddon>
			<InputGroupInput placeholder="予約者名で検索" />
		</InputGroup>
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
			<FilterSelect
				bind:values={timelineResources}
				ariaLabel="リソースで絞り込み"
				options={resourceOptions}
				placeholderLabel="リソース"
			/>
			<FilterSelect
				bind:values={bookingStatuses}
				ariaLabel="予約状態で絞り込み"
				options={bookingStatusOptions}
				placeholderLabel="予約状態"
			/>
			<Button type="button" variant="outline" size="sm">リセット</Button>
		</div>
	</div>
</Story>

<Story name="Multiple" asChild>
	<div class="grid max-w-sm gap-2">
		<FilterSelect
			bind:values={timelineResources}
			ariaLabel="リソースで絞り込み"
			options={resourceOptions}
			placeholderLabel="リソース"
		/>
		<p class="text-sm text-muted-foreground">
			{timelineResources.length === 0 ? "すべてのリソースを表示" : `${timelineResources.length}件を表示`}
		</p>
	</div>
</Story>

<Story name="Disabled" asChild>
	<FilterSelect
		bind:values={disabledStatuses}
		ariaLabel="予約状態で絞り込み"
		options={bookingStatusOptions}
		placeholderLabel="予約状態"
		disabled
	/>
</Story>
