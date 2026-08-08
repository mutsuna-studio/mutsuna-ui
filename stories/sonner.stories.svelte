<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Button from "@mutsuna/ui/button/button.svelte";
import type { ComponentProps } from "svelte";
import { showErrorToast, showInfoToast, showSuccessToast, showToast, showWarningToast } from "@mutsuna/ui/sonner";
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
			<Button onclick={() => showToast("組織IDをコピー", "org_01HX...")}>Default</Button>
			<Button onclick={() => showSuccessToast("保存しました", "営業時間の設定を更新しました。")}>Success</Button>
			<Button variant="outline" onclick={() => showInfoToast("同期を開始しました", "完了まで数分かかる場合があります。")}>Info</Button>
			<Button variant="outline" onclick={() => showWarningToast("確認が必要です", "未設定のリソースがあります。")}>Warning</Button>
			<Button variant="destructive" onclick={() => showErrorToast("保存に失敗しました", "時間をおいて再度お試しください。")}>Error</Button>
			<Button
				variant="destructive"
				onclick={() =>
					showErrorToast("予約を保存できませんでした", "入力内容を確認して、もう一度お試しください。", {
						detail: new Error("Booking/create failed: booking_conflict"),
					})}>Copyable Error</Button
			>
		</div>
		<p class="text-sm text-muted-foreground">すべてのトーストでタイトルとメッセージをコピーできます。詳細情報を渡した場合は、画面に出さずコピー内容だけに追加します。</p>
	</div>
{/snippet}

<Story name="App Default" />
