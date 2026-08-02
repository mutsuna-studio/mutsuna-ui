<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Label from "@mutsuna/ui/label/label.svelte";
import TimePicker from "@mutsuna/ui/time-picker/time-picker.svelte";

const { Story } = defineMeta({
  title: "UI/Time Picker",
  component: TimePicker,
  tags: ["autodocs"],
});
</script>

<script lang="ts">
let startTime = $state("09:00");
let endTime = $state("10:00");
let customTime = $state("13:05");
</script>

<Story name="Booking Time" asChild>
	<div class="grid max-w-sm gap-4">
		<div class="grid grid-cols-2 gap-3">
			<Label class="grid gap-2">
				開始
				<TimePicker bind:value={startTime} />
			</Label>
			<Label class="grid gap-2">
				終了
				<TimePicker bind:value={endTime} />
			</Label>
		</div>
	</div>
</Story>

<Story name="Five Minute Input" asChild>
	<Label class="grid max-w-[8rem] gap-2">
		入力
		<TimePicker bind:value={customTime} />
	</Label>
</Story>

<Story name="Disabled" asChild>
	<Label class="grid max-w-[8rem] gap-2">
		固定
		<TimePicker value="18:00" disabled />
	</Label>
</Story>
