<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Button from "@mutsuna/ui/button/button.svelte";
import type { ComponentProps } from "svelte";
import { toast } from "svelte-sonner";
import Toaster from "@mutsuna/ui/sonner/sonner.svelte";

type ToastStoryArgs = ComponentProps<typeof Toaster>;

const { Story } = defineMeta({
  title: "UI/Toast",
  component: Toaster,
  tags: ["autodocs"],
  argTypes: {
    closeButton: {
      control: "boolean",
    },
    position: {
      control: "select",
      options: ["top-left", "top-right", "bottom-left", "bottom-right", "top-center", "bottom-center"],
    },
    richColors: {
      control: "boolean",
    },
  },
  args: {
    closeButton: false,
    position: "bottom-right",
    richColors: true,
  } satisfies ToastStoryArgs,
  render: template,
});
</script>

{#snippet template(args: ToastStoryArgs)}
	<div class="grid max-w-lg gap-4">
		<Toaster {...args} />
		<div class="flex flex-wrap gap-2">
			<Button onclick={() => toast("組織IDをコピー", { description: "org_01HX..." })}>Default</Button>
			<Button onclick={() => toast.success("保存しました", { description: "営業時間の設定を更新しました。" })}>Success</Button>
			<Button variant="outline" onclick={() => toast.info("同期を開始しました", { description: "完了まで数分かかる場合があります。" })}>Info</Button>
			<Button variant="outline" onclick={() => toast.warning("確認が必要です", { description: "未設定のリソースがあります。" })}>Warning</Button>
			<Button variant="destructive" onclick={() => toast.error("保存に失敗しました", { description: "時間をおいて再度お試しください。" })}>Error</Button>
		</div>
		<p class="text-sm text-muted-foreground">実アプリと同じ Toaster props で表示します。</p>
	</div>
{/snippet}

<Story name="App Default" />
