<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Checkbox from "@mutsuna/ui/checkbox/checkbox.svelte";

const { Story } = defineMeta({
  title: "Components/Inputs/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
});
</script>

<script lang="ts">
const weekdayOptions = [
  { key: "monday", label: "月曜日" },
  { key: "tuesday", label: "火曜日" },
  { key: "wednesday", label: "水曜日" },
] as const;

let selectedWeekdays = $state<Record<string, boolean>>({
  monday: true,
  tuesday: false,
  wednesday: false,
});

const selectedWeekdayCount = $derived(
  weekdayOptions.filter((option) => selectedWeekdays[option.key]).length
);
const allWeekdaysSelected = $derived(selectedWeekdayCount === weekdayOptions.length);
const someWeekdaysSelected = $derived(selectedWeekdayCount > 0 && !allWeekdaysSelected);

function toggleAllWeekdays(checked: boolean): void {
  selectedWeekdays = Object.fromEntries(weekdayOptions.map((option) => [option.key, checked]));
}
</script>

<Story name="States" parameters={{ controls: { disable: true }, options: { showPanel: false } }} asChild>
	<section class="grid max-w-2xl gap-4" aria-labelledby="checkbox-states-heading">
		<div class="space-y-1">
			<h2 id="checkbox-states-heading" class="text-sm font-medium">Checkbox states</h2>
			<p class="text-muted-foreground text-xs">未選択・選択済み・一部選択と、それぞれの無効状態を比較する。</p>
		</div>
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="grid gap-3 rounded-lg border p-4">
				<h3 class="text-muted-foreground text-xs font-medium">通常</h3>
				<label class="flex items-center gap-3 text-sm">
					<Checkbox />
					<span>未選択</span>
				</label>
				<label class="flex items-center gap-3 text-sm">
					<Checkbox checked />
					<span>選択済み</span>
				</label>
				<label class="flex items-center gap-3 text-sm">
					<Checkbox indeterminate />
					<span>一部選択</span>
				</label>
			</div>
			<div class="grid gap-3 rounded-lg border p-4">
				<h3 class="text-muted-foreground text-xs font-medium">無効</h3>
				<label class="text-muted-foreground flex items-center gap-3 text-sm">
					<Checkbox disabled />
					<span>未選択</span>
				</label>
				<label class="text-muted-foreground flex items-center gap-3 text-sm">
					<Checkbox checked disabled />
					<span>選択済み</span>
				</label>
				<label class="text-muted-foreground flex items-center gap-3 text-sm">
					<Checkbox indeterminate disabled />
					<span>一部選択</span>
				</label>
			</div>
		</div>
		<div class="grid gap-2 rounded-lg border border-destructive/50 p-4">
			<label class="flex items-center gap-3 text-sm">
				<Checkbox aria-invalid="true" aria-describedby="states-invalid-checkbox-error" />
				<span>利用規約に同意する</span>
			</label>
			<p id="states-invalid-checkbox-error" class="text-destructive text-xs">続行するには同意が必要です。</p>
		</div>
	</section>
</Story>

<Story name="Checkbox" asChild>
	<div class="grid max-w-md gap-6">
		<div class="grid gap-3 rounded-md border p-3">
			<label class="flex items-center gap-3 text-sm font-medium">
				<Checkbox
					checked={allWeekdaysSelected}
					indeterminate={someWeekdaysSelected}
					onCheckedChange={(checked) => toggleAllWeekdays(checked)}
				/>
				<span>営業日をまとめて選択</span>
			</label>
			<div class="grid gap-2 pl-7">
				{#each weekdayOptions as option (option.key)}
					<label class="flex items-center gap-3 text-sm">
						<Checkbox bind:checked={selectedWeekdays[option.key]} />
						<span>{option.label}</span>
					</label>
				{/each}
			</div>
			<p class="text-muted-foreground text-xs">
				子の一部だけを選択すると、親チェックボックスが横線になります。
			</p>
		</div>

		<label class="flex items-center gap-3 text-sm">
			<Checkbox checked />
			<span>平日に通知を送信する</span>
		</label>
		<label class="flex items-start gap-3 text-sm">
			<Checkbox />
			<span class="grid gap-1">
				<span>祝日営業を有効にする</span>
				<span class="text-muted-foreground text-xs">祝日だけ別の営業時間を使います。</span>
			</span>
		</label>
		<label class="flex items-center gap-3 text-sm">
			<Checkbox indeterminate />
			<span>一部の曜日だけ選択済み</span>
		</label>
		<label class="flex items-center gap-3 text-sm text-muted-foreground">
			<Checkbox disabled />
			<span>この項目は固定されています</span>
		</label>
	</div>
</Story>
