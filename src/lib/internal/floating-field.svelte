<script lang="ts">
import type { Snippet } from "svelte";
import { cn } from "../utils.js";
let { label, for: controlId, raised = false, class: className, children }: {
  label: string; for: string; raised?: boolean; class?: string; children: Snippet;
} = $props();
</script>
<div class={cn("floating-input", className)} class:raised>
  {@render children()}
  <fieldset aria-hidden="true"><legend><span>{label}</span></legend></fieldset>
  <label for={controlId}>{label}</label>
</div>
<style>

  .floating-input { --floating-outline: var(--color-input); position: relative; align-self: start; width: 100%; min-width: 0; interpolate-size: allow-keywords; }
  .floating-input :global([data-floating-control]) { border-color: transparent !important; background-clip: padding-box; box-shadow: none; }
  fieldset { position: absolute; inset: -0.5rem 0 0; margin: 0; padding: 0 calc(0.75rem - 0.25rem - 1px); border: 1px solid var(--floating-outline); border-radius: var(--radius-lg); pointer-events: none; min-width: 0; }
  legend { width: 0; max-width: 100%; height: 1rem; overflow: hidden; padding: 0; font-size: 0.75rem; white-space: nowrap; transition: width 280ms cubic-bezier(0.16, 1, 0.3, 1); }
  legend span { padding: 0 0.25rem; visibility: hidden; }
  label { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); max-width: calc(100% - 1.5rem); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-muted-foreground); font-size: 0.875rem; line-height: 1rem; cursor: text; transition: top 180ms cubic-bezier(0.2, 0, 0, 1), font-size 180ms cubic-bezier(0.2, 0, 0, 1), color 150ms ease; }
  .floating-input:has(:global(input:focus)) label,
  .floating-input:has(:global(input:not(:placeholder-shown))) label,
  .floating-input:has(:global(input:autofill)) label,
  .raised label { top: 0; font-size: 0.75rem; }
  .floating-input:has(:global(input:focus)) legend,
  .floating-input:has(:global(input:not(:placeholder-shown))) legend,
  .floating-input:has(:global(input:autofill)) legend,
  .raised legend { width: max-content; }
  .floating-input:has(:global(:focus-visible)),
  .floating-input:has(:global([data-floating-control][data-state="open"])) { --floating-outline: var(--color-ring); }
  .floating-input:has(:global([aria-invalid="true"])) { --floating-outline: var(--color-destructive); }
  .floating-input:has(:global(:focus)) label { color: var(--color-ring); }
  .floating-input:has(:global([aria-invalid="true"])) label { color: var(--color-destructive); }
  .floating-input:has(:global(:disabled)) label { opacity: 0.5; cursor: not-allowed; }
  .floating-input:not(.raised) :global(input:not(:focus)::placeholder) { color: transparent; }
  @media (prefers-reduced-motion: reduce) { label, legend { transition: none; } }
</style>
