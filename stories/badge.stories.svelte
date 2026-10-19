<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import type { ComponentProps } from "svelte";
import { Badge } from "@mutsuna/ui/badge";

type BadgeStoryArgs = ComponentProps<typeof Badge> & {
  label: string;
};

const { Story } = defineMeta({
  title: "Components/Data Display/Badge",
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















<Story name="Playground" />
<Story name="States" asChild parameters={{ controls: { disable: true } }}>
  <div class="flex flex-wrap items-center gap-3">
    <Badge>公開中</Badge><Badge variant="secondary">下書き</Badge><Badge variant="destructive">要確認</Badge><Badge variant="outline">未設定</Badge><Badge variant="ghost">任意</Badge><Badge variant="link" href="#">詳細</Badge><Badge variant="secondary" shape="select">確定</Badge>
  </div>
</Story>
