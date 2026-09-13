<script lang="ts">
import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
import PipetteIcon from "@lucide/svelte/icons/pipette";
import { onDestroy, untrack } from "svelte";
import Button from "../button/button.svelte";
import PopoverContent from "../popover/popover-content.svelte";
import Popover from "../popover/popover.svelte";
import PopoverTrigger from "../popover/popover-trigger.svelte";
import RollingText from "../rolling-text/rolling-text.svelte";
import { wheelNavigation } from "../rolling-text/wheel-navigation.js";
import { cn } from "../utils.js";
import { colorFormats, formatColor, hsvToRgb, parseColor, rgbToHsv, type ColorFormat, type HsvColor, type RgbColor } from "./color.js";

export type ColorPickerProps = {
  value: string;
  onchange?: (value: string) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  format?: ColorFormat;
  "aria-label"?: string;
  "aria-describedby"?: string;
  class?: string;
};

const fallbackRgb: RgbColor = { r: 25, g: 26, b: 34 };

let {
  value = $bindable<string>(), onchange, name, id, disabled = false, required = false, format,
  "aria-label": ariaLabel = "色を選択", "aria-describedby": ariaDescribedBy, class: className,
}: ColorPickerProps = $props();

const initial = parseColor(value);
const initialRgb = initial?.rgb ?? fallbackRgb;
const initialFormat = untrack(() => format) ?? initial?.format ?? "hex";
let rgb = $state<RgbColor>(initialRgb);
let hsv = $state<HsvColor>(rgbToHsv(initialRgb));
let activeFormat = $state<ColorFormat>(initialFormat);
let draftValue = $state(value);
let errorMessage = $state<string | null>(initial ? null : "HEX、RGB、HSL、OKLCHのいずれかで入力してください。");
let open = $state(false);
let closedByOutsideInteraction = false;
let formatChangeFrame: number | undefined;
let formatChangeDirection = $state<"up" | "down">("up");
const formatChangeDuration = 320;
const inputId = $derived(id ?? "color-picker");
const errorId = $derived(`${inputId}-error`);
const describedBy = $derived([ariaDescribedBy, errorMessage ? errorId : undefined].filter(Boolean).join(" ") || undefined);
const previewColor = $derived(formatColor(rgb, "hex"));
const previewForeground = $derived(readableForeground(rgb));
const hueColor = $derived(`hsl(${hsv.h} 100% 50%)`);
const squareX = $derived(`${hsv.s}%`);
const squareY = $derived(`${100 - hsv.v}%`);
const hueY = $derived(`${(hsv.h / 360) * 100}%`);
const formatWidthValues = $derived(colorFormats.map((candidate) => formatColor(rgb, candidate)));

$effect(() => {
  const next = value;
  const forcedFormat = format;
  untrack(() => {
    const parsed = parseColor(next);
    if (forcedFormat) activeFormat = forcedFormat;
    else if (parsed) activeFormat = parsed.format;
    if (next === draftValue) return;
    draftValue = next;
    if (!parsed) { errorMessage = "HEX、RGB、HSL、OKLCHのいずれかで入力してください。"; return; }
    rgb = parsed.rgb;
    hsv = rgbToHsv(parsed.rgb);
    errorMessage = null;
  });
});

function commitColor(nextHsv: HsvColor): void {
  hsv = { h: Math.max(0, Math.min(360, nextHsv.h)), s: Math.max(0, Math.min(100, nextHsv.s)), v: Math.max(0, Math.min(100, nextHsv.v)) };
  rgb = hsvToRgb(hsv);
  draftValue = formatColor(rgb, activeFormat);
  errorMessage = null;
  commit(draftValue);
}

function commit(nextValue: string): void {
  if (value === nextValue) return;
  value = nextValue;
  onchange?.(nextValue);
}

function updateText(event: Event): void {
  const target = event.currentTarget;
  if (!(target instanceof HTMLInputElement)) return;
  draftValue = target.value;
  const parsed = parseColor(target.value);
  if (!parsed) { errorMessage = "HEX、RGB、HSL、OKLCHのいずれかで入力してください。"; return; }
  rgb = parsed.rgb;
  hsv = rgbToHsv(parsed.rgb);
  activeFormat = format ?? parsed.format;
  errorMessage = null;
  commit(format ? formatColor(rgb, format) : target.value.trim());
}

function changeFormat(offset: 1 | -1, animationDirection: "up" | "down" = offset > 0 ? "up" : "down"): void {
  if (disabled || format) return;
  if (formatChangeFrame !== undefined) cancelAnimationFrame(formatChangeFrame);
  formatChangeDirection = animationDirection;
  activeFormat = colorFormats[(colorFormats.indexOf(activeFormat) + offset + colorFormats.length) % colorFormats.length]!;
  const nextValue = formatColor(rgb, activeFormat);
  formatChangeFrame = requestAnimationFrame(() => {
    formatChangeFrame = requestAnimationFrame(() => {
      draftValue = nextValue;
      commit(nextValue);
      formatChangeFrame = undefined;
    });
  });
}

function cycleFormat(event: MouseEvent): void {
  event.stopPropagation();
  changeFormat(1);
}

onDestroy(() => {
  if (formatChangeFrame !== undefined) cancelAnimationFrame(formatChangeFrame);
});

function inputTriggerProps(props: Record<string, unknown>): Record<string, unknown> {
  const { type: _type, role: _role, "aria-haspopup": _hasPopup, "aria-expanded": _expanded, ...inputProps } = props;
  return inputProps;
}

function handleInteractOutside(): void {
  closedByOutsideInteraction = true;
}

function handleCloseAutoFocus(event: Event): void {
  if (!closedByOutsideInteraction) return;
  event.preventDefault();
  closedByOutsideInteraction = false;
}

function updateSquare(event: PointerEvent): void {
  if (disabled) return;
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement)) return;
  target.setPointerCapture?.(event.pointerId);
  const bounds = target.getBoundingClientRect();
  commitColor({ ...hsv, s: ((event.clientX - bounds.left) / bounds.width) * 100, v: 100 - ((event.clientY - bounds.top) / bounds.height) * 100 });
}

function updateHue(event: PointerEvent): void {
  if (disabled) return;
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement)) return;
  target.setPointerCapture?.(event.pointerId);
  const bounds = target.getBoundingClientRect();
  commitColor({ ...hsv, h: ((event.clientY - bounds.top) / bounds.height) * 360 });
}

function moveSquare(event: KeyboardEvent): void {
  const amount = event.shiftKey ? 10 : 1;
  if (event.key === "ArrowLeft") commitColor({ ...hsv, s: hsv.s - amount });
  else if (event.key === "ArrowRight") commitColor({ ...hsv, s: hsv.s + amount });
  else if (event.key === "ArrowUp") commitColor({ ...hsv, v: hsv.v + amount });
  else if (event.key === "ArrowDown") commitColor({ ...hsv, v: hsv.v - amount });
  else return;
  event.preventDefault();
}

function moveHue(event: KeyboardEvent): void {
  const amount = event.shiftKey ? 10 : 1;
  if (event.key === "ArrowUp" || event.key === "ArrowRight") commitColor({ ...hsv, h: hsv.h + amount });
  else if (event.key === "ArrowDown" || event.key === "ArrowLeft") commitColor({ ...hsv, h: hsv.h - amount });
  else return;
  event.preventDefault();
}

function readableForeground(color: RgbColor): "#000000" | "#FFFFFF" {
  const channels = [color.r, color.g, color.b].map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
  return luminance > 0.179 ? "#000000" : "#FFFFFF";
}
</script>

<div class={cn("inline-grid w-72 gap-2", className)} data-slot="color-picker">
  {#if name !== undefined}<input type="hidden" {name} value={errorMessage ? "" : draftValue} {required} />{/if}
  <Popover bind:open>
    <div class="relative grid min-w-0" style={`--picker-preview: ${previewColor}; --picker-preview-foreground: ${previewForeground}`}>
      <PopoverTrigger>
        {#snippet child({ props })}
          <input {...inputTriggerProps(props)} type="text" id={inputId} class="color-trigger-input" value={draftValue} aria-label={ariaLabel} aria-describedby={describedBy} aria-invalid={errorMessage ? true : undefined} autocomplete="off" spellcheck="false" {disabled} {required} oninput={updateText} use:wheelNavigation={{ onPrevious: () => changeFormat(-1, "up"), onNext: () => changeFormat(1, "down"), disabled: disabled || Boolean(format) }} />
        {/snippet}
      </PopoverTrigger>
      <PipetteIcon class="color-preview-icon pointer-events-none absolute top-3 left-2.5 z-10 size-4" aria-hidden="true" />
      <RollingText value={draftValue} widthValues={formatWidthValues} direction={formatChangeDirection} duration={formatChangeDuration} aria-hidden="true" class="color-format-text pointer-events-none absolute top-2.5 right-11 left-8 z-10 font-mono text-sm" />
      <Button type="button" variant="ghost" size="icon" icon={ChevronsUpDownIcon} class="color-preview-control absolute top-1 right-1 z-10 size-8" aria-label={`色の表示形式を変更。現在は${activeFormat.toUpperCase()}`} title={`表示形式: ${activeFormat.toUpperCase()}`} disabled={disabled || Boolean(format)} onclick={cycleFormat} />
    </div>
    <PopoverContent align="start" sideOffset={8} class="color-picker-popover w-[min(22rem,calc(100vw-2rem))] p-3" onOpenAutoFocus={(event) => event.preventDefault()} onInteractOutside={handleInteractOutside} onCloseAutoFocus={handleCloseAutoFocus}>
      <div class="flex gap-3">
        <div class="color-square" style={`--picker-hue: ${hueColor}; --picker-x: ${squareX}; --picker-y: ${squareY}`} role="slider" tabindex={disabled ? undefined : 0} aria-label="彩度と明るさ" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(hsv.s)} aria-valuetext={`彩度 ${Math.round(hsv.s)}%、明るさ ${Math.round(hsv.v)}%`} aria-disabled={disabled} onpointerdown={updateSquare} onpointermove={(event) => { if (event.buttons === 1) updateSquare(event); }} onkeydown={moveSquare}><span class="color-square-thumb" aria-hidden="true"></span></div>
        <div class="hue-strip" style={`--picker-hue-y: ${hueY}`} role="slider" tabindex={disabled ? undefined : 0} aria-label="色相" aria-valuemin="0" aria-valuemax="360" aria-valuenow={Math.round(hsv.h)} aria-disabled={disabled} onpointerdown={updateHue} onpointermove={(event) => { if (event.buttons === 1) updateHue(event); }} onkeydown={moveHue}><span class="hue-thumb" aria-hidden="true"></span></div>
      </div>
    </PopoverContent>
  </Popover>
  {#if errorMessage}<p id={errorId} class="text-xs text-destructive" role="alert">{errorMessage}</p>{/if}
</div>

<style>
  .color-trigger-input { height: 2.5rem; width: 100%; min-width: 0; border: 1px solid color-mix(in oklch, var(--picker-preview-foreground) 22%, var(--picker-preview)); border-radius: 0.5rem; background: var(--picker-preview); padding: 0.5rem 2.75rem 0.5rem 2rem; color: transparent; caret-color: transparent; font-family: var(--font-mono); font-size: var(--text-sm); outline: none; transition: border-color 150ms ease, background-color 150ms ease; }
  .color-trigger-input:hover { border-color: color-mix(in oklch, var(--picker-preview-foreground) 35%, var(--picker-preview)); }
  .color-trigger-input::selection { background: color-mix(in oklch, var(--picker-preview-foreground) 25%, transparent); }
  .color-trigger-input:focus { color: var(--picker-preview-foreground); caret-color: var(--picker-preview-foreground); }
  .color-trigger-input:focus-visible { border-color: var(--ring); }
  .color-trigger-input:focus ~ :global(.color-format-text) { visibility: hidden; }
  .color-trigger-input[aria-invalid="true"] { border-color: var(--destructive); }
  .color-trigger-input:disabled { cursor: not-allowed; opacity: 0.5; }
  :global(.color-format-text) { color: var(--picker-preview-foreground); line-height: 1.25rem; }
  :global(.color-preview-icon) { color: var(--picker-preview-foreground); }
  :global(.color-preview-control) { color: var(--picker-preview-foreground); }
  :global(.color-preview-control:hover) { background: color-mix(in oklch, var(--picker-preview-foreground) 12%, transparent); color: var(--picker-preview-foreground); }
  .color-picker-popover { gap: 0.75rem; }
  .color-square { position: relative; min-width: 0; flex: 1; aspect-ratio: 1.18; cursor: crosshair; touch-action: none; overflow: hidden; border-radius: 0.5rem; background: linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, transparent), var(--picker-hue); outline: none; }
  .color-square:focus-visible, .hue-strip:focus-visible { box-shadow: 0 0 0 3px color-mix(in oklch, var(--ring) 50%, transparent); }
  .color-square-thumb { position: absolute; left: var(--picker-x); top: var(--picker-y); width: 1.25rem; height: 1.25rem; border: 2px solid white; border-radius: 9999px; box-shadow: 0 1px 3px rgb(0 0 0 / 60%), inset 0 0 0 1px rgb(0 0 0 / 20%); transform: translate(-50%, -50%); }
  .hue-strip { position: relative; width: 0.875rem; flex: none; cursor: ns-resize; touch-action: none; border-radius: 9999px; background: linear-gradient(to bottom, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00); outline: none; }
  .hue-thumb { position: absolute; left: 50%; top: var(--picker-hue-y); width: 1.4rem; height: 0.45rem; border: 2px solid white; border-radius: 9999px; background: transparent; box-shadow: 0 1px 3px rgb(0 0 0 / 60%); transform: translate(-50%, -50%); }
</style>
