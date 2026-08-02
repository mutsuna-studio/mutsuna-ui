<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { Switch } from "@mutsuna/ui/switch";

const { Story } = defineMeta({
  title: "UI/Switch",
  component: Switch,
  tags: ["autodocs"],
});
</script>

<Story name="States" asChild>
	<div class="grid max-w-sm gap-4">
		<label class="flex items-center justify-between gap-4 text-sm">
			<span>予約受付を有効にする</span>
			<Switch checked />
		</label>
		<label class="flex items-center justify-between gap-4 text-sm">
			<span>メール通知を有効にする</span>
			<Switch />
		</label>
		<label class="text-muted-foreground flex items-center justify-between gap-4 text-sm">
			<span>契約プランで固定</span>
			<Switch disabled />
		</label>
		<label class="flex items-center justify-between gap-4 text-sm">
			<span>小さいサイズ</span>
			<Switch size="sm" />
		</label>
	</div>
</Story>
