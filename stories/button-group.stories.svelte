<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { expect, userEvent, within } from "storybook/test";
import { Button } from "@mutsuna/ui/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@mutsuna/ui/button-group";

const { Story } = defineMeta({
  title: "Components/Actions/Button Group",
  component: ButtonGroup,
  tags: ["autodocs"],
});
async function checkFocusBorders({ canvasElement }: { canvasElement: HTMLElement }) {
  const buttons = within(canvasElement).getAllByRole("button");
  for (const button of buttons) {
    button.focus();
    const style = getComputedStyle(button);
    await expect(button).toHaveFocus();
    for (const side of ["Top", "Right", "Bottom", "Left"]) {
      await expect(style.getPropertyValue(`border-${side.toLowerCase()}-width`)).toBe("1px");
      await expect(style.getPropertyValue(`border-${side.toLowerCase()}-color`)).toBe(style.borderTopColor);
    }
    await expect(Number(style.zIndex)).toBeGreaterThan(0);
    const group = button.closest('[data-slot="button-group"]')!;
    const vertical = group.getAttribute("data-orientation") === "vertical";
    const next = button.nextElementSibling as HTMLElement | null;
    if (next) {
      const rect = button.getBoundingClientRect(), nextRect = next.getBoundingClientRect();
      await expect(Math.abs((vertical ? rect.bottom - nextRect.top : rect.right - nextRect.left) - 1)).toBeLessThan(0.1);
    }
    await userEvent.tab();
  }
}
</script>

<Story name="Horizontal" asChild>
  {#snippet children()}
    {@render horizontal()}
  {/snippet}
</Story>

{#snippet horizontal()}
	<ButtonGroup>
		<Button variant="outline">前へ</Button>
		<ButtonGroupText>2 / 5</ButtonGroupText>
		<Button variant="outline">次へ</Button>
	</ButtonGroup>
{/snippet}

<Story name="Focus Border Horizontal Test" tags={["!dev", "!autodocs"]} play={checkFocusBorders} asChild>
  {@render horizontal()}
</Story>

<Story name="With Separator" asChild>
	<ButtonGroup>
		<Button>保存</Button>
		<ButtonGroupSeparator />
		<Button variant="secondary">下書き</Button>
	</ButtonGroup>
</Story>

<Story name="Vertical" asChild>
  {@render vertical()}
</Story>

<Story name="Focus Border Vertical Test" tags={["!dev", "!autodocs"]} play={checkFocusBorders} asChild>
  {@render vertical()}
</Story>

{#snippet vertical()}
	<ButtonGroup orientation="vertical">
		<Button variant="outline">概要</Button>
		<Button variant="outline">公開設定</Button>
		<Button variant="outline">通知</Button>
	</ButtonGroup>
{/snippet}
