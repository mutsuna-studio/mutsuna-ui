<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { Button } from "@mutsuna/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@mutsuna/ui/card";

const { Story } = defineMeta({
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
});
</script>

<Story name="Default" asChild>
	<Card class="max-w-xl">
		<CardHeader>
			<CardTitle>営業時間</CardTitle>
			<CardDescription>予約受付に使う標準の営業時間設定</CardDescription>
			<CardAction>
				<Button size="sm" variant="outline">編集</Button>
			</CardAction>
		</CardHeader>
		<CardContent>
			<div class="grid gap-2 text-sm">
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">平日</span>
					<span class="font-medium">09:00 - 18:00</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">土日祝</span>
					<span class="font-medium">定休日</span>
				</div>
			</div>
		</CardContent>
		<CardFooter class="justify-end">
			<Button>保存</Button>
		</CardFooter>
	</Card>
</Story>

<Story name="Dense Summary" asChild>
	<Card class="max-w-xl">
		<CardHeader>
			<CardTitle>予約サマリー</CardTitle>
			<CardDescription>本日の受付状況</CardDescription>
		</CardHeader>
		<CardContent class="grid grid-cols-3 gap-3">
			<div class="rounded-md border p-3">
				<p class="text-xs text-muted-foreground">予約</p>
				<p class="text-2xl font-semibold">18</p>
			</div>
			<div class="rounded-md border p-3">
				<p class="text-xs text-muted-foreground">承認待ち</p>
				<p class="text-2xl font-semibold">3</p>
			</div>
			<div class="rounded-md border p-3">
				<p class="text-xs text-muted-foreground">キャンセル</p>
				<p class="text-2xl font-semibold">1</p>
			</div>
		</CardContent>
	</Card>
</Story>
