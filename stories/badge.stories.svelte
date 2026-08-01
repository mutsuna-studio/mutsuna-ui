<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import type { ComponentProps } from "svelte";
import { Badge } from "@mutsuna/ui/badge";

type BadgeStoryArgs = ComponentProps<typeof Badge> & {
  label: string;
};

const { Story } = defineMeta({
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline", "ghost", "link"],
    },
    shape: {
      control: "select",
      options: ["default", "select"],
    },
    label: {
      control: "text",
    },
  },
  args: {
    label: "公開中",
    variant: "default",
  } satisfies BadgeStoryArgs,
  render: template,
});
</script>

{#snippet template({ label, ...args }: BadgeStoryArgs)}
	<Badge {...args}>{label}</Badge>
{/snippet}

<Story name="Default" />

<Story name="Secondary" args={{ label: "下書き", variant: "secondary" }} />

<Story name="Destructive" args={{ label: "要確認", variant: "destructive" }} />

<Story name="Outline" args={{ label: "未設定", variant: "outline" }} />

<Story name="Ghost" args={{ label: "任意", variant: "ghost" }} />

<Story name="Link" args={{ label: "詳細", variant: "link", href: "#" }} />

<Story name="Select Shape" args={{ label: "確定", shape: "select", variant: "secondary" }} />
