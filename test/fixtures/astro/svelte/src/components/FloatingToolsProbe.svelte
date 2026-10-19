<script lang="ts">
import { FloatingActionMenu } from "@mutsuna/ui/floating-action-menu";
import { StickyNote } from "@mutsuna/ui/sticky-note";
import * as Menu from "@mutsuna/ui/dropdown-menu";
import { Button } from "@mutsuna/ui/button";
let visible = $state(true);
let open = $state(false);
let noteOpen = $state(false);
let statusOpen = $state(false);
let status = $state("下書き");
let trigger = $state<HTMLButtonElement | null>(null);
let afterClose: (() => void) | undefined;
function showNote() { afterClose = () => noteOpen = true; open = false; }
function closed(event: Event) { const action = afterClose; afterClose = undefined; if (action) { event.preventDefault(); trigger?.focus(); action(); } }
</script>
{#snippet statuses()}
<Menu.RadioGroup value={status} onValueChange={value => { status = value; statusOpen = false; open = false; }}>
  <Menu.RadioItem value="下書き">下書き</Menu.RadioItem><Menu.RadioItem value="完了">完了</Menu.RadioItem>
</Menu.RadioGroup>
{/snippet}
{#if visible}
<header aria-label="Floating tools header" style="display:flex;align-items:center;min-height:52px;padding:4px">
<FloatingActionMenu placement="inline" ariaLabel="Floating tools" bind:open bind:ref={trigger} overflow="compact" onCloseAutoFocus={closed}>
  {#snippet actions()}
    <Button variant="ghost" size="icon-lg" aria-label="Probe memo" onclick={() => noteOpen = true}>M</Button>
    <Menu.Root bind:open={statusOpen}><Menu.Trigger>{#snippet child({ props })}<Button {...props} variant="ghost" size="icon-lg" aria-label="Probe status">S</Button>{/snippet}</Menu.Trigger><Menu.Content aria-label="Probe statuses">{@render statuses()}</Menu.Content></Menu.Root>
  {/snippet}
  {#snippet children()}
    <Menu.Item onclick={showNote}>Open probe memo</Menu.Item>
    <Menu.Sub><Menu.SubTrigger>Probe status</Menu.SubTrigger><Menu.SubContent>{@render statuses()}</Menu.SubContent></Menu.Sub>
  {/snippet}
</FloatingActionMenu>
</header>
<StickyNote triggerMode="none" bind:open={noteOpen} title="Floating tools memo" value="Shared pinned note" />
{/if}
<output aria-label="Floating status">{status}</output>
<Button onclick={() => { noteOpen = false; visible = false; }}>Unmount floating tools</Button>
