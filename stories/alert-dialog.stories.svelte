<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import TriangleAlertIcon from "@lucide/svelte/icons/triangle-alert";
import Button from "@mutsuna/ui/button/button.svelte";
import AlertDialog from "@mutsuna/ui/alert-dialog/alert-dialog.svelte";
import AlertDialogAction from "@mutsuna/ui/alert-dialog/alert-dialog-action.svelte";
import AlertDialogCancel from "@mutsuna/ui/alert-dialog/alert-dialog-cancel.svelte";
import AlertDialogContent from "@mutsuna/ui/alert-dialog/alert-dialog-content.svelte";
import AlertDialogDescription from "@mutsuna/ui/alert-dialog/alert-dialog-description.svelte";
import AlertDialogFooter from "@mutsuna/ui/alert-dialog/alert-dialog-footer.svelte";
import AlertDialogHeader from "@mutsuna/ui/alert-dialog/alert-dialog-header.svelte";
import AlertDialogMedia from "@mutsuna/ui/alert-dialog/alert-dialog-media.svelte";
import AlertDialogTitle from "@mutsuna/ui/alert-dialog/alert-dialog-title.svelte";
import AlertDialogTrigger from "@mutsuna/ui/alert-dialog/alert-dialog-trigger.svelte";

const { Story } = defineMeta({
  title: "UI/Alert Dialog",
  component: AlertDialog,
  tags: ["autodocs"],
});
</script>

<Story name="Default" asChild>
	<AlertDialog>
		<AlertDialogTrigger>
			{#snippet child({ props })}
				<Button {...props} variant="outline">確認を開く</Button>
			{/snippet}
		</AlertDialogTrigger>
		<AlertDialogContent>
			<AlertDialogHeader>
				<AlertDialogTitle>公開状態を変更しますか</AlertDialogTitle>
				<AlertDialogDescription>変更後、公開ページの表示に反映されます。</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel>キャンセル</AlertDialogCancel>
				<AlertDialogAction>変更する</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
</Story>
<Story name="Destructive" asChild>
	<AlertDialog>
		<AlertDialogTrigger>
			{#snippet child({ props })}
				<Button {...props} variant="destructive">削除</Button>
			{/snippet}
		</AlertDialogTrigger>
		<AlertDialogContent>
			<AlertDialogMedia>
				<TriangleAlertIcon aria-hidden="true" />
			</AlertDialogMedia>
			<AlertDialogHeader>
				<AlertDialogTitle>項目を削除</AlertDialogTitle>
				<AlertDialogDescription>削除すると復元できません。</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel>キャンセル</AlertDialogCancel>
				<AlertDialogAction variant="destructive">削除</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
</Story>
