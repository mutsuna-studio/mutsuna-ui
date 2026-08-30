<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Badge from "@mutsuna/ui/badge/badge.svelte";
import Label from "@mutsuna/ui/label/label.svelte";
import Select from "@mutsuna/ui/select/select.svelte";
import SelectContent from "@mutsuna/ui/select/select-content.svelte";
import SelectGroup from "@mutsuna/ui/select/select-group.svelte";
import SelectGroupHeading from "@mutsuna/ui/select/select-group-heading.svelte";
import SelectItem from "@mutsuna/ui/select/select-item.svelte";
import SelectSeparator from "@mutsuna/ui/select/select-separator.svelte";
import SelectTrigger from "@mutsuna/ui/select/select-trigger.svelte";
import type { SelectSearchableOption } from "@mutsuna/ui/select/select.svelte";

const { Story } = defineMeta({
  title: "Components/Inputs/Select",
  component: Select,
  tags: ["autodocs"],
});
</script>

<script lang="ts">
const resourceLabels: Record<string, string> = {
  meeting_room: "会議室",
  booth: "個室ブース",
  desk: "デスク",
};

const billingLabels: Record<string, string> = {
  manual: "この画面で管理",
  stripe_checkout: "オンライン決済で管理",
};

const statusLabels: Record<string, string> = {
  available: "予約可能",
  maintenance: "メンテナンス",
  unavailable: "利用停止",
};

const resourceSuggestions: [SelectSearchableOption, ...SelectSearchableOption[]] = [
  { value: "meeting_room_a", label: "会議室 A", description: "6名まで / プロジェクターあり" },
  { value: "meeting_room_b", label: "会議室 B", description: "4名まで / 面談向け" },
  { value: "booth_1", label: "個室ブース 1", description: "1名 / オンライン会議向け" },
  { value: "terrace", label: "テラス席", description: "屋外席 / 天候確認が必要" },
];

const offeringSuggestions: [SelectSearchableOption, ...SelectSearchableOption[]] = [
  { value: "consultation", label: "初回相談", description: "30分 / 無料" },
  { value: "workshop", label: "ワークショップ", description: "90分 / 最大8名" },
  { value: "studio-rental", label: "スタジオ貸切", description: "120分 / 事前確認あり" },
];

let resourceKind = $state("meeting_room");
let billingMode = $state("manual");
let status = $state("available");
let selectedSearchableResourceId = $state(resourceSuggestions[0].value);
let offeringText = $state("下見相談");

const selectedSearchableResource = $derived(resourceSuggestions.find((suggestion) => suggestion.value === selectedSearchableResourceId));
</script>

{#snippet comparisonOptions()}
	<SelectContent>
		<SelectItem value="meeting_room">会議室</SelectItem>
		<SelectItem value="booth">個室ブース</SelectItem>
		<SelectItem value="desk">デスク</SelectItem>
		<SelectItem value="long">複数拠点で共通利用する長い名前の会議室</SelectItem>
	</SelectContent>
{/snippet}

<Story name="States" parameters={{ controls: { disable: true }, options: { showPanel: false } }} asChild>
	<section class="grid max-w-3xl gap-4" aria-labelledby="select-states-heading">
		<div class="space-y-1">
			<h2 id="select-states-heading" class="text-sm font-medium">Select states</h2>
			<p class="text-muted-foreground text-xs">未選択・選択済み・小サイズ・無効・エラー・長文を比較する。</p>
		</div>
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="grid gap-2">
				<Label for="states-select-placeholder">未選択</Label>
				<Select type="single" value="">
					<SelectTrigger id="states-select-placeholder" class="w-full">
						<span class="text-muted-foreground">選択してください</span>
					</SelectTrigger>
					{@render comparisonOptions()}
				</Select>
			</div>
			<div class="grid gap-2">
				<Label for="states-select-selected">選択済み</Label>
				<Select type="single" value="meeting_room">
					<SelectTrigger id="states-select-selected" class="w-full"><span>会議室</span></SelectTrigger>
					{@render comparisonOptions()}
				</Select>
			</div>
			<div class="grid gap-2">
				<Label for="states-select-compact">小サイズ</Label>
				<Select type="single" value="booth">
					<SelectTrigger id="states-select-compact" size="sm" class="w-full"><span>個室ブース</span></SelectTrigger>
					{@render comparisonOptions()}
				</Select>
			</div>
			<div class="grid gap-2">
				<Label for="states-select-disabled">無効</Label>
				<Select type="single" value="desk" disabled>
					<SelectTrigger id="states-select-disabled" class="w-full"><span>デスク</span></SelectTrigger>
					{@render comparisonOptions()}
				</Select>
			</div>
			<div class="grid gap-2">
				<Label for="states-select-invalid">エラー</Label>
				<Select type="single" value="">
					<SelectTrigger
						id="states-select-invalid"
						class="w-full"
						aria-invalid="true"
						aria-describedby="states-select-invalid-error"
					>
						<span class="text-muted-foreground">選択してください</span>
					</SelectTrigger>
					{@render comparisonOptions()}
				</Select>
				<p id="states-select-invalid-error" class="text-destructive text-xs">リソース種別を選択してください。</p>
			</div>
			<div class="grid min-w-0 gap-2">
				<Label for="states-select-long">長い値</Label>
				<Select type="single" value="long">
					<SelectTrigger id="states-select-long" class="w-full min-w-0">
						<span class="truncate">複数拠点で共通利用する長い名前の会議室</span>
					</SelectTrigger>
					{@render comparisonOptions()}
				</Select>
			</div>
		</div>
	</section>
</Story>

<Story name="Default" asChild>
	<div class="grid max-w-md gap-4">
		<Select type="single" bind:value={resourceKind}>
			<SelectTrigger class="w-full">
				<span>{resourceLabels[resourceKind]}</span>
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectGroupHeading>リソース種別</SelectGroupHeading>
					<SelectItem value="meeting_room">会議室</SelectItem>
					<SelectItem value="booth">個室ブース</SelectItem>
					<SelectItem value="desk">デスク</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>

		<Select type="single" bind:value={billingMode}>
			<SelectTrigger class="w-full">
				<span>{billingLabels[billingMode]}</span>
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="manual">この画面で管理</SelectItem>
				<SelectItem value="stripe_checkout">オンライン決済で管理</SelectItem>
				<SelectSeparator />
				<SelectItem value="disabled" disabled>現在の契約では選択できません</SelectItem>
			</SelectContent>
		</Select>
	</div>
</Story>

<Story name="Compact" asChild>
	<Select type="single" bind:value={status}>
		<SelectTrigger size="sm" class="w-40">
			<span>{statusLabels[status]}</span>
		</SelectTrigger>
		<SelectContent>
			<SelectItem value="available">予約可能</SelectItem>
			<SelectItem value="maintenance">メンテナンス</SelectItem>
			<SelectItem value="unavailable">利用停止</SelectItem>
		</SelectContent>
	</Select>
</Story>

<Story name="Disabled" asChild>
	<Select type="single" value="fixed" disabled>
		<SelectTrigger class="w-64">
			<span>契約プランで固定されています</span>
		</SelectTrigger>
		<SelectContent>
			<SelectItem value="fixed">契約プランで固定されています</SelectItem>
		</SelectContent>
	</Select>
</Story>

<Story name="Searchable" asChild>
	<div class="grid w-full max-w-md min-w-0 gap-2 rounded-lg border bg-card p-4">
		<div class="space-y-1">
			<Label for="resource-search-input">候補が多い Select</Label>
			<p class="text-sm text-muted-foreground">入力欄は検索用。保存値は候補 ID に固定し、候補外の文字列は適用しない。</p>
		</div>

		<Select
			id="resource-search-input"
			type="single"
			searchable
			bind:value={selectedSearchableResourceId}
			options={resourceSuggestions}
			class="w-full"
			ariaLabel="リソースを選択"
		/>

		<Badge variant="outline">選択中: {selectedSearchableResource?.label ?? "未選択"}</Badge>
	</div>
</Story>

<Story name="Free Text" asChild>
	<div class="grid w-full max-w-md min-w-0 gap-2 rounded-lg border bg-card p-4">
		<div class="space-y-1">
			<Label for="offering-free-text-input">Select + 任意入力</Label>
			<p class="text-sm text-muted-foreground">候補を補助として出し、候補外の文字列も入力値として適用する。</p>
		</div>

		<Select
			id="offering-free-text-input"
			type="single"
			searchable
			freeText
			bind:value={offeringText}
			options={offeringSuggestions}
			placeholder="利用プラン名を入力または選択"
			class="w-full"
			ariaLabel="利用プラン名を入力または選択"
		/>

		<Badge variant="outline">現在の値: {offeringText.trim() === "" ? "未入力" : offeringText.trim()}</Badge>
	</div>
</Story>
