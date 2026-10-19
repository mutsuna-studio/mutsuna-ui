<script lang="ts">
import { ScrollbarArea } from "@mutsuna/ui/scrollbar";
import { Button } from "@mutsuna/ui/button";
let { radius = "24px", direction = "ltr" }: { radius?: string; direction?: "ltr" | "rtl" } = $props();
let clicks = $state(0);
</script>
<ScrollbarArea role="region" aria-label="角丸のスクロール領域" dir={direction} class="max-w-full" style={`width:320px;height:180px;overflow:auto;border:1px solid var(--border);border-radius:${radius};background:var(--background);`}>
  <div style="width:800px;height:900px;padding:16px">
    <Button onclick={() => clicks++}>領域内の操作</Button>
    <output aria-label="領域内の操作回数">{clicks}</output>
    <p>角丸の枠に収まる縦横スクロール</p>
  </div>
</ScrollbarArea>
