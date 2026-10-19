<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { ImagePreview } from "@mutsuna/ui/image-preview";
import { chatSampleImage } from "./chat-sample-images.js";
const portrait = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="1800" viewBox="0 0 600 1800"><rect width="600" height="1800" fill="#dce8eb"/><circle cx="420" cy="260" r="80" fill="#f2d7a4"/><path d="M0 1800V1200L240 600L600 1500V1800Z" fill="#71968b"/><path d="M0 1800L360 1000L600 1380V1800Z" fill="#3e665d"/></svg>')}`;
const { Story } = defineMeta({
  title: "Components/Overlays/Image Preview", component: ImagePreview, tags: ["autodocs"],
  parameters: { docs: { description: { component: "画像の拡大表示。Enter／Spaceで開き、Escape・閉じるボタンで閉じると元の操作へfocusが戻ります。ファイル名・説明・ダウンロードは任意。画像の取得と保存処理は利用側で管理します。" } } },
});
</script>
<Story name="States" asChild>
  <div class="grid max-w-3xl gap-8 sm:grid-cols-2">
    <section class="grid content-start gap-3"><h2 class="text-sm font-semibold">複数画像</h2><ImagePreview src={chatSampleImage} alt="ギャラリーの風景" images={[{ src: chatSampleImage, alt: "横長の風景", downloadUrl: chatSampleImage, downloadName: "横長.svg" }, { src: portrait, alt: "縦長の風景", downloadUrl: portrait, downloadName: "縦長.svg" }, { src: chatSampleImage, alt: "最後の風景" }]} /></section>
    <section class="grid content-start gap-3"><h2 class="text-sm font-semibold">画像のみ</h2><ImagePreview src={chatSampleImage} alt="山と湖の風景" /></section>
    <section class="grid content-start gap-3"><h2 class="text-sm font-semibold">説明とダウンロード</h2><ImagePreview src={chatSampleImage} alt="山と湖の風景" title="風景.svg" description="山と湖を描いた画像" downloadUrl={chatSampleImage} downloadName="風景.svg" /></section>
    <section class="grid content-start gap-3"><h2 class="text-sm font-semibold">任意のトリガー・取得エラー</h2><ImagePreview src={chatSampleImage} alt="山と湖の風景" onDownload={() => {}} error="取得できませんでした。再度お試しください。">{#snippet trigger({ props })}<button {...props} class="min-h-11 rounded-md border border-border px-4 text-sm">風景画像を開く</button>{/snippet}</ImagePreview></section>
    <section class="grid content-start gap-3"><h2 class="text-sm font-semibold">縦長画像・長いファイル名</h2><ImagePreview src={portrait} alt="縦長の風景" title={"長いファイル名の画像_".repeat(12) + ".svg"} description="画面の高さに合わせ、画像全体と操作ボタンをスクロールなしで表示します。" downloadUrl={portrait} downloadName="縦長の風景.svg" /></section>
    <section class="grid content-start gap-3"><h2 class="text-sm font-semibold">ダウンロード中</h2><ImagePreview src={chatSampleImage} alt="取得中の風景画像" onDownload={() => {}} downloading /></section>
    <section class="grid content-start gap-3"><h2 class="text-sm font-semibold">操作不可</h2><ImagePreview src={chatSampleImage} alt="操作不可の風景画像" disabled /></section>
    <section class="grid content-start gap-3"><h2 class="text-sm font-semibold">画像の読み込み失敗</h2><ImagePreview src="data:image/png;base64,broken" alt="読み込みに失敗した画像" /></section>
  </div>
</Story>
