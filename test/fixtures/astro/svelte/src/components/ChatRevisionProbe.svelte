<script lang="ts">
import { onDestroy, tick } from 'svelte';
import { ChatMessage, ChatMessageEditor, ChatRegenerateAction } from '@mutsuna/ui/chat-message';
import { Button } from '@mutsuna/ui/button';
let question = $state('Original question');
let answer = $state('Original answer');
let later = $state(true);
let editing = $state(false);
let value = $state('');
let submitting = $state(false);
let generating = $state(false);
let error = $state<string>();
let generationError = $state<string>();
let failNext = $state(true);
let dm = $state(false);
let edited = $state(false);
let trigger = $state<HTMLButtonElement | null>(null);
let timer: ReturnType<typeof setTimeout>;
onDestroy(() => clearTimeout(timer));
function restore() { void tick().then(() => trigger?.focus()); }
function stop() { clearTimeout(timer); submitting = false; generating = false; }
function submit(next: string) {
  submitting = true; error = undefined;
  const fail = failNext; failNext = false;
  timer = setTimeout(() => {
    submitting = false;
    if (fail) { error = 'Edit failed; draft retained'; return; }
    question = next;
    if (dm) edited = true; else { answer = 'Answer after edit'; later = false; }
    editing = false; restore();
  }, 400);
}
function regenerate() {
  generating = true; generationError = undefined;
  const fail = failNext; failNext = false;
  timer = setTimeout(() => {
    generating = false;
    if (fail) { generationError = 'Regeneration failed; answer retained'; return; }
    answer = 'Regenerated answer';
  }, 400);
}
</script>

<Button onclick={() => failNext = true}>Fail next operation</Button>
<Button onclick={() => dm = true}>Use DM layout</Button>
<section aria-label="Astro revision" class="grid max-w-3xl gap-6 py-4">
  <ChatMessage author="Question" layout={dm ? 'bubble' : 'timeline'} bubbleVariant={editing ? 'ghost' : undefined} side="outgoing">
    {#snippet metadata()}{#if dm && edited}<span>Edited</span>{/if}{/snippet}
    {#if editing}<ChatMessageEditor bind:value {submitting} {error} label="Astro question editor" description={dm ? undefined : 'Later messages will be replaced after confirmation.'} onSubmit={submit} onCancel={() => { editing = false; restore(); }} onStop={dm ? undefined : stop} />{:else}{question}{/if}
    {#snippet footerActions()}{#if !editing}<Button bind:ref={trigger} disabled={generating} onclick={() => { value = question; error = undefined; editing = true; }}>Edit question</Button>{/if}{/snippet}
  </ChatMessage>
  <ChatMessage author="Answer" layout={dm ? 'bubble' : 'timeline'}>
    {answer}
    {#snippet footerActions()}{#if !dm}<ChatRegenerateAction {generating} error={generationError} disabled={editing} onRegenerate={regenerate} onStop={stop} />{/if}{/snippet}
  </ChatMessage>
  {#if later}<p data-later-message>Later conversation stays until confirmation</p>{/if}
</section>
