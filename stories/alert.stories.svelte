<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Button from "@mutsuna/ui/button/button.svelte";
import AlertCircleIcon from "@lucide/svelte/icons/circle-alert";
import InfoIcon from "@lucide/svelte/icons/info";
import Alert from "@mutsuna/ui/alert/alert.svelte";
import AlertAction from "@mutsuna/ui/alert/alert-action.svelte";
import AlertDescription from "@mutsuna/ui/alert/alert-description.svelte";
import AlertTitle from "@mutsuna/ui/alert/alert-title.svelte";

const { Story } = defineMeta({
  title: "UI/Alert",
  component: Alert,
  tags: ["autodocs"],
});
</script>

<Story name="Default" asChild>
	<div class="grid max-w-xl gap-4">
		<Alert>
			<InfoIcon class="size-4" />
			<AlertTitle>予約受付の確認</AlertTitle>
			<AlertDescription>営業時間と受付締切を確認してから公開してください。</AlertDescription>
		</Alert>
		<Alert>
			<AlertTitle>現在のパスワードが不明な場合</AlertTitle>
			<AlertDescription class="mt-1">再設定リンクを送信して、メールから変更できます。</AlertDescription>
			<AlertAction>
				<Button size="sm" variant="outline">送信</Button>
			</AlertAction>
		</Alert>
	</div>
</Story>

<Story name="Destructive" asChild>
	<Alert variant="destructive" class="max-w-xl">
		<AlertCircleIcon class="size-4" />
		<AlertTitle>契約が必要</AlertTitle>
		<AlertDescription>この組織はまだ契約前です。利用を始めるにはプランを選択してください。</AlertDescription>
	</Alert>
</Story>
