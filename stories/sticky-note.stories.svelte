<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { StickyNote } from "@mutsuna/ui/sticky-note";
import Preview from "./sticky-note-preview.svelte";
const { Story } = defineMeta({ title: "Components/Inputs/Sticky Note", component: StickyNote, tags: ["autodocs"], parameters: { docs: { description: { component: "チャットに依存しない付箋。最小化時の浮遊ボタンはドラッグ・矢印キーで配置でき、triggerPositionとpositionでボタン・本文それぞれの位置を管理できます。inlineは任意のトリガー、noneは外部のbind:open操作に対応します。保存・会話との紐付け・永続化は利用側で行います。" } } } });
</script>
<Story name="Floating Launcher" asChild><Preview /></Story>
<Story name="Custom Trigger" asChild><Preview mode="inline" /></Story>
<Story name="External Control" asChild><Preview mode="none" /></Story>
