<script module lang="ts">
import type { HTMLAttributes } from 'svelte/elements';
import type { WithElementRef } from '../utils.js';
export type ChatRegenerateActionProps = WithElementRef<Omit<HTMLAttributes<HTMLDivElement>, 'children'>> & {
  onRegenerate: () => void;
  onStop?: () => void;
  generating?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
  generatingLabel?: string;
  retryLabel?: string;
  stopLabel?: string;
  ariaLabel?: string;
};
</script>
<script lang="ts">
import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
import Square from '@lucide/svelte/icons/square';
import { Button } from '../button/index.js';
import { cn } from '../utils.js';
import { focusAfterUpdate } from './focus-after-update.js';
let { ref = $bindable(null), onRegenerate, onStop, generating = false, disabled = false, error,
  label = '回答を再生成', generatingLabel = '回答を生成中', retryLabel = '再生成を再試行', stopLabel = '生成を停止',
  ariaLabel = '回答の再生成', class: className, ...restProps }: ChatRegenerateActionProps = $props();
const id = $props.id();
let trigger = $state<HTMLButtonElement | null>(null);
let stopButton = $state<HTMLButtonElement | null>(null);
let wasGenerating = false;
$effect.pre(() => {
  const next = generating;
  if (next === wasGenerating) return;
  wasGenerating = next;
  const active = document.activeElement;
  if (!ref?.contains(active)) return;
  focusAfterUpdate(active, () => generating ? (onStop ? stopButton : ref) : trigger);
});
</script>

<div bind:this={ref} {...restProps} data-slot="chat-regenerate-action" data-generating={generating} class={cn('regenerate-action', className)} role="group" aria-label={ariaLabel} tabindex="-1" aria-describedby={error ? `${id}-error` : undefined}>
  <div class="regenerate-controls">
    <Button bind:ref={trigger} variant="ghost" size="sm" icon={RotateCcw} loading={generating} disabled={disabled || generating} onclick={() => { if (!disabled && !generating) onRegenerate(); }}>{generating ? generatingLabel : error ? retryLabel : label}</Button>
    {#if generating && onStop}<Button bind:ref={stopButton} variant="outline" size="sm" icon={Square} {disabled} onclick={onStop}>{stopLabel}</Button>{/if}
  </div>
  {#if error}<p id={`${id}-error`} class="regenerate-error" role="alert">{error}</p>{/if}
  <span role="status" class="sr-only">{generating ? generatingLabel : ''}</span>
</div>

<style>
.regenerate-action { display: grid; gap: 4px; min-width: 0; max-width: 100%; white-space: normal; }
.regenerate-action:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; border-radius: 8px; }
.regenerate-controls { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.regenerate-controls :global(button) { min-height: 44px; max-width: 100%; white-space: normal; }
.regenerate-error { color: var(--destructive); font-size: 12px; line-height: 1.65; overflow-wrap: anywhere; }
</style>
