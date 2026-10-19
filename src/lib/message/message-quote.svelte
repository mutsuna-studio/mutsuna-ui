<script module lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import type { WithElementRef } from "../utils.js";
export type MessageQuoteProps = WithElementRef<Omit<HTMLAttributes<HTMLDivElement>, "children">> & {
  variant?: "default" | "composer";
  author: string;
  text: string;
  onNavigate?: () => void;
  onDismiss?: () => void;
  disabled?: boolean;
};
</script>
<script lang="ts">
import { X, Reply } from "@lucide/svelte";
import { Button } from "../button/index.js";
import { cn } from "../utils.js";
let { ref = $bindable(null), author, text, variant = "default", onNavigate, onDismiss, disabled = false, class: className, ...restProps }: MessageQuoteProps = $props();
</script>
{#snippet quoteText()}<span class="quote-author">{author}{#if variant === "composer"}に返信{/if}</span><span class="quote-text">{text}</span>{/snippet}
<div bind:this={ref} {...restProps} data-slot="message-quote" data-variant={variant} class={cn("quote", className)}>
  {#if variant === "composer"}<Reply class="quote-context-icon" size={16} aria-hidden="true" />{/if}
  {#if onNavigate}<button type="button" class="quote-content" aria-label={`${author}の元のメッセージへ移動`} {disabled} onclick={onNavigate}>{@render quoteText()}</button>{:else}<blockquote class="quote-content">{@render quoteText()}</blockquote>{/if}
  {#if onDismiss}<Button variant="ghost" size="icon-sm" icon={X} class="quote-dismiss" aria-label="リプライを解除" {disabled} onclick={onDismiss} />{/if}
</div>
<style>
  .quote { display: flex; align-items: center; gap: 4px; min-width: 0; padding: 6px 8px; border-inline-start: 3px solid var(--primary); border-radius: 6px; background: var(--muted); color: var(--foreground); white-space: normal; }
  .quote-content { display: grid; flex: 1; min-width: 0; gap: 3px; padding: 2px 4px; margin: 0; text-align: start; }
  button.quote-content { min-height: 44px; cursor: pointer; }
  .quote-content:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; border-radius: 4px; }
  .quote-author { font-size: 12px; font-weight: 600; }
  .quote-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: var(--muted-foreground); }
  .quote :global(.quote-dismiss) { width: 44px; height: 44px; flex-shrink: 0; }
  .quote[data-variant="composer"] { padding: 0; border: 0; border-radius: 0; background: transparent; gap: 8px; }
  .quote[data-variant="composer"] :global(.quote-context-icon) { flex-shrink: 0; color: var(--muted-foreground); }
  .quote[data-variant="composer"] .quote-content { display: flex; align-items: center; padding: 2px 0; gap: 8px; }
  .quote[data-variant="composer"] .quote-author { flex: 0 1 auto; max-width: 45%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; color: var(--foreground); }
  .quote[data-variant="composer"] .quote-text { flex: 1; min-width: 0; font-size: 12px; }
  .quote[data-variant="composer"] :global(.quote-dismiss) { color: var(--muted-foreground); }
</style>
