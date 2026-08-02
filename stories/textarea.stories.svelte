<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Label from "@mutsuna/ui/label/label.svelte";
import Textarea from "@mutsuna/ui/textarea/textarea.svelte";

const { Story } = defineMeta({
  title: "UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
});
</script>

<Story name="Default" asChild>
	<div class="grid max-w-xl gap-4">
		<Label class="grid gap-2">
			予約メモ
			<Textarea placeholder="受付時に確認することを入力" />
		</Label>
		<Label class="grid gap-2">
			説明文
			<Textarea value="会員向けに公開するプラン説明を入力します。受付条件や注意事項もここで確認できます。" />
		</Label>
	</div>
</Story>
<Story name="States" asChild>
	<div class="grid max-w-xl gap-4">
		<Label class="grid gap-2">
			未入力
			<Textarea placeholder="施設からの連絡事項を入力" />
		</Label>
		<Label class="grid gap-2">
			無効
			<Textarea value="契約プランで固定されています。" disabled />
		</Label>
		<Label class="grid gap-2">
			エラー
			<Textarea aria-invalid="true" value="短すぎます" />
		</Label>
	</div>
</Story>
