<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { expect, userEvent, within } from "storybook/test";
import ChatScreenPreview from "./chat-screen-preview.svelte";
import ChatAppShellPreview from "./chat-app-shell-preview.svelte";

const { Story } = defineMeta({
  title: "Patterns/Chat Screens",
  component: ChatScreenPreview,
  tags: ["autodocs"],
  argTypes: {
    submitOn: { control: "select", options: ["mod-enter", "enter"], name: "送信キー", description: "アプリ側の設定をChatComposerへ渡します。Enter送信時はShift+Enterで改行できます。" },
    showHeader: { control: false, table: { disable: true } },
    embedded: { control: false, table: { disable: true } },
    showThreads: { control: false, table: { disable: true } },
    onConversationChange: { control: false, table: { disable: true } },
    scenario: { control: false, table: { disable: true } },
    layout: { control: "select", options: ["timeline", "bubble"], name: "表示形式", description: "送信者の種類に依存しないメッセージの配置です。" },
    longAnswer: { if: { arg: "scenario", eq: "assistant" }, control: "boolean", name: "長文を表示", description: "アシスタントの例で、見出し・コード・表を含む長文へ切り替えます。" },
    simulateFailure: { control: "boolean", name: "編集・再生成を失敗させる", description: "通常の会話・アシスタントの編集と再生成で、入力と元の会話を保持するエラーを確認します。" },
  },
  parameters: {
    layout: "fullscreen",
    docs: { description: { component: "Timelineはアシスタントとの会話、Bubbleは通常の会話の例です。表示形式を切り替えても本文・送信者・会話一覧・入力内容・編集動作は変わりません。サンプルの種類はControlsに表示しません。通常の会話では自分のメッセージを更新し、アシスタントの例では質問からのやり直し・回答の再生成・停止を操作メニューから確認できます。長文も両方の表示形式で確認できます。返信先と編集中の情報は共通のChatComposer内に表示します。注意書きはスマホ・PCとも入力欄にfocusがあるか本文がある間だけ表示します。広い画面では付箋・ステータス・動画・全文コピー・PDFのアイコンを直接表示し、狭い画面ではメニューにまとめます。日付・回答中の質問・会話操作を共通のMessageScroller.TopBarに配置し、操作はフローティング風のメニューにまとめます。In App ShellではAdminShellFrameへタイトルとナビゲーションを任せ、チャット側のヘッダーを省略します。単独表示ではChatHeaderを利用できます。ステータスは一覧とヘッダーへ反映し、動画とPDFは確認用UIです。通信・保存・アップロードは行いません。" } },
  },
});

async function sendMessage({ canvasElement }: { canvasElement: HTMLElement }) {
  const canvas = within(canvasElement);
  const input = canvas.getByRole("textbox", { name: "メッセージ" });
  const send = canvas.getByRole("button", { name: "メッセージを送信" });
  await expect(send).toBeDisabled();
  await userEvent.type(input, "この方向で進めましょう。");
  await expect(send).toBeEnabled();
  await userEvent.click(send);
  await expect(canvas.getByText("この方向で進めましょう。", { exact: true })).toBeVisible();
  await expect(input).toHaveValue("");
  await expect(send).toBeDisabled();
  await userEvent.upload(canvas.getByLabelText("添付ファイルを選択"), new File(["sample"], "notes.txt", { type: "text/plain" }));
  await expect(canvas.getByRole("list", { name: "選択済みの添付ファイル" })).toBeVisible();
  await userEvent.click(send);
  await expect(canvas.getByText("notes.txt", { exact: true })).toBeVisible();
  await expect(canvas.queryByRole("list", { name: "選択済みの添付ファイル" })).not.toBeInTheDocument();
}
</script>

<Story name="Timeline" args={{ layout: "timeline", scenario: "assistant", submitOn: "mod-enter", longAnswer: false, simulateFailure: false }} />
<Story name="Bubble" args={{ layout: "bubble", scenario: "conversation", submitOn: "mod-enter" }} />
<Story name="Timeline Send Test" args={{ layout: "timeline", scenario: "assistant" }} tags={["!dev", "!autodocs"]} play={sendMessage} />
<Story name="Bubble Send Test" args={{ layout: "bubble", scenario: "conversation", submitOn: "mod-enter" }} tags={["!dev", "!autodocs"]} play={sendMessage} />

<Story name="In App Shell" args={{ layout: "bubble", scenario: "conversation", submitOn: "mod-enter" }}>{#snippet template(args)}<ChatAppShellPreview layout={args.layout} scenario={args.scenario} submitOn={args.submitOn} longAnswer={args.longAnswer} simulateFailure={args.simulateFailure} />{/snippet}</Story>
