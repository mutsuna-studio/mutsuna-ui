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
			<TabsTrigger value="activity">アクティビティ</TabsTrigger>
			<TabsTrigger value="settings">設定</TabsTrigger>
		</TabsList>
		<TabsContent value="overview" class="rounded-md border p-4">ワークスペースの状況と未対応事項を確認します。</TabsContent>
		<TabsContent value="activity" class="rounded-md border p-4">最近の更新と対応待ちの項目を確認します。</TabsContent>
		<TabsContent value="settings" class="rounded-md border p-4">表示や通知の設定を調整します。</TabsContent>
	</Tabs>
</Story>

<Story name="Line Variant" asChild>
	<Tabs value="projects" class="max-w-xl">
		<TabsList variant="line">
			<TabsTrigger value="projects">プロジェクト</TabsTrigger>
			<TabsTrigger value="resource">リソース</TabsTrigger>
			<TabsTrigger value="members">メンバー</TabsTrigger>
		</TabsList>
		<TabsContent value="projects" class="pt-4">プロジェクト単位で表示します。</TabsContent>
		<TabsContent value="resource" class="pt-4">リソース単位で表示します。</TabsContent>
		<TabsContent value="members" class="pt-4">メンバー単位で表示します。</TabsContent>
	</Tabs>
</Story>
