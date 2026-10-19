<script module lang="ts">
import type { HTMLAttributes } from 'svelte/elements';
import type { WithElementRef } from '../utils.js';

export type ChatMessageEditorProps = WithElementRef<Omit<HTMLAttributes<HTMLFormElement>, 'children' | 'onsubmit'>> & {
  value?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  /** Abort work in the consumer; editing stays open until the consumer changes it. */
  onStop?: () => void;
  submitting?: boolean;
  disabled?: boolean;
  error?: string;
  /** Consumer-owned impact description; the component does not modify conversation history. */
  description?: string;
  /** Accessible name for the form and input; the label is visually hidden. */
  label?: string;
  submitLabel?: string;
  submittingLabel?: string;
  cancelLabel?: string;
  stopLabel?: string;
  autofocus?: boolean;
};
</script>

<script lang="ts">
import { Button } from '../button/index.js';
import { Textarea } from '../textarea/index.js';
import { cn } from '../utils.js';
import { focusAfterUpdate } from './focus-after-update.js';

let { ref = $bindable(null), value = $bindable(''), onSubmit, onCancel, onStop,
  submitting = false, disabled = false, error, description, label = 'メッセージを編集',
  submitLabel = '送信', submittingLabel = '送信中', cancelLabel = 'キャンセル',
  stopLabel = '生成を停止', autofocus = true, class: className, ...restProps }: ChatMessageEditorProps = $props();
const id = $props.id();
let input = $state<HTMLTextAreaElement | null>(null);
let stopButton = $state<HTMLButtonElement | null>(null);
let wasSubmitting = false;
const locked = $derived(disabled || submitting);
const canSubmit = $derived(!locked && Boolean(value.trim()));
const describedBy = $derived([description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(' ') || undefined);
$effect(() => { if (autofocus && input) focusAfterUpdate(document.activeElement, () => input); });
$effect.pre(() => {
  const next = submitting;
  if (next === wasSubmitting) return;
  wasSubmitting = next;
  const active = document.activeElement;
  if (!ref?.contains(active)) return;
  focusAfterUpdate(active, () => submitting && onStop ? stopButton : input);
});
function submit() { if (canSubmit) onSubmit(value.trim()); }
function keydown(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229 || locked) return;
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onCancel(); }
  else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); submit(); }
}
</script>

<form bind:this={ref} {...restProps} data-slot="chat-message-editor" data-submitting={submitting} class={cn('message-editor', className)} aria-labelledby={`${id}-label`} onsubmit={event => { event.preventDefault(); submit(); }}>
  <label id={`${id}-label`} for={`${id}-input`} class="sr-only">{label}</label>
  <Textarea bind:ref={input} id={`${id}-input`} bind:value readonly={submitting} {disabled} aria-describedby={describedBy} aria-invalid={Boolean(error)} class="editor-input" onkeydown={keydown} />
  {#if description}<p id={`${id}-description`} class="editor-description">{description}</p>{/if}
  {#if error}<p id={`${id}-error`} role="alert" class="editor-error">{error}</p>{/if}
  <div class="editor-controls">
    <Button variant="ghost" disabled={locked} onclick={onCancel} onkeydown={keydown}>{cancelLabel}</Button>
    {#if submitting && onStop}<Button bind:ref={stopButton} variant="outline" {disabled} onclick={onStop}>{stopLabel}</Button>{/if}
    <Button type="submit" loading={submitting} disabled={!canSubmit} onkeydown={keydown}>{submitting ? submittingLabel : submitLabel}</Button>
  </div>
  <span role="status" class="sr-only">{submitting ? submittingLabel : ''}</span>
</form>

<style>
.message-editor { display: grid; gap: 8px; width: 100%; min-width: 0; color: var(--foreground); white-space: normal; }
.message-editor :global(.editor-input) { min-height: 80px; max-height: 320px; resize: vertical; background: var(--background); padding: 10px 12px; font-size: 16px; line-height: 1.7; }
.editor-description, .editor-error { font-size: 12px; line-height: 1.65; overflow-wrap: anywhere; }
.editor-description { color: var(--muted-foreground); }
.editor-error { color: var(--destructive); }
.editor-controls { display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap; gap: 8px; }
.editor-controls :global(button) { min-height: 44px; white-space: normal; font-size: 13px; }
@media (min-width: 768px) { .message-editor :global(.editor-input) { font-size: 14px; } }
</style>
