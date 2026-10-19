<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import * as Bubble from "@mutsuna/ui/bubble";
const variants = ["default", "secondary", "muted", "tinted", "outline", "ghost", "destructive"] as const;
const { Story } = defineMeta({ title: "Components/Data Display/Bubble", component: Bubble.Root, tags: ["autodocs"] });
</script>
<Story name="Variants" asChild>
  <div class="grid max-w-md gap-5">
    {#each variants as variant}
      <div class="grid gap-2"><span class="text-xs text-muted-foreground">{variant}</span><Bubble.Root {variant}><Bubble.Content>メッセージの色と余白を、配置から独立して選べます。</Bubble.Content></Bubble.Root></div>
    {/each}
  </div>
</Story>
