<script lang="ts">
import * as Scroller from "@mutsuna/ui/message-scroller";
import { Button } from "@mutsuna/ui/button";
import { Input } from "@mutsuna/ui/input";
let expanded = $state(false);
let overlay = $state(false);
</script>
{#snippet filters()}<Input aria-label="Top bar filter" />{/snippet}
<section aria-label="Astro top bar" style="height:320px;max-width:600px">
  <Scroller.Provider><Scroller.Root>
    <Scroller.TopBar placement={overlay ? "overlay" : "flow"} context={expanded ? filters : undefined}>
      <time datetime="2026-10-19">10/19</time>
      {#snippet actions()}<Button onclick={() => overlay = !overlay}>Top bar placement</Button><Button aria-expanded={expanded} onclick={() => expanded = !expanded}>Top bar filters</Button>{/snippet}
    </Scroller.TopBar>
    <Scroller.Viewport aria-label="Top bar history"><Scroller.Content class="p-4 gap-4">
      {#each Array.from({ length: 20 }, (_, index) => index) as index}<Scroller.Item messageId={String(index)} class="[content-visibility:visible]"><p>Top bar message {index + 1}</p></Scroller.Item>{/each}
    </Scroller.Content></Scroller.Viewport>
  </Scroller.Root></Scroller.Provider>
</section>
