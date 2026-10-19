<script module lang="ts">
import type { StickyNoteProps } from "../sticky-note/index.js";
/** Conversation defaults for the generic StickyNote. */
export type ChatMemoProps = StickyNoteProps;
</script>
<script lang="ts">
import { StickyNote } from "../sticky-note/index.js";
let { value = $bindable(""), open = $bindable(false), position = $bindable(null), triggerPosition = $bindable(null), title = "会話のメモ", triggerLabel = "会話のメモ", triggerMode = "inline", "data-slot": dataSlot = "chat-memo", ...props }: ChatMemoProps = $props();
</script>
<StickyNote {...props} bind:value bind:open bind:position bind:triggerPosition {title} {triggerLabel} {triggerMode} data-slot={dataSlot} />
