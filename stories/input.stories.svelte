<script module lang="ts">
import { expect, userEvent, waitFor, within } from "storybook/test";
import { defineMeta } from "@storybook/addon-svelte-csf";
import Label from "@mutsuna/ui/label/label.svelte";
import Input from "@mutsuna/ui/input/input.svelte";

const { Story } = defineMeta({
  title: "Components/Inputs/Input",
  component: Input,
  tags: ["autodocs"],
});
</script>

<Story name="States" parameters={{ controls: { disable: true }, options: { showPanel: false } }} asChild>
	<section class="grid max-w-3xl gap-4" aria-labelledby="input-states-heading">
		<div class="space-y-1">
			<h2 id="input-states-heading" class="text-sm font-medium">Input states</h2>
			<p class="text-muted-foreground text-xs">入力前・入力済み・読み取り専用・無効・エラー・長文を比較する。</p>
		</div>
		<div class="grid gap-4 sm:grid-cols-2">
			<Label class="grid gap-2">
				未入力
				<Input placeholder="表示名を入力" />
			</Label>
			<Label class="grid gap-2">
				入力済み
				<Input value="サンプルプロジェクト" />
			</Label>
			<Label class="grid gap-2">
				読み取り専用
				<Input value="自動発行された識別コード" readonly />
			</Label>
			<Label class="grid gap-2">
				無効
				<Input value="この項目は変更できません" disabled />
			</Label>
			<div class="grid gap-2">
				<Label for="states-invalid-input">エラー</Label>
				<Input id="states-invalid-input" value="短すぎます" aria-invalid="true" aria-describedby="states-invalid-input-error" />
				<p id="states-invalid-input-error" class="text-destructive text-xs">3文字以上で入力してください。</p>
			</div>
			<Label class="grid min-w-0 gap-2">
				長い値
				<Input value="複数拠点で共通利用する非常に長いプロジェクト表示名のサンプル" />
			</Label>
		</div>
	</section>
</Story>

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


<Story name="Floating Label" asChild play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const input = canvas.getByRole("textbox", { name: "表示名" });
  const label = canvas.getByText("表示名", { selector: "label" });
  const position = () => Math.round(label.getBoundingClientRect().top);
  const initial = position();
  await userEvent.click(label);
  await expect(input).toHaveFocus();
  await waitFor(() => expect(position()).toBeLessThan(initial));
  await userEvent.type(input, "サンプル");
  await userEvent.tab();
  await waitFor(() => expect(position()).toBeLessThan(initial));
  await userEvent.clear(input);
  await userEvent.tab();
  await waitFor(() => expect(position()).toBe(initial));
}}>
  <div class="grid w-full max-w-md gap-6 p-4">
    <Input label="表示名" />
    <Input label="メールアドレス" type="email" value="hello@example.com" />
    <Input label="パスワード" type="password" />
    <Input label="読み取り専用" value="変更不可" readonly />
    <Input label="無効" disabled />
    <Input label="エラー" aria-invalid="true" aria-describedby="floating-error" />
    <p id="floating-error" class="text-sm text-destructive">入力してください。</p>
    <Input label="日付" type="date" />
  </div>
</Story>
