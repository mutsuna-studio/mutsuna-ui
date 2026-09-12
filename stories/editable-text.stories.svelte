<script module lang="ts">
import { tick } from "svelte";
import { defineMeta } from "@storybook/addon-svelte-csf";
import { expect, fireEvent, userEvent, within } from "storybook/test";
import Field from "@mutsuna/ui/field/field.svelte";
import FieldDescription from "@mutsuna/ui/field/field-description.svelte";
import FieldGroup from "@mutsuna/ui/field/field-group.svelte";
import FieldLabel from "@mutsuna/ui/field/field-label.svelte";
import EditableText from "@mutsuna/ui/editable-text/editable-text.svelte";
import { Button } from "@mutsuna/ui/button";

const { Story } = defineMeta({
  title: "Components/Inputs/Editable Text",
  component: EditableText,
  tags: ["autodocs"],
});
</script>

<script lang="ts">
let multilineTestValue = $state("最初の説明");
let tabName = $state("概要");
let selectedTab = $state<"overview" | "details">("details");
let actionName = $state("レポートを作成");
let reportRunCount = $state(0);
let doubleClickTestValue = $state("ダブルクリックで編集");
let doubleClickActionCount = $state(0);
let commitCount = $state(0);
let cancelCount = $state(0);
let blurCommitCount = $state(0);
let locked = $state(false);
let guardedActionCount = $state(0);
let displayKeyCount = $state(0);
let displayDoubleCount = $state(0);
let customRef = $state<HTMLButtonElement | null>(null);
</script>

<Story name="Default" asChild>
	<FieldGroup class="max-w-md">
		<Field>
			<FieldLabel>表示名</FieldLabel>
			<EditableText value="サンプルプロジェクト" aria-label="表示名を編集" />
			<FieldDescription>クリックすると入力欄に切り替わります。</FieldDescription>
		</Field>
		<Field>
			<FieldLabel>説明</FieldLabel>
			<EditableText multiline value={'複数行の説明文です。\nクリックすると、その場で編集できます。'} aria-label="説明を編集" />
			<FieldDescription>Enterで改行、Cmd/Ctrl+Enterで確定します。</FieldDescription>
		</Field>
	</FieldGroup>
</Story>

<Story name="Double Click Compositions" asChild>
  <section class="grid max-w-md gap-6 p-2">
    <div class="grid gap-2">
      <h2 class="text-sm font-medium">タブ名の編集</h2>
      <p class="text-xs text-muted-foreground">単クリックでタブを選択し、ダブルクリックで名前を編集します。</p>
      <div class="inline-flex w-fit items-center rounded-lg border bg-muted/30 p-1" role="tablist" aria-label="表示内容">
        <EditableText
          bind:value={tabName}
          editOn="doubleClick"
          role="tab"
          aria-selected={selectedTab === "overview"}
          aria-label={`${tabName}タブ。ダブルクリックで名前を編集`}
          onclick={() => selectedTab = "overview"}
        >
          {#snippet trigger({ value, props })}
            <Button {...props} variant={selectedTab === "overview" ? "outline" : "ghost"} size="sm">{value}</Button>
          {/snippet}
        </EditableText>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          role="tab"
          aria-selected={selectedTab === "details"}
          class={selectedTab === "details" ? "h-7 bg-background px-2 shadow-sm hover:bg-background" : "h-7 px-2"}
          onclick={() => selectedTab = "details"}
        >詳細</Button>
      </div>
    </div>

    <div class="grid gap-2">
      <h2 class="text-sm font-medium">アクション名の編集</h2>
      <p class="text-xs text-muted-foreground">既存のButtonをtriggerとして使い、単クリックは実行、ダブルクリックは名前の編集として扱います。</p>
      <EditableText
        bind:value={actionName}
        editOn="doubleClick"
        aria-label={`${actionName}。ダブルクリックで名前を編集`}
        onclick={() => reportRunCount += 1}
      >
        {#snippet trigger({ value, props })}
          <Button {...props}>{value}</Button>
        {/snippet}
      </EditableText>
      <p class="text-xs text-muted-foreground" aria-live="polite">実行回数: {reportRunCount}</p>
    </div>
  </section>
</Story>

<Story name="Double Click Interaction Test" tags={["!dev", "!autodocs"]} asChild play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const trigger = canvas.getByRole("button", { name: "ダブルクリック編集" });
  const displayWidth = trigger.getBoundingClientRect().width;
  await userEvent.click(trigger);
  await new Promise((resolve) => setTimeout(resolve, 300));
  await expect(canvas.getByTestId("double-click-action-count")).toHaveTextContent("1");
  await expect(canvas.queryByRole("textbox", { name: "ダブルクリック編集" })).not.toBeInTheDocument();
  await userEvent.dblClick(trigger);
  const textbox = canvas.getByRole("textbox", { name: "ダブルクリック編集" });
  await expect(textbox).toHaveFocus();
  await expect(Math.abs(textbox.getBoundingClientRect().width - displayWidth)).toBeLessThan(1);
  await new Promise((resolve) => setTimeout(resolve, 300));
  await expect(canvas.getByTestId("double-click-action-count")).toHaveTextContent("1");
  await userEvent.keyboard("{Escape}");
  await expect(canvas.getByRole("button", { name: "ダブルクリック編集" })).toHaveFocus();
  await userEvent.keyboard("{F2}");
  await expect(canvas.getByRole("textbox", { name: "ダブルクリック編集" })).toHaveFocus();
}}>
  <div>
    <EditableText bind:value={doubleClickTestValue} editOn="doubleClick" aria-label="ダブルクリック編集" onclick={() => doubleClickActionCount += 1}>
      {#snippet trigger({ value, props })}
        <Button {...props}>{value}</Button>
      {/snippet}
    </EditableText>
    <span data-testid="double-click-action-count">{doubleClickActionCount}</span>
  </div>
</Story>

<Story name="Multiline Interaction Test" tags={["!dev", "!autodocs"]} asChild play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByRole("button", { name: "単一行を編集" }).getBoundingClientRect().width).toBeLessThan(canvas.getByTestId("singleline-field").getBoundingClientRect().width);
  const display = canvas.getByRole("button", { name: "複数行を編集" });
  await expect(display.getBoundingClientRect().width).toBeLessThan(canvas.getByTestId("multiline-field").getBoundingClientRect().width);
  await userEvent.click(display);
  const textarea = canvas.getByRole("textbox", { name: "複数行を編集" }) as HTMLTextAreaElement;
  await expect(textarea.tagName).toBe("TEXTAREA");
  await userEvent.keyboard("更新後の1行目{Enter}更新後の2行目");
  await expect(textarea).toHaveValue("更新後の1行目\n更新後の2行目");
  await userEvent.keyboard("{Control>}{Enter}{/Control}");
  await expect(canvas.getByRole("button", { name: "複数行を編集" }).textContent).toBe("更新後の1行目\n更新後の2行目");
}}>
  <div class="grid max-w-md gap-3">
    <Field data-testid="singleline-field">
      <EditableText value="単一行" aria-label="単一行を編集" />
    </Field>
    <Field data-testid="multiline-field">
      <EditableText multiline bind:value={multilineTestValue} aria-label="複数行を編集" />
    </Field>
  </div>
</Story>

<Story name="Focus Interaction Test" tags={["!dev", "!autodocs"]} asChild play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole("button", { name: "全選択編集" }));
  const defaultInput = canvas.getByRole("textbox", { name: "全選択編集" }) as HTMLInputElement;
  await expect(defaultInput.selectionStart).toBe(0);
  await expect(defaultInput.selectionEnd).toBe(defaultInput.value.length);
  await userEvent.keyboard("{Escape}");
  const customTrigger = canvas.getByRole("button", { name: "通常編集" });
  const triggerWidth = customTrigger.getBoundingClientRect().width;
  await userEvent.click(customTrigger);
  const selectInput = canvas.getByRole("textbox", { name: "通常編集" }) as HTMLInputElement;
  await expect(selectInput.selectionStart).toBe(selectInput.selectionEnd);
  await expect(Math.abs(selectInput.getBoundingClientRect().width - triggerWidth)).toBeLessThan(1);
}}>
  <div class="grid max-w-md gap-3">
    <EditableText value="上書き用の編集" aria-label="全選択編集" />
    <EditableText value="通常の編集" aria-label="通常編集" selectOnEdit={false}>
      {#snippet trigger({ value, props })}
        <Button {...props}>{value}</Button>
      {/snippet}
    </EditableText>
  </div>
</Story>

<Story name="Empty" asChild>
	<FieldGroup class="max-w-md">
		<Field>
			<FieldLabel>公開名</FieldLabel>
			<EditableText value="" placeholder="名称を設定" aria-label="公開名を編集" />
			<FieldDescription>未入力時は placeholder をテキスト風に表示します。</FieldDescription>
		</Field>
	</FieldGroup>
</Story>

<Story name="Dense List" asChild>
	<div class="grid max-w-xl divide-y rounded-md border">
		<div class="grid grid-cols-[9rem_1fr] items-center gap-3 px-3 py-2">
			<span class="text-sm text-muted-foreground">表示名</span>
			<EditableText value="新しいお知らせ" aria-label="表示名を編集" />
		</div>
		<div class="grid grid-cols-[9rem_1fr] items-center gap-3 px-3 py-2">
			<span class="text-sm text-muted-foreground">管理用メモ</span>
			<EditableText value="平日限定" aria-label="管理用メモを編集" />
		</div>
		<div class="grid grid-cols-[9rem_1fr] items-center gap-3 px-3 py-2">
			<span class="text-sm text-muted-foreground">固定項目</span>
			<EditableText value="変更できない項目" aria-label="固定項目" disabled />
		</div>
	</div>
</Story>


<Story name="Editing Lifecycle Test" tags={["!dev", "!autodocs"]} asChild play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole("button", { name: "編集ライフサイクル" }));
  let input = canvas.getByRole("textbox");
  await userEvent.keyboard("変更後");
  // IME confirmation must not finish editing.
  await fireEvent.keyDown(input, { key: "Enter", isComposing: true });
  await fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
  await expect(input).toHaveFocus();
  await expect(canvas.getByTestId("commits")).toHaveTextContent("0");
  await userEvent.keyboard("{Enter}");
  await expect(canvas.getByRole("button", { name: "編集ライフサイクル" })).toHaveFocus();
  await expect(canvas.getByRole("button", { name: "編集ライフサイクル" })).toHaveTextContent("変更後");
  await expect(canvas.getByTestId("commits")).toHaveTextContent("1");
  // Unchanged commits do not notify again.
  await userEvent.keyboard("{Enter}{Enter}");
  await expect(canvas.getByTestId("commits")).toHaveTextContent("1");
  await userEvent.click(canvas.getByRole("button", { name: "編集ライフサイクル" }));
  input = canvas.getByRole("textbox");
  await userEvent.keyboard("破棄");
  // A blur arriving in the same turn as Escape must not notify twice.
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  input.dispatchEvent(new FocusEvent("blur"));
  await tick();
  await expect(canvas.getByTestId("cancels")).toHaveTextContent("1");
  await expect(canvas.getByRole("button", { name: "編集ライフサイクル" })).toHaveTextContent("変更後");
  await userEvent.click(canvas.getByRole("button", { name: "編集ライフサイクル" }));
  await userEvent.keyboard("blurで破棄");
  await userEvent.click(canvas.getByRole("button", { name: "次の操作" }));
  await expect(canvas.getByRole("button", { name: "次の操作" })).toHaveFocus();
  await expect(canvas.getByTestId("cancels")).toHaveTextContent("2");
  await expect(canvas.getByRole("button", { name: "編集ライフサイクル" })).toHaveTextContent("変更後");
  await userEvent.click(canvas.getByRole("button", { name: "blur確定" }));
  await userEvent.keyboard("blur後");
  await userEvent.click(canvas.getByRole("button", { name: "次の操作" }));
  await expect(canvas.getByRole("button", { name: "次の操作" })).toHaveFocus();
  await expect(canvas.getByRole("button", { name: "blur確定" })).toHaveTextContent("blur後");
  await expect(canvas.getByTestId("blur-commits")).toHaveTextContent("1");
}}>
  <div>
    <EditableText value="元の値" aria-label="編集ライフサイクル" commitOnBlur={false}
      onCommit={() => commitCount += 1} onCancel={() => cancelCount += 1} />
    <EditableText value="blur前" aria-label="blur確定" onCommit={() => blurCommitCount += 1} />
    <span data-testid="blur-commits">{blurCommitCount}</span>
    <button type="button">次の操作</button>
    <span data-testid="commits">{commitCount}</span>
    <span data-testid="cancels">{cancelCount}</span>
  </div>
</Story>

<Story name="Trigger Event Contract Test" tags={["!dev", "!autodocs"]} asChild play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const trigger = canvas.getByRole("button", { name: "イベント連携" });
  await expect(canvas.getByTestId("ref-attached")).toHaveTextContent("true");
  await expect(trigger).toHaveAttribute("data-slot", "editable-text");
  await userEvent.dblClick(trigger);
  await expect(canvas.queryByRole("textbox")).not.toBeInTheDocument();
  await expect(canvas.getByTestId("double-events")).toHaveTextContent("1");
  trigger.focus();
  await userEvent.keyboard("{F2}");
  await expect(canvas.queryByRole("textbox")).not.toBeInTheDocument();
  await expect(canvas.getByTestId("key-events")).toHaveTextContent("1");
  await userEvent.click(canvas.getByRole("button", { name: "クリックを抑止" }));
  await expect(canvas.queryByRole("textbox")).not.toBeInTheDocument();
}}>
  <div>
    <EditableText value="イベント連携" aria-label="イベント連携" editOn="doubleClick" bind:ref={customRef}
      onkeydown={(event) => { displayKeyCount += 1; event.preventDefault(); }}
      ondblclick={(event) => { displayDoubleCount += 1; event.preventDefault(); }}>
      {#snippet trigger({ value, props })}<Button {...props}>{value}</Button>{/snippet}
    </EditableText>
    <EditableText value="抑止" aria-label="クリックを抑止" onclick={(event) => event.preventDefault()} />
    <span data-testid="ref-attached">{customRef !== null}</span>
    <span data-testid="key-events">{displayKeyCount}</span>
    <span data-testid="double-events">{displayDoubleCount}</span>
  </div>
</Story>

<Story name="Pending Action Test" tags={["!dev", "!autodocs"]} asChild play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole("button", { name: "待機アクション" }));
  await userEvent.keyboard("{F2}{Escape}");
  await new Promise((resolve) => setTimeout(resolve, 300));
  await expect(canvas.getByTestId("guarded-actions")).toHaveTextContent("0");
  await userEvent.click(canvas.getByRole("button", { name: "待機アクション" }));
  await userEvent.click(canvas.getByRole("button", { name: "無効化" }));
  await new Promise((resolve) => setTimeout(resolve, 300));
  await expect(canvas.getByTestId("guarded-actions")).toHaveTextContent("0");
  await expect(canvas.getByRole("button", { name: "待機アクション" })).toBeDisabled();
  await userEvent.click(canvas.getByRole("button", { name: "無効化" }));
  canvas.getByRole("button", { name: "待機アクション" }).focus();
  await userEvent.keyboard("{F2}破棄する編集");
  // Simulate an external disabled update without first blurring the editor.
  await fireEvent.click(canvas.getByRole("button", { name: "無効化" }));
  await expect(canvas.queryByRole("textbox")).not.toBeInTheDocument();
  await expect(canvas.getByRole("button", { name: "待機アクション" })).toHaveTextContent("待機アクション");
}}>
  <div>
    <EditableText value="待機アクション" aria-label="待機アクション" editOn="doubleClick" disabled={locked}
      onclick={() => guardedActionCount += 1} />
    <button type="button" onclick={() => locked = !locked}>無効化</button>
    <span data-testid="guarded-actions">{guardedActionCount}</span>
  </div>
</Story>
