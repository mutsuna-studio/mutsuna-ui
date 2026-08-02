<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { Badge } from "@mutsuna/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@mutsuna/ui/table";

const { Story } = defineMeta({
  title: "UI/Table",
  component: Table,
  tags: ["autodocs"],
});
</script>

<Story name="Project List" asChild>
	<Table>
		<TableCaption>プロジェクト一覧</TableCaption>
		<TableHeader>
			<TableRow>
				<TableHead>時間</TableHead>
				<TableHead>担当者</TableHead>
				<TableHead>内容</TableHead>
				<TableHead>状態</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			<TableRow>
				<TableCell>09:00</TableCell>
				<TableCell>佐藤 花子</TableCell>
				<TableCell>会議室 A / 60分</TableCell>
				<TableCell><Badge class="w-16 justify-center">確定</Badge></TableCell>
			</TableRow>
			<TableRow>
				<TableCell>11:00</TableCell>
				<TableCell>田中 太郎</TableCell>
				<TableCell>個室ブース / 30分</TableCell>
				<TableCell><Badge class="w-16 justify-center" variant="secondary">申請中</Badge></TableCell>
			</TableRow>
			<TableRow>
				<TableCell>14:00</TableCell>
				<TableCell>鈴木 一郎</TableCell>
				<TableCell>会議室 B / 90分</TableCell>
				<TableCell><Badge class="w-16 justify-center" variant="destructive">要確認</Badge></TableCell>
			</TableRow>
		</TableBody>
	</Table>
</Story>

<Story name="Empty" asChild>
	<Table>
		<TableHeader>
			<TableRow>
				<TableHead>時間</TableHead>
				<TableHead>担当者</TableHead>
				<TableHead>内容</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			<TableRow>
				<TableCell colspan={3} class="h-24 text-center text-muted-foreground">表示できる項目はありません。</TableCell>
			</TableRow>
		</TableBody>
	</Table>
</Story>
