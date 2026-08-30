<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import PlusIcon from "@lucide/svelte/icons/plus";
import RefreshCcwIcon from "@lucide/svelte/icons/refresh-ccw";
import SaveIcon from "@lucide/svelte/icons/save";
import SettingsIcon from "@lucide/svelte/icons/settings";
import Trash2Icon from "@lucide/svelte/icons/trash-2";
import type { LucideIcon } from "@lucide/svelte";
import type { ComponentProps } from "svelte";
import { Button, type ButtonSize, type ButtonVariant } from "@mutsuna/ui/button";

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

const comparisonVariants: readonly NonNullable<ButtonVariant>[] = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
];

const comparisonSizes: readonly NonNullable<ButtonSize>[] = ["xs", "sm", "default", "lg"];

const { Story } = defineMeta({
  title: "Components/Actions/Button",
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

<Story name="States" parameters={{ controls: { disable: true }, options: { showPanel: false } }} asChild>
	<div class="grid max-w-4xl gap-8">
		<section class="grid gap-3" aria-labelledby="button-variants-heading">
			<div class="flex items-baseline justify-between gap-4">
				<h2 id="button-variants-heading" class="text-sm font-medium">Variants</h2>
				<p class="text-muted-foreground text-xs">通常・無効・読み込み中</p>
			</div>
			<div class="overflow-x-auto rounded-lg border">
				<table class="w-full min-w-2xl text-left text-sm">
					<thead class="bg-muted/50 text-muted-foreground text-xs">
						<tr>
							<th class="px-4 py-3 font-medium">Variant</th>
							<th class="px-4 py-3 font-medium">通常</th>
							<th class="px-4 py-3 font-medium">無効</th>
							<th class="px-4 py-3 font-medium">読み込み中</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each comparisonVariants as variant}
							<tr>
								<th class="text-muted-foreground px-4 py-3 font-mono text-xs font-normal">{variant}</th>
								<td class="px-4 py-3"><Button {variant}>操作する</Button></td>
								<td class="px-4 py-3"><Button {variant} disabled>操作不可</Button></td>
								<td class="px-4 py-3"><Button {variant} loading>処理中</Button></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>

		<section class="grid gap-3" aria-labelledby="button-sizes-heading">
			<h2 id="button-sizes-heading" class="text-sm font-medium">Sizes</h2>
			<div class="flex flex-wrap items-end gap-3 rounded-lg border p-4">
				{#each comparisonSizes as size}
					<div class="grid justify-items-center gap-2">
						<Button {size} icon={PlusIcon}>新規作成</Button>
						<code class="text-muted-foreground text-xs">{size}</code>
					</div>
				{/each}
				{#each ["icon-xs", "icon-sm", "icon", "icon-lg"] as size}
					<div class="grid justify-items-center gap-2">
						<Button size={size as ButtonSize} icon={SettingsIcon} variant="outline" aria-label={`${size}の設定`} />
						<code class="text-muted-foreground text-xs">{size}</code>
					</div>
				{/each}
			</div>
		</section>

		<section class="grid gap-3" aria-labelledby="button-content-heading">
			<h2 id="button-content-heading" class="text-sm font-medium">Content</h2>
			<div class="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
				<div class="flex flex-wrap items-center gap-3">
					<Button icon={SaveIcon}>保存する</Button>
					<Button icon={SettingsIcon} iconPosition="end" variant="outline">設定を開く</Button>
				</div>
				<div class="overflow-x-auto">
					<Button variant="secondary">選択したすべての項目へ同じ設定を適用する</Button>
				</div>
			</div>
		</section>
	</div>
</Story>
