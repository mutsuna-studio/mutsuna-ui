<script module lang="ts">
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import { defineMeta } from "@storybook/addon-svelte-csf";
import Label from "@mutsuna/ui/label/label.svelte";
import TimePicker from "@mutsuna/ui/time-picker/time-picker.svelte";

const { Story } = defineMeta({
  title: "Components/Inputs/Time Picker",
  component: TimePicker,
  tags: ["autodocs"],
});
</script>

<script lang="ts">
let startTime = $state("09:00");
let endTime = $state("10:00");
let scrollableTime = $state("12:30");
</script>

<Story name="Default" parameters={{ controls: { disable: true }, options: { showPanel: false } }} asChild>
	<div class="grid max-w-sm gap-5">
		<div class="grid grid-cols-2 gap-3">
			<Label class="grid gap-2">
				開始
				<TimePicker bind:value={startTime} />
			</Label>
			<Label class="grid gap-2">
				終了
				<TimePicker bind:value={endTime} />
			</Label>
		</div>
		<div class="grid grid-cols-2 gap-3">
			<Label class="grid gap-2">
				5分刻み
				<TimePicker bind:value={scrollableTime} minuteStep={5} />
			</Label>
			<Label class="grid gap-2">
				無効
				<TimePicker value="18:00" disabled />
			</Label>
		</div>
	</div>
</Story>

<Story name="Direct Input Interaction Test" tags={["!dev", "!autodocs"]} asChild play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const screen = within(canvasElement.ownerDocument.body);
  await userEvent.click(canvas.getByRole("button", { name: "時間" }));
  const hour = await screen.findByRole("spinbutton", { name: "時" });
  const minute = screen.getByRole("spinbutton", { name: "分" });
  await waitFor(() => expect(hour).toHaveFocus());
  await userEvent.click(hour);
  await fireEvent.input(hour, { target: { value: "１４" } });
  await userEvent.keyboard("{Tab}");
  await waitFor(() => expect(minute).toHaveFocus());
  await expect(hour).toHaveValue("14");
  await fireEvent.input(minute, { target: { value: "２b７" } });
  await expect(minute).toHaveValue("27");
  await userEvent.keyboard("{Tab}");
  await expect(hour).toHaveFocus();
  await expect(minute).toHaveAttribute("aria-valuenow", "25");
  await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
  await expect(minute).toHaveFocus();
  await waitFor(() => expect(minute).toHaveProperty("selectionStart", 0));
  await waitFor(() => expect(minute).toHaveProperty("selectionEnd", 2));
  await userEvent.keyboard("{ArrowDown}");
  await expect(minute).toHaveAttribute("aria-valuenow", "45");
  await userEvent.click(hour);
  await fireEvent.input(hour, { target: { value: "9:37" } });
  await userEvent.keyboard("{Enter}");
  await expect(hour).toHaveAttribute("aria-valuenow", "9");
  await expect(minute).toHaveAttribute("aria-valuenow", "35");
  await userEvent.click(hour);
  await fireEvent.input(hour, { target: { value: "０．５" } });
  await userEvent.keyboard("{Enter}");
  await expect(hour).toHaveAttribute("aria-valuenow", "12");
  await expect(minute).toHaveAttribute("aria-valuenow", "0");
  await userEvent.keyboard("{Escape}");
}}>
  <TimePicker value="09:00" />
</Story>
