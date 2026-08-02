<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import ClientReady from "@mutsuna/ui/client-ready";

const { Story } = defineMeta({
  title: "UI/Client Ready",
  component: ClientReady,
  tags: ["autodocs"],
});
</script>

<Story name="Default" asChild>
  <ClientReady>
    <div class="rounded-md border bg-card p-4 text-card-foreground">クライアントで準備完了</div>
    {#snippet fallback()}
      <div class="rounded-md border p-4 text-muted-foreground">準備中</div>
    {/snippet}
  </ClientReady>
</Story>
