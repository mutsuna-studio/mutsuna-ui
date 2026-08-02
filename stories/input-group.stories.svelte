<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Button from "@mutsuna/ui/button/button.svelte";
import InputGroup from "@mutsuna/ui/input-group/input-group.svelte";
import InputGroupAddon from "@mutsuna/ui/input-group/input-group-addon.svelte";
import InputGroupButton from "@mutsuna/ui/input-group/input-group-button.svelte";
import InputGroupInput from "@mutsuna/ui/input-group/input-group-input.svelte";
import InputGroupText from "@mutsuna/ui/input-group/input-group-text.svelte";
import InputGroupTextarea from "@mutsuna/ui/input-group/input-group-textarea.svelte";

const { Story } = defineMeta({
  title: "UI/Input Group",
  component: InputGroup,
  tags: ["autodocs"],
});
</script>

<Story name="Inline Addons" asChild>
	<div class="grid max-w-xl gap-4">
		<InputGroup>
			<InputGroupAddon align="inline-start">
				<InputGroupText>¥</InputGroupText>
			</InputGroupAddon>
			<InputGroupInput value="12000" inputmode="numeric" />
			<InputGroupAddon align="inline-end">
				<InputGroupText>月</InputGroupText>
			</InputGroupAddon>
		</InputGroup>
		<InputGroup>
			<InputGroupInput placeholder="検索キーワード" />
			<InputGroupAddon align="inline-end">
				<InputGroupButton>検索</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	</div>
</Story>

<Story name="Block Addon" asChild>
	<InputGroup class="max-w-xl">
		<InputGroupAddon align="block-start" class="border-b">
			<InputGroupText>予約者に表示する説明</InputGroupText>
		</InputGroupAddon>
		<InputGroupTextarea value="会員向けに公開するプランです。対象店舗と受付条件を確認してください。" />
		<InputGroupAddon align="block-end" class="border-t">
			<Button type="button" size="sm" variant="outline">下書き保存</Button>
		</InputGroupAddon>
	</InputGroup>
</Story>

<Story name="Invalid" asChild>
	<InputGroup class="max-w-xl">
		<InputGroupAddon align="inline-start">
			<InputGroupText>分前</InputGroupText>
		</InputGroupAddon>
		<InputGroupInput aria-invalid="true" value="-10" inputmode="numeric" />
	</InputGroup>
</Story>
