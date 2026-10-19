<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { expect, userEvent, within } from "storybook/test";
import { ScrollbarArea } from "@mutsuna/ui/scrollbar";
import Preview from "./scrollbar-preview.svelte";

const { Story } = defineMeta({
  title: "Foundations/Scrollbar",
  component: ScrollbarArea,
  parameters: { controls: { disable: true }, options: { showPanel: false } },
  tags: ["autodocs"],
});
</script>

<Story name="States" asChild><Preview /></Story>
<Story name="Gutter" asChild><Preview mode="gutter" /></Story>

<Story name="Visibility Interaction Test" tags={["!dev", "!autodocs"]} asChild play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByText("非表示", { exact: true })).toBeVisible();
  await userEvent.click(canvas.getByRole("button", { name: "スクロールして確認" }));
  await expect(await canvas.findByText("表示中", { exact: true })).toBeVisible();
  await expect(canvas.getByRole("region", { name: "スクロールのサンプル" }).scrollTop).toBeGreaterThan(0);
  await expect(await canvas.findByText("非表示", { exact: true }, { timeout: 2000 })).toBeVisible();
}}><Preview /></Story>

<Story name="Gutter Interaction Test" tags={["!dev", "!autodocs"]} asChild play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const sample = canvas.getByRole("region", { name: "スクロールのサンプル" });
  await expect(sample.scrollHeight).toBe(sample.clientHeight);
  await userEvent.click(canvas.getByRole("checkbox", { name: "内容を増やしてスクロールを発生させる" }));
  await expect(sample.scrollHeight).toBeGreaterThan(sample.clientHeight);
  await userEvent.click(canvas.getByRole("button", { name: /次の候補/ }));
  await expect(sample).toHaveClass("mutsuna-scrollbar--both-edges");
  await userEvent.click(canvas.getByRole("button", { name: /次の候補/ }));
  await expect(sample).toHaveClass("mutsuna-scrollbar--auto");
}}><Preview mode="gutter" /></Story>
