<script lang="ts">
import { tick } from "svelte";
import RollingText, { type RollingTextDirection } from "./rolling-text.svelte";
import { wheelNavigation } from "./wheel-navigation.js";
import { normalizeNumericInput } from "./numeric-input.js";
import { normalizeDateTimeInputText } from "../date-time-input/index.js";
import { cn } from "../utils.js";

let { ref = $bindable(null), value, label, displayValue = value, widthValues = [displayValue], direction = "up", digits = 2,
  min, max, disabled = false, class: className, normalize, onCommit, onStep, onTab, onComplete, onEnter, onBoundary, onDigits, onTextCommit, advanceKeys = [] }: {
  ref?: HTMLInputElement | null;
  value: string;
  label: string;
  displayValue?: string;
  widthValues?: string[];
  direction?: RollingTextDirection;
  digits?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  class?: string;
  normalize: (draft: string) => string;
  onCommit: (value: string) => void;
  onStep: (offset: number) => void;
  onTab?: (shift: boolean) => void;
  onComplete?: () => void;
  onEnter?: () => void;
  onBoundary?: (end: boolean) => void;
  onTextCommit?: (text: string) => boolean;
  onDigits?: (digits: string) => boolean;
  advanceKeys?: string[];
} = $props();
let draft = $state("");
let editing = $state(false);
let composing = false;
let dirty = false;
let selectionFrame = 0;
$effect(() => { draft = value; });
function commit() {
  if (disabled || composing || !dirty) return;
  dirty = false;
  if (onTextCommit?.(draft)) { editing = false; void tick().then(() => draft = value); return; }
  draft = normalize(draft);
  onCommit(draft);
}
function focus(event: FocusEvent) {
  editing = true;
  draft = value;
  const input = event.currentTarget as HTMLInputElement;
  selectionFrame = requestAnimationFrame(() => { if (document.activeElement === input) input.select(); });
}
function select(event: MouseEvent) {
  event.preventDefault();
  (event.currentTarget as HTMLInputElement).select();
}
function input(event: Event) {
  cancelAnimationFrame(selectionFrame);
  if (composing) return;
  const element = event.currentTarget as HTMLInputElement;
  draft = onTextCommit ? normalizeDateTimeInputText(element.value).slice(0, 64) : normalizeNumericInput(element.value, digits);
  element.value = draft;
  dirty = true;
  editing = true;
  if (onDigits?.(draft)) {
    dirty = false;
    editing = false;
    void tick().then(() => { draft = value; });
    return;
  }
  if (draft.length === digits && onComplete) {
    commit();
    void tick().then(() => onComplete?.());
  }
}
function step(offset: number) {
  if (disabled || composing) return;
  dirty = false;
  editing = false;
  onStep(offset);
  void tick().then(() => draft = value);
}
function keyboard(node: HTMLInputElement) {
  node.addEventListener("keydown", keydown, { capture: true });
  return { destroy() { node.removeEventListener("keydown", keydown, { capture: true }); } };
}
function keydown(event: KeyboardEvent) {
  if (disabled || composing || event.isComposing) return;
  if (event.key === "Tab") {
    commit();
    if (onTab) { event.preventDefault(); event.stopPropagation(); onTab(event.shiftKey); }
  } else if (event.key === "Enter" || advanceKeys.includes(event.key)) {
    event.preventDefault();
    commit();
    editing = false;
    if (onEnter) void tick().then(() => onEnter?.());
  } else if (event.key === "Escape") {
    dirty = false;
    draft = value;
    editing = false;
  } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    event.preventDefault();
    event.stopPropagation();
    step(event.key === "ArrowUp" ? -1 : 1);
  } else if ((event.key === "Home" || event.key === "End") && onBoundary) {
    event.preventDefault();
    dirty = false;
    editing = false;
    onBoundary(event.key === "End");
  }
}
</script>

<div class={cn("numeric-roller", className)} data-editing={editing} data-disabled={disabled}
  use:wheelNavigation={{ mode: "continuous", threshold: 24, disabled, onPrevious: (steps) => step(-steps), onNext: (steps) => step(steps) }}>
  <span class="roller-value" aria-hidden="true"><RollingText value={displayValue} {widthValues} {direction} duration={180} align="center" /></span>
  <input bind:this={ref} value={draft} role="spinbutton" inputmode="numeric" autocomplete="off" {disabled}
    aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={Number(value)} aria-valuetext={displayValue}
    onfocus={focus} onmouseup={select} oninput={input} use:keyboard onblur={() => { commit(); editing = false; }}
    oncompositionstart={() => composing = true} oncompositionend={(event) => { composing = false; input(event); }} />
</div>

<style>
.numeric-roller { position: relative; display: grid; height: 3rem; place-items: center; overflow: hidden; border: 1px solid var(--input); border-radius: var(--radius-lg); background: transparent; font-weight: 600; line-height: 1; font-variant-numeric: tabular-nums; cursor: ns-resize; transition: border-color 150ms ease, background-color 150ms ease; }
.numeric-roller:hover { border-color: var(--ring); }
.numeric-roller:focus-within { border-color: var(--ring); background: color-mix(in oklch, var(--ring) 4%, transparent); }
.roller-value { grid-area: 1 / 1; transition: opacity 120ms ease; }
input { grid-area: 1 / 1; min-width: 0; width: 100%; height: 100%; border: 0; background: transparent; color: transparent; caret-color: transparent; text-align: center; font: inherit; line-height: 1; outline: none; cursor: text; }
.numeric-roller[data-editing="true"] .roller-value { opacity: 0; }
.numeric-roller[data-editing="true"] input { color: var(--foreground); caret-color: var(--foreground); }
.numeric-roller[data-disabled="true"] { opacity: 0.5; cursor: default; }
</style>
