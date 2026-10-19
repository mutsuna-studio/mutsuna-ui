<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { FloatingActionMenu } from "@mutsuna/ui/floating-action-menu";
import Preview from "./floating-action-menu-preview.svelte";
const { Story } = defineMeta({ title: "Components/Navigation/Floating Action Menu", component: FloatingActionMenu, tags: ["autodocs"], argTypes: { placement: { control: "select", options: ["floating", "inline"] } }, parameters: { docs: { description: { component: "画面の補助操作をまとめる浮遊メニュー。actionsのアイコン列は広い画面で直接表示し、狭い画面ではメニューへ集約します。overflowで常時メニューを併置するか、狭い画面だけにするか選べます。項目・権限・実行処理は利用側のDropdownMenu snippetsで構成します。StickyNoteの外部開閉や、ダイアログへのfocus引き継ぎに対応し、positionで配置を指定できます。placement=inlineではヘッダーなどの通常レイアウトに収まります。会話向けの例はPatterns/Chat Screensで確認できます。" } } } });
</script>
<Story name="Actions" args={{ placement: "floating" }}>{#snippet template(args)}<Preview placement={args.placement} />{/snippet}</Story>
