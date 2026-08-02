<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Checkbox from "@mutsuna/ui/checkbox/checkbox.svelte";

const { Story } = defineMeta({
  title: "UI/Checkbox",
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
