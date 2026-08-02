<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Field from "@mutsuna/ui/field/field.svelte";
import FieldDescription from "@mutsuna/ui/field/field-description.svelte";
import FieldGroup from "@mutsuna/ui/field/field-group.svelte";
import FieldLabel from "@mutsuna/ui/field/field-label.svelte";
import EditableText from "@mutsuna/ui/editable-text/editable-text.svelte";

const { Story } = defineMeta({
  title: "UI/Editable Text",
  component: EditableText,
  tags: ["autodocs"],
});
</script>

<Story name="Default" asChild>
	<FieldGroup class="max-w-md">
		<Field>
			<FieldLabel>表示名</FieldLabel>
			<EditableText value="サンプルプロジェクト" aria-label="表示名を編集" />
			<FieldDescription>クリックすると入力欄に切り替わります。</FieldDescription>
		</Field>
	</FieldGroup>
</Story>

<Story name="Empty" asChild>
	<FieldGroup class="max-w-md">
		<Field>
			<FieldLabel>公開名</FieldLabel>
			<EditableText value="" placeholder="名称を設定" aria-label="公開名を編集" />
			<FieldDescription>未入力時は placeholder をテキスト風に表示します。</FieldDescription>
		</Field>
	</FieldGroup>
</Story>

<Story name="Dense List" asChild>
	<div class="grid max-w-xl divide-y rounded-md border">
		<div class="grid grid-cols-[9rem_1fr] items-center gap-3 px-3 py-2">
			<span class="text-sm text-muted-foreground">表示名</span>
			<EditableText value="新しいお知らせ" aria-label="表示名を編集" />
		</div>
		<div class="grid grid-cols-[9rem_1fr] items-center gap-3 px-3 py-2">
			<span class="text-sm text-muted-foreground">管理用メモ</span>
			<EditableText value="平日限定" aria-label="管理用メモを編集" />
		</div>
		<div class="grid grid-cols-[9rem_1fr] items-center gap-3 px-3 py-2">
			<span class="text-sm text-muted-foreground">固定項目</span>
			<EditableText value="変更できない項目" aria-label="固定項目" disabled />
		</div>
	</div>
</Story>
