<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { ChatAttachment } from "@mutsuna/ui/chat-attachment";
import { chatSampleImage, chatSamplePdf } from "./chat-sample-images.js";
const { Story } = defineMeta({ title: "Components/Data Display/Chat Attachment", component: ChatAttachment, tags: ["autodocs"] });
</script>

<Story name="Files And Images" asChild>
  <div class="grid max-w-2xl gap-6">
    <ChatAttachment name="共有資料.pdf" mediaType="PDF" downloadUrl={chatSamplePdf} />
    <ChatAttachment name="風景写真.svg" mediaType="SVG" previewUrl={chatSampleImage} downloadUrl={chatSampleImage} />
    <ChatAttachment name="取得中の資料.pdf" mediaType="PDF" downloadUrl={chatSamplePdf} downloading />
    <ChatAttachment name="取得に失敗した資料.pdf" mediaType="PDF" downloadUrl={chatSamplePdf} error="取得に失敗しました。もう一度ダウンロードしてください。" />
    <ChatAttachment name="まだダウンロードできない資料.pdf" disabled />
  </div>
</Story>
