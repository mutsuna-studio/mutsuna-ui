<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import type { ComponentProps } from "svelte";
import { Loading, loadingVariants } from "@mutsuna/ui/loading";

type LoadingStoryArgs = ComponentProps<typeof Loading>;

const { Story } = defineMeta({
  title: "UI/Loading",
  component: Loading,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: loadingVariants,
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    count: {
      control: { type: "number", min: 1, max: 8, step: 1 },
    },
    label: {
      control: "text",
    },
  },
  args: {
    variant: "dots",
    size: "md",
    count: 3,
    label: "読み込み中",
  } satisfies LoadingStoryArgs,
  render: template,
});
</script>

{#snippet template(args: LoadingStoryArgs)}
  <div class="grid max-w-2xl gap-8">
    <section class="grid gap-3" aria-labelledby="loading-preview-heading">
      <div class="flex items-center justify-between gap-4">
        <h2 id="loading-preview-heading" class="text-sm font-medium">Controls preview</h2>
        <code class="text-muted-foreground text-xs">{args.variant ?? "dots"}</code>
      </div>
      <div class="flex min-h-24 items-center justify-center rounded-lg border p-6">
        <Loading
          variant={args.variant}
          size={args.size}
          count={args.count}
          label={args.label}
          class="text-primary"
        />
      </div>
    </section>

    <section class="grid gap-3" aria-labelledby="loading-catalog-heading">
      <h2 id="loading-catalog-heading" class="text-sm font-medium">All variants</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        {#each loadingVariants as variant}
          <div class="flex min-h-16 items-center justify-between gap-6 rounded-lg border p-4">
            <code class="text-muted-foreground text-xs">{variant}</code>
            <Loading {variant} label={`${variant}で読み込み中`} class="text-primary" />
          </div>
        {/each}
      </div>
    </section>
  </div>
{/snippet}

<Story name="Default" />
