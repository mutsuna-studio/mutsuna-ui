<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Label from "@mutsuna/ui/label/label.svelte";
import Input from "@mutsuna/ui/input/input.svelte";

const { Story } = defineMeta({
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
});
</script>

<Story name="Text Inputs" asChild>
	<div class="grid max-w-md gap-4">
		<Label class="grid gap-2">
			表示名
			<Input placeholder="例: サンプルプロジェクト" />
		</Label>
		<Label class="grid gap-2">
			メールアドレス
			<Input type="email" value="support@example.com" />
		</Label>
		<Label class="grid gap-2">
			無効状態
			<Input value="この項目は変更できません" disabled />
		</Label>
	</div>
</Story>

<Story name="Validation State" asChild>
	<div class="grid max-w-md gap-2">
		<Label for="invalid-location-name">表示名</Label>
		<Input id="invalid-location-name" value="" aria-invalid="true" placeholder="表示名を入力" />
		<p class="text-sm text-destructive">表示名を入力してください。</p>
	</div>
</Story>

<Story name="Date And Time" asChild>
	<div class="flex max-w-md flex-wrap gap-3">
		<Label class="grid gap-2">
			日付
			<Input type="date" value="2026-06-25" />
		</Label>
		<Label class="grid gap-2">
			開始時刻
			<Input type="time" value="09:00" step="900" />
		</Label>
	</div>
</Story>
