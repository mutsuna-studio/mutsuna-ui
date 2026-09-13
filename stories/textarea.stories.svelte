<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Textarea from "@mutsuna/ui/textarea/textarea.svelte";

const { Story } = defineMeta({
  title: "Components/Inputs/Textarea",
  component: Textarea,
  tags: ["autodocs"],
});
</script>

<Story name="Default" asChild>
	<div class="grid max-w-xl gap-4">
		<Textarea label="メモ" placeholder="補足情報を入力" />
		<Textarea label="説明文" value="利用者に表示する説明を入力します。必要な注意事項もここで確認できます。" />
	</div>
</Story>
<Story name="States" parameters={{ controls: { disable: true }, options: { showPanel: false } }} asChild>
	<div class="grid max-w-xl gap-4">
		<Textarea label="未入力" placeholder="施設からの連絡事項を入力" />
		<Textarea label="無効" value="この項目は変更できません。" disabled />
		<Textarea label="エラー" aria-invalid="true" value="短すぎます" />
	</div>
</Story>
