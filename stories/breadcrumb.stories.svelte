<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@mutsuna/ui/breadcrumb";

const { Story } = defineMeta({
  title: "UI/Breadcrumb",
  component: Breadcrumb,
  tags: ["autodocs"],
});
</script>

<Story name="Default" asChild>
	<Breadcrumb>
		<BreadcrumbList>
			<BreadcrumbItem><BreadcrumbLink href="/">管理画面</BreadcrumbLink></BreadcrumbItem>
			<BreadcrumbSeparator />
			<BreadcrumbItem><BreadcrumbLink href="/organization">組織設定</BreadcrumbLink></BreadcrumbItem>
			<BreadcrumbSeparator />
			<BreadcrumbItem><BreadcrumbPage>メンバー</BreadcrumbPage></BreadcrumbItem>
		</BreadcrumbList>
	</Breadcrumb>
</Story>

<Story name="Collapsed" asChild>
	<Breadcrumb>
		<BreadcrumbList>
			<BreadcrumbItem><BreadcrumbLink href="/">管理画面</BreadcrumbLink></BreadcrumbItem>
			<BreadcrumbSeparator />
			<BreadcrumbItem><BreadcrumbEllipsis /></BreadcrumbItem>
			<BreadcrumbSeparator />
			<BreadcrumbItem><BreadcrumbPage>予約詳細</BreadcrumbPage></BreadcrumbItem>
		</BreadcrumbList>
	</Breadcrumb>
</Story>
