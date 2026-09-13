<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { CycleSelect } from "@mutsuna/ui/cycle-select";
const options = [
  { value: "a", label: "コンパクト" },
  { value: "disabled", label: "選択不可", disabled: true },
  { value: "b", label: "標準" },
  { value: "c", label: "詳細" },
];
const { Story } = defineMeta({ title: "Components/Inputs/Select/CycleSelect", component: CycleSelect, tags: ["autodocs"] });
</script>

<Story name="操作" asChild>
  {@render control()}
</Story>

{#snippet control()}
  <CycleSelect {options} value="a" name="display" ariaLabel="表示形式" class="w-64" />
{/snippet}

<Story name="Interaction Test" tags={["!dev", "!autodocs"]} asChild play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const next = canvas.getByRole("button", { name: /次の候補/ });
  const controls = canvas.getAllByRole("button");
  await expect(Math.abs(controls[0].getBoundingClientRect().right - controls[1].getBoundingClientRect().left - 1)).toBeLessThan(0.1);
  for (const control of controls) {
    control.focus();
    await expect(control).toHaveFocus();
    const style = getComputedStyle(control);
    for (const side of ["top", "right", "bottom", "left"]) {
      await expect(style.getPropertyValue(`border-${side}-width`)).toBe("1px");
      await expect(style.getPropertyValue(`border-${side}-color`)).toBe(style.borderTopColor);
    }
    await expect(Number(style.zIndex)).toBeGreaterThan(0);
  }
  await userEvent.click(next);
  await expect(next).toHaveTextContent("標準");
  await userEvent.keyboard("{Enter}");
  await expect(next).toHaveTextContent("詳細");
  await userEvent.keyboard(" ");
  await expect(next).toHaveTextContent("コンパクト");
  await userEvent.click(canvas.getByRole("button", { name: "表示形式: 候補一覧" }));
  const body = within(canvasElement.ownerDocument.body);
  const list = await body.findByRole("listbox");
  await waitFor(() => {
    const groupRect = canvas.getByRole("group").getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    expect(Math.abs(groupRect.width - listRect.width)).toBeLessThan(2);
    expect(Math.abs(groupRect.left - listRect.left)).toBeLessThan(2);
  });
  await userEvent.click(await body.findByRole("option", { name: "詳細" }));
  await expect(next).toHaveTextContent("詳細");
  await waitFor(() => expect(body.queryByRole("listbox")).not.toBeInTheDocument());
  await expect(canvasElement.querySelector('input[name="display"]')).toHaveValue("c");
}}>
  {@render control()}
</Story>

<Story name="States" asChild>
  {@render states()}
</Story>

<Story name="States Interaction Test" tags={["!dev", "!autodocs"]} asChild play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const empty = within(canvas.getByRole("group", { name: "未選択" }));
  const advance = empty.getByRole("button", { name: /次の候補/ });
  await userEvent.click(advance);
  await expect(advance).toHaveTextContent("コンパクト");
  for (const name of ["無効", "候補なし", "全候補無効"]) {
    for (const button of within(canvas.getByRole("group", { name })).getAllByRole("button")) {
      await expect(button).toBeDisabled();
    }
  }
  const single = within(canvas.getByRole("group", { name: "候補が一つ" }));
  await expect(single.getByRole("button", { name: /次の候補/ })).toBeDisabled();
  await expect(single.getByRole("button", { name: /候補一覧/ })).toBeEnabled();
}}>
  {@render states()}
</Story>

{#snippet states()}
  <div class="grid w-full max-w-xs gap-4">
    <CycleSelect {options} ariaLabel="未選択" class="w-full" />
    <CycleSelect {options} value="a" ariaLabel="小サイズ" size="sm" />
    <CycleSelect {options} value="a" ariaLabel="無効" disabled />
    <CycleSelect options={[]} ariaLabel="候補なし" />
    <CycleSelect options={[options[0]]} value="a" ariaLabel="候補が一つ" />
    <CycleSelect options={[options[1]]} ariaLabel="全候補無効" />
    <CycleSelect {options} ariaLabel="エラー" aria-invalid aria-describedby="cycle-error" />
    <p id="cycle-error" class="text-sm text-destructive">候補を選択してください。</p>
    <CycleSelect options={[{ value: "long", label: "狭い表示領域でも収まる非常に長い候補の名前" }, options[0]]} value="long" ariaLabel="長文" class="w-48" />
  </div>
{/snippet}
