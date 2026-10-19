<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { ChatComposer } from "@mutsuna/ui/chat-composer";
import ChatComposerPreview from "./chat-composer-preview.svelte";
import { chatSampleImage as sampleImage } from "./chat-sample-images.js";
const { Story } = defineMeta({
  title: "Components/Inputs/Chat Composer",
  component: ChatComposer,
  tags: ["autodocs"],
  argTypes: { submitOn: { control: "select", options: ["mod-enter", "enter"], name: "送信キー" } },
  parameters: { docs: { description: { component: "本文・添付・送信を1つの枠に配置。ファイル選択と送信は通知のみで、アップロード・永続化はconsumerが管理します。本文と添付は送信後も自動消去しません。" } } },
});
</script>
<Story name="Compose And Attach" args={{ submitOn: "mod-enter" }}>
  {#snippet template(args)}<ChatComposerPreview submitOn={args.submitOn} />{/snippet}
</Story>
<Story name="States" asChild>
  <div class="grid max-w-2xl gap-6">
    <div><p class="mb-2 text-sm font-medium">返信先を入力欄内に表示</p><ChatComposerPreview initialReply /></div>
    <div><p class="mb-2 text-sm font-medium">入力中だけ表示する注意書き</p><div class="pt-7"><ChatComposer notice="送信前に内容をご確認ください。" value="内容を確認して送信します。" /></div></div>
    <div><p class="mb-2 text-sm font-medium">短文：1段配置</p><ChatComposer value="了解しました。" onFilesSelect={() => {}} /></div>
    <div><p class="mb-2 text-sm font-medium">長文：本文と操作列を分離</p><ChatComposer value={"資料を確認しました。\n画面の構成はこの方針で進めたいです。気になる点があれば教えてください。"} onFilesSelect={() => {}} /></div>
    <div><p class="mb-2 text-sm font-medium">画像とファイル：添付済み・アップロード中・失敗</p><ChatComposerPreview initialValue="画像と資料を共有します。" initialAttachments={[
      { id: "image-ready", name: "風景写真.jpg", size: 1240000, previewUrl: sampleImage },
      { id: "image-upload", name: "写真をアップロード中.jpg", previewUrl: sampleImage, status: "uploading" },
      { id: "image-error", name: "再送が必要な写真.jpg", previewUrl: sampleImage, status: "error", error: "アップロードできませんでした。" },
      { id: "document", name: "撮影メモ.pdf", size: 42000 },
    ]} /></div>
    <div><p class="mb-2 text-sm font-medium">添付済み</p><ChatComposer value="資料を共有します。" attachments={[{ id: "ready", name: "画面構成案.pdf", size: 1240000 }]} /></div>
    <div><p class="mb-2 text-sm font-medium">アップロード中</p><ChatComposer attachments={[{ id: "upload", name: "スクリーンショット.png", status: "uploading" }]} /></div>
    <div><p class="mb-2 text-sm font-medium">添付エラー</p><ChatComposer attachments={[{ id: "error", name: "資料.pdf", status: "error", error: "アップロードできませんでした。もう一度添付してください。" }]} /></div>
    <div><p class="mb-2 text-sm font-medium">送信中</p><ChatComposer value="メッセージを送信しています。" sending onFilesSelect={() => {}} /></div>
    <div><p class="mb-2 text-sm font-medium">入力不可</p><ChatComposer disabled onFilesSelect={() => {}} /></div>
  </div>
</Story>
