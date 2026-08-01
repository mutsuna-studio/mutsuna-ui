<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@mutsuna/ui/tabs";

const { Story } = defineMeta({
  title: "UI/Tabs",
  component: Tabs,
  tags: ["autodocs"],
});
</script>

<Story name="Default" asChild>
	<Tabs value="overview" class="max-w-xl">
		<TabsList>
			<TabsTrigger value="overview">概要</TabsTrigger>
			<TabsTrigger value="bookings">予約</TabsTrigger>
			<TabsTrigger value="settings">設定</TabsTrigger>
		</TabsList>
		<TabsContent value="overview" class="rounded-md border p-4">店舗の運営状況と未対応事項を確認します。</TabsContent>
		<TabsContent value="bookings" class="rounded-md border p-4">当日予約と承認待ちの予約を確認します。</TabsContent>
		<TabsContent value="settings" class="rounded-md border p-4">営業時間や受付条件を調整します。</TabsContent>
	</Tabs>
</Story>

<Story name="Line Variant" asChild>
	<Tabs value="booking" class="max-w-xl">
		<TabsList variant="line">
			<TabsTrigger value="booking">予約</TabsTrigger>
			<TabsTrigger value="resource">リソース</TabsTrigger>
			<TabsTrigger value="customer">顧客</TabsTrigger>
		</TabsList>
		<TabsContent value="booking" class="pt-4">予約単位で表示します。</TabsContent>
		<TabsContent value="resource" class="pt-4">リソース単位で表示します。</TabsContent>
		<TabsContent value="customer" class="pt-4">顧客単位で表示します。</TabsContent>
	</Tabs>
</Story>
