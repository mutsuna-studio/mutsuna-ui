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
			メモ
			<Textarea placeholder="補足情報を入力" />
		</Label>
		<Label class="grid gap-2">
			説明文
			<Textarea value="利用者に表示する説明を入力します。必要な注意事項もここで確認できます。" />
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
			<Textarea value="この項目は変更できません。" disabled />
		</Label>
		<Label class="grid gap-2">
			エラー
			<Textarea aria-invalid="true" value="短すぎます" />
		</Label>
	</div>
</Story>
