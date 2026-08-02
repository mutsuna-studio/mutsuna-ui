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

<Story name="Seeded Customer Avatar" asChild>
	<div class="flex items-center gap-4">
		<CustomerAvatar id="customer-a" name="画像なしの顧客" />
		<CustomerAvatar id="customer-b" name="別の顧客" size="lg" />
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
