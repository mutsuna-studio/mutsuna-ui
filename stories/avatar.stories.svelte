<script module lang="ts">
const shapes = ["circle", "rounded"] as const;
import { defineMeta } from "@storybook/addon-svelte-csf";
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, CustomerAvatar } from "@mutsuna/ui/avatar";

const { Story } = defineMeta({
  title: "Components/Data Display/Avatar",
  component: Avatar,
  tags: ["autodocs"],
});
</script>

<Story name="Sizes" asChild>
	<div class="flex items-center gap-4">
		<CustomerAvatar id="user-a" name="佐藤 美咲" size="sm" />
		<CustomerAvatar id="user-b" name="岡田 太郎" />
		<CustomerAvatar id="user-c" name="管理者" size="lg" />
	</div>
</Story>

<Story name="Seeded Avatar" asChild>
	<div class="grid gap-4">
		{#each shapes as shape}
			<div class="flex items-center gap-4">
				<span class="w-20 text-sm text-muted-foreground">{shape === "circle" ? "丸型" : "角丸四角"}</span>
				<CustomerAvatar id="user-a" name="画像なしのユーザー" {shape} size="sm" />
				<CustomerAvatar id="user-a" name="画像なしのユーザー" {shape} />
				<CustomerAvatar id="user-a" name="画像なしのユーザー" {shape} size="lg" />
				<CustomerAvatar id="user-b" name="別のユーザー" {shape} />
			</div>
		{/each}
	</div>
</Story>

<Story name="Dense List" asChild>
	<div class="grid max-w-md gap-2 rounded-xl border bg-background p-4">
		{#each Array.from({ length: 24 }) as _, index (`customer-${index}`)}
			<div class="flex items-center gap-3 rounded-lg border bg-background p-2">
				<CustomerAvatar id={`customer-${index}`} name={`顧客 ${index + 1}`} />
				<span class="text-sm">顧客 {index + 1}</span>
			</div>
		{/each}
	</div>
</Story>

<Story name="Group" asChild>
	<AvatarGroup>
		<CustomerAvatar id="user-b" name="岡田 太郎" />
		<CustomerAvatar id="user-c" name="田中 花" />
		<Avatar><AvatarFallback>佐</AvatarFallback><AvatarBadge /></Avatar>
		<AvatarGroupCount>+3</AvatarGroupCount>
	</AvatarGroup>
</Story>
