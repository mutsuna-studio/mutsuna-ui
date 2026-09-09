<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { MonthPicker } from "@mutsuna/ui/month-picker";
const { Story } = defineMeta({ title: "Components/Inputs/MonthPicker", component: MonthPicker, tags: ["autodocs"] });
</script>

<Story name="Default" asChild play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const body = within(canvasElement.ownerDocument.body);
  const trigger = canvas.getByRole("button", { name: "対象年月: 2026年9月" });
  await userEvent.click(trigger);
  await userEvent.click(await body.findByRole("button", { name: "2027年" }));
  await expect(canvasElement.querySelector('input[name="month"]')).toHaveValue("2026-09");
  await expect(body.getByRole("button", { name: "6月" })).toBeDisabled();
  const may = body.getByRole("button", { name: "5月" });
  may.focus();
  await userEvent.keyboard("{Enter}");
  await expect(trigger).toHaveTextContent("2027年5月");
  await expect(canvasElement.querySelector('input[name="month"]')).toHaveValue("2027-05");
  await waitFor(() => expect(trigger).toHaveFocus());
  await userEvent.click(trigger);
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(trigger).toHaveFocus());
}}>
  <MonthPicker ariaLabel="対象年月" name="month" value="2026-09" min="2026-09" max="2027-05" class="w-56" />
</Story>

<Story name="States" asChild>
  <div class="grid max-w-xs gap-4">
    <MonthPicker ariaLabel="未選択" />
    <MonthPicker ariaLabel="選択済み" value="2026-09" />
    <MonthPicker ariaLabel="小サイズ" size="sm" value="2026-09" />
    <MonthPicker ariaLabel="無効" disabled value="2026-09" />
    <MonthPicker ariaLabel="エラー" aria-invalid={true} aria-describedby="month-error" />
    <p id="month-error" class="text-sm text-destructive">年月を選択してください。</p>
    <MonthPicker ariaLabel="一つの月のみ" min="2026-09" max="2026-09" class="w-40" />
  </div>
</Story>


<Story name="Direct Input" asChild play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const body = within(canvasElement.ownerDocument.body);
  const trigger = canvas.getByRole("button", { name: "直接入力: 2026年9月" });
  await userEvent.click(trigger);
  const input = await body.findByRole("textbox", { name: "年月を直接入力" });
  await userEvent.clear(input);
  await userEvent.type(input, "abc１２３-/");
  await expect(input).toHaveValue("");
  await expect(body.queryByRole("button", { name: "確定" })).not.toBeInTheDocument();
  await userEvent.type(input, "202613");
  await expect(await body.findByRole("alert")).toHaveTextContent("形式");
  await expect(canvasElement.querySelector('input[name="direct"]')).toHaveValue("2026-09");
  await userEvent.clear(input);
  await userEvent.type(input, "202801{Enter}");
  await expect(body.getByRole("alert")).toHaveTextContent("範囲");
  await userEvent.clear(input);
  await userEvent.type(input, "202703");
  await userEvent.click(body.getByRole("button", { name: "2026年" }));
  await expect(input).toHaveValue("202603");
  await userEvent.clear(input);
  await userEvent.type(input, "202703{Enter}");
  await expect(trigger).toHaveTextContent("2027年3月");
  await expect(canvasElement.querySelector('input[name="direct"]')).toHaveValue("2027-03");
  await waitFor(() => expect(trigger).toHaveFocus());
}}>
  <MonthPicker ariaLabel="直接入力" value="2026-09" name="direct" min="2026-01" max="2027-12" />
</Story>
