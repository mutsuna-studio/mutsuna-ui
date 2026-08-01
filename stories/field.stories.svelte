<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Checkbox from "@mutsuna/ui/checkbox/checkbox.svelte";
import Input from "@mutsuna/ui/input/input.svelte";
import Field from "@mutsuna/ui/field/field.svelte";
import FieldContent from "@mutsuna/ui/field/field-content.svelte";
import FieldDescription from "@mutsuna/ui/field/field-description.svelte";
import FieldError from "@mutsuna/ui/field/field-error.svelte";
import FieldGroup from "@mutsuna/ui/field/field-group.svelte";
import FieldLabel from "@mutsuna/ui/field/field-label.svelte";
import FieldLegend from "@mutsuna/ui/field/field-legend.svelte";
import FieldSet from "@mutsuna/ui/field/field-set.svelte";

const { Story } = defineMeta({
  title: "UI/Field",
  component: Field,
  tags: ["autodocs"],
});
</script>

<Story name="Default" asChild>
	<FieldGroup class="max-w-xl">
		<Field>
			<FieldLabel>店舗名</FieldLabel>
			<Input value="六名工房 岡崎店" />
			<FieldDescription>予約者向けページと管理画面に表示されます。</FieldDescription>
		</Field>
		<Field data-invalid="true">
			<FieldLabel>店舗コード</FieldLabel>
			<Input aria-invalid="true" value="" placeholder="例: okazaki" />
			<FieldError errors={[{ message: "店舗コードを入力してください。" }]} />
		</Field>
	</FieldGroup>
</Story>

<Story name="Horizontal" asChild>
	<FieldGroup class="max-w-xl">
		<Field orientation="horizontal">
			<FieldLabel>公開状態</FieldLabel>
			<Checkbox checked />
			<FieldContent>
				<FieldDescription>公開すると予約者がこの利用プランを確認できます。</FieldDescription>
			</FieldContent>
		</Field>
	</FieldGroup>
</Story>

<Story name="Field Set" asChild>
	<FieldSet class="max-w-xl">
		<FieldLegend>通知設定</FieldLegend>
		<FieldDescription>予約の変更やキャンセル時に通知する対象を選びます。</FieldDescription>
		<FieldGroup>
			<Field orientation="horizontal">
				<Checkbox checked />
				<FieldLabel>店舗スタッフへ通知</FieldLabel>
			</Field>
			<Field orientation="horizontal">
				<Checkbox />
				<FieldLabel>予約者へ控えを送信</FieldLabel>
			</Field>
		</FieldGroup>
	</FieldSet>
</Story>
