<script lang="ts">
  import { tick } from "svelte";
  import { MarkdownTextEditor } from "@mutsuna/ui/markdown";
  let visible = $state(false);
  let value = $state("Initial");
  let changes = $state(0);
  async function mountAndUpdate() {
    value = "Initial";
    visible = true;
    await tick();
    value = "Latest";
  }
  async function mountAndRemove() {
    visible = true;
    await tick();
    visible = false;
  }
</script>
<button type="button" onclick={mountAndUpdate}>Mount and update markdown</button>
<button type="button" onclick={mountAndRemove}>Mount and remove markdown</button>
<button type="button" onclick={() => visible = false}>Remove markdown</button>
<button type="button" onclick={() => value = "External"}>Replace markdown</button>
<span data-testid="markdown-changes">{changes}</span>
<span data-testid="markdown-value">{value}</span>
{#if visible}
  <MarkdownTextEditor id="lifecycle-markdown" label="Lifecycle markdown" {value} onMarkdownChange={next => { value = next; changes++; }} />
{/if}
