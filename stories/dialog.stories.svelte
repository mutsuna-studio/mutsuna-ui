<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Button from "@mutsuna/ui/button/button.svelte";
import Input from "@mutsuna/ui/input/input.svelte";
import Label from "@mutsuna/ui/label/label.svelte";
import Dialog from "@mutsuna/ui/dialog/dialog.svelte";
import DialogBody from "@mutsuna/ui/dialog/dialog-body.svelte";
import DialogClose from "@mutsuna/ui/dialog/dialog-close.svelte";
import DialogContent from "@mutsuna/ui/dialog/dialog-content.svelte";
import DialogDescription from "@mutsuna/ui/dialog/dialog-description.svelte";
import DialogFooter from "@mutsuna/ui/dialog/dialog-footer.svelte";
import DialogHeader from "@mutsuna/ui/dialog/dialog-header.svelte";
import DialogTitle from "@mutsuna/ui/dialog/dialog-title.svelte";
import DialogTrigger from "@mutsuna/ui/dialog/dialog-trigger.svelte";

const { Story } = defineMeta({
  title: "UI/Dialog",
  component: Dialog,
  tags: ["autodocs"],
});
</script>

<Story name="Default" asChild>
	<Dialog>
		<DialogTrigger>
			{#snippet child({ props })}
				<Button {...props}>利用プランを作成</Button>
			{/snippet}
		</DialogTrigger>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>利用プランを作成</DialogTitle>
				<DialogDescription>予約者に提示するメニュー、プラン、コースを追加します。</DialogDescription>
			</DialogHeader>
			<DialogBody class="grid gap-4 py-4">
				<Label class="grid gap-2">
					名称
					<Input value="会議室利用プラン" />
				</Label>
				<Label class="grid gap-2">
					所要時間
					<Input value="60分" />
				</Label>
			</DialogBody>
			<DialogFooter>
				<DialogClose>
					{#snippet child({ props })}
						<Button {...props} type="button" variant="outline">キャンセル</Button>
					{/snippet}
				</DialogClose>
				<Button type="button">作成する</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</Story>

<Story name="Scrollable Body" asChild>
	<Dialog>
		<DialogTrigger>
			{#snippet child({ props })}
				<Button variant="outline" {...props}>長いフォームを開く</Button>
			{/snippet}
		</DialogTrigger>
		<DialogContent class="max-h-[90vh] max-w-3xl">
			<DialogHeader>
				<DialogTitle>会員プランを編集</DialogTitle>
				<DialogDescription>使える店舗、料金、会員だけが予約できるプランを設定します。</DialogDescription>
			</DialogHeader>
			<DialogBody class="grid gap-4 py-4">
			{#each ["プラン名", "月額料金", "年額料金", "対象店舗", "利用プラン", "公開状態", "受付条件", "備考", "表示順", "対象顧客", "予約単位", "最小利用時間", "最大利用時間", "キャンセル期限", "注意事項", "内部メモ"] as label (label)}
					<Label class="grid gap-2">
						{label}
						<Input value={label === "プラン名" ? "月額メンバー" : ""} placeholder={`${label}を入力`} />
					</Label>
				{/each}
			</DialogBody>
			<DialogFooter class="shrink-0">
				<DialogClose>
					{#snippet child({ props })}
						<Button {...props} type="button" variant="outline">キャンセル</Button>
					{/snippet}
				</DialogClose>
				<Button type="button">保存</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</Story>

<Story name="Without Header Close Button" asChild>
	<Dialog>
		<DialogTrigger>
			{#snippet child({ props })}
				<Button variant="destructive" {...props}>削除確認</Button>
			{/snippet}
		</DialogTrigger>
		<DialogContent showCloseButton={false}>
			<DialogHeader>
				<DialogTitle>利用プランを削除</DialogTitle>
				<DialogDescription>削除すると復元できません。</DialogDescription>
			</DialogHeader>
			<DialogFooter class="mt-4">
				<DialogClose>
					{#snippet child({ props })}
						<Button {...props} type="button" variant="outline">キャンセル</Button>
					{/snippet}
				</DialogClose>
				<Button type="button" variant="destructive">削除</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</Story>
