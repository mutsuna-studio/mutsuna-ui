<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import PlusIcon from "@lucide/svelte/icons/plus";
import RefreshCcwIcon from "@lucide/svelte/icons/refresh-ccw";
import SaveIcon from "@lucide/svelte/icons/save";
import SettingsIcon from "@lucide/svelte/icons/settings";
import Trash2Icon from "@lucide/svelte/icons/trash-2";
import type { LucideIcon } from "@lucide/svelte";
import type { ComponentProps } from "svelte";
import { Button } from "@mutsuna/ui/button";

type ButtonStoryIconName = "none" | "plus" | "settings" | "save" | "trash" | "refresh";

type ButtonStoryArgs = ComponentProps<typeof Button> & {
  label: string;
  iconName: ButtonStoryIconName;
};

const iconOptions: Record<ButtonStoryIconName, LucideIcon | undefined> = {
  none: undefined,
  plus: PlusIcon,
  settings: SettingsIcon,
  save: SaveIcon,
  trash: Trash2Icon,
  refresh: RefreshCcwIcon,
};

const { Story } = defineMeta({
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "secondary", "ghost", "destructive", "link"],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
    disabled: {
      control: "boolean",
    },
    loading: {
      control: "boolean",
    },
    icon: {
      table: {
        disable: true,
      },
    },
    iconName: {
      control: "select",
      options: ["none", "plus", "settings", "save", "trash", "refresh"],
    },
    iconPosition: {
      control: "select",
      options: ["start", "end"],
    },
    label: {
      control: "text",
    },
  },
  args: {
    label: "保存",
    variant: "default",
    size: "default",
    disabled: false,
    loading: false,
    iconName: "none",
    iconPosition: "start",
  } satisfies ButtonStoryArgs,
  render: template,
});
</script>

{#snippet template(args: ButtonStoryArgs)}
	<Button
		variant={args.variant}
		size={args.size}
		disabled={args.disabled}
		loading={args.loading}
		icon={args.icon ?? iconOptions[args.iconName]}
		iconPosition={args.iconPosition}
		aria-label={args["aria-label"]}
	>
		{args.label}
	</Button>
{/snippet}

<Story name="Default" />

<Story name="Outline" args={{ label: "編集", variant: "outline" }} />

<Story name="Secondary" args={{ label: "詳細を見る", variant: "secondary" }} />

<Story name="Ghost" args={{ label: "キャンセル", variant: "ghost" }} />

<Story name="Destructive" args={{ label: "削除", variant: "destructive" }} />

<Story name="Disabled" args={{ label: "保存", disabled: true }} />

<Story name="Loading" args={{ label: "保存中", loading: true }} />

<Story name="With Icon" args={{ label: "新規作成", iconName: "plus" }} />

<Story name="Trailing Icon" args={{ label: "設定を開く", iconName: "settings", iconPosition: "end", variant: "outline" }} />

<Story name="Icon Only" args={{ label: "", iconName: "settings", variant: "outline", size: "icon", "aria-label": "設定" }} />
