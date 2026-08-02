<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Button from "@mutsuna/ui/button/button.svelte";
import Toaster from "@mutsuna/ui/sonner/sonner.svelte";
import { readFormActionToast, showFormActionToast } from "@mutsuna/ui/sveltekit-form";

const { Story } = defineMeta({
  title: "UI/SvelteKit Form Action Toast",
  component: Toaster,
  tags: ["autodocs"],
});

const successPayload = { status: "success", message: "保存しました。" };
const errorPayload = { status: "error", message: "保存できませんでした。" };
</script>

<Story name="Payload Normalization" asChild>
  <div class="grid max-w-lg gap-4">
    <Toaster richColors />
    <div class="flex flex-wrap gap-2">
      <Button onclick={() => showFormActionToast(successPayload)}>Success result</Button>
      <Button variant="destructive" onclick={() => showFormActionToast(errorPayload)}>Error result</Button>
    </div>
    <pre class="overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(readFormActionToast(successPayload), null, 2)}</pre>
  </div>
</Story>
