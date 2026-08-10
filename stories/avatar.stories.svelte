<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, CustomerAvatar } from "@mutsuna/ui/avatar";

const { Story } = defineMeta({
  title: "UI/Avatar",
  component: Avatar,
  tags: ["autodocs"],
});
</script>

<Story name="Sizes" asChild>
	<div class="flex items-center gap-4">
		<Avatar size="sm"><AvatarFallback>小</AvatarFallback></Avatar>
		<Avatar><AvatarFallback>岡</AvatarFallback></Avatar>
		<Avatar size="lg"><AvatarFallback>管</AvatarFallback></Avatar>
	</div>
</Story>

<Story name="Seeded Avatar" asChild>
	<div class="flex items-center gap-4">
		<CustomerAvatar id="user-a" name="画像なしのユーザー" />
		<CustomerAvatar id="user-b" name="別のユーザー" size="lg" />
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
		<Avatar><AvatarFallback>岡</AvatarFallback></Avatar>
		<Avatar><AvatarFallback>田</AvatarFallback></Avatar>
		<Avatar><AvatarFallback>佐</AvatarFallback><AvatarBadge /></Avatar>
		<AvatarGroupCount>+3</AvatarGroupCount>
	</AvatarGroup>
</Story>
