<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { Input } from "@mutsuna/ui/input";
import { Label } from "@mutsuna/ui/label";

const { Story } = defineMeta({
  title: "UI/Label",
  component: Label,
  tags: ["autodocs"],
});
</script>

<Story name="Default" asChild>
	<div class="grid max-w-sm gap-2">
		<Label for="display-name">表示名</Label>
		<Input id="display-name" placeholder="表示名を入力" />
	</div>
</Story>

<Story name="Disabled" asChild>
	<div class="group grid max-w-sm gap-2" data-disabled="true">
		<Label for="fixed-plan">契約プラン</Label>
		<Input id="fixed-plan" value="Standard" disabled />
	</div>
</Story>
