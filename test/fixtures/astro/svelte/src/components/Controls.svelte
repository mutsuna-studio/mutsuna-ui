<script lang="ts">
  import { Button } from "@mutsuna/ui/button";
  import { Input } from "@mutsuna/ui/input";
  import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@mutsuna/ui/dialog";

  let count = $state(0);
  let name = $state("");
</script>

<div class="grid max-w-sm gap-4">
  <Button id="counter" onclick={() => count += 1}>Count: {count}</Button>
  <Button disabled>Disabled</Button>
  <Input id="name" aria-label="Name" bind:value={name} />
  <output aria-live="polite">Hello {name}</output>
  <Dialog>
    <DialogTrigger>
      {#snippet child({ props })}<Button {...props}>Open dialog</Button>{/snippet}
    </DialogTrigger>
    <DialogContent><DialogTitle>Astro dialog</DialogTitle><p>Hydrated Svelte island</p></DialogContent>
  </Dialog>
</div>
