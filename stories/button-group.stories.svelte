<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { Button } from "@mutsuna/ui/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@mutsuna/ui/button-group";

const { Story } = defineMeta({
  title: "UI/Button Group",
  component: ButtonGroup,
  tags: ["autodocs"],
});
</script>

<Story name="Horizontal" asChild>
	<ButtonGroup>
		<Button variant="outline">前へ</Button>
		<ButtonGroupText>2 / 5</ButtonGroupText>
		<Button variant="outline">次へ</Button>
	</ButtonGroup>
</Story>

<Story name="With Separator" asChild>
	<ButtonGroup>
		<Button>保存</Button>
		<ButtonGroupSeparator />
		<Button variant="secondary">下書き</Button>
	</ButtonGroup>
</Story>

<Story name="Vertical" asChild>
	<ButtonGroup orientation="vertical">
		<Button variant="outline">概要</Button>
		<Button variant="outline">公開設定</Button>
		<Button variant="outline">通知</Button>
	</ButtonGroup>
</Story>
