<script lang="ts">
import { tick, untrack } from "svelte";
import { useMessageScroller } from "@mutsuna/ui/message-scroller";
let { request, editTarget = null, topInset = 0 }: { request: number; editTarget?: number | null; topInset?: number } = $props();
const scroller = useMessageScroller();
$effect(() => {
  if (request > 0) untrack(() => { void tick().then(() => scroller.scrollToEnd({ behavior: "instant" })); });
});
$effect(() => {
  const target = editTarget;
  if (target !== null) untrack(() => { void tick().then(() => scroller.scrollToMessage(String(target), { behavior: "instant", align: "start", scrollMargin: topInset + 16 })); });
});
</script>
