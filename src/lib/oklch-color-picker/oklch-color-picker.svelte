<script lang="ts">
import CheckIcon from "@lucide/svelte/icons/check";
import CopyIcon from "@lucide/svelte/icons/copy";
import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
import { untrack } from "svelte";
import Button from "../button/button.svelte";
import PopoverContent from "../popover/popover-content.svelte";
import Popover from "../popover/popover.svelte";
import PopoverTrigger from "../popover/popover-trigger.svelte";
import TooltipContent from "../tooltip/tooltip-content.svelte";
import TooltipProvider from "../tooltip/tooltip-provider.svelte";
import Tooltip from "../tooltip/tooltip.svelte";
import TooltipTrigger from "../tooltip/tooltip-trigger.svelte";
import { cn } from "../utils.js";
import { formatOklchColor, parseOklchColor, type OklchColor } from "./oklch-color.js";

type Props = {
  value: string;
  onchange?: (value: string) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-describedby"?: string;
  class?: string;
};

const fallbackColor: Omit<OklchColor, "value"> = { lightness: 62, chroma: 0.14, hue: 250 };
const huePaletteLightness = 70;
const huePaletteChroma = 0.4;
const presetColors = [
  { label: "ローズ", lightness: 62, chroma: 0.2, hue: 15 },
  { label: "アンバー", lightness: 72, chroma: 0.16, hue: 75 },
  { label: "ライム", lightness: 72, chroma: 0.16, hue: 135 },
  { label: "エメラルド", lightness: 62, chroma: 0.14, hue: 165 },
  { label: "シアン", lightness: 68, chroma: 0.13, hue: 220 },
  { label: "ブルー", lightness: 62, chroma: 0.14, hue: 250 },
  { label: "バイオレット", lightness: 62, chroma: 0.16, hue: 300 },
  { label: "フューシャ", lightness: 62, chroma: 0.18, hue: 340 },
] as const satisfies readonly (Omit<OklchColor, "value"> & { label: string })[];
let {
  value = $bindable<string>(),
  onchange,
  name,
  id,
  disabled = false,
  required = false,
  "aria-describedby": ariaDescribedBy,
  class: className,
}: Props = $props();
let draftValue = $state(value);
let draftColor = $state<Omit<OklchColor, "value">>(readColor(value) ?? fallbackColor);
let errorMessage = $state<string | null>(readError(value));
let isCopied = $state(false);
let copyStatusResetTimer: ReturnType<typeof setTimeout> | undefined;
let initialColor = $state<Omit<OklchColor, "value">>(readColor(value) ?? fallbackColor);

const inputId = $derived(id ?? "oklch-color");
const errorId = $derived(`${inputId}-error`);
const describedBy = $derived([ariaDescribedBy, errorMessage === null ? undefined : errorId].filter(Boolean).join(" ") || undefined);
const previewColor = $derived(formatOklchColor(draftColor));
const submittedValue = $derived(readSubmittedValue(value));
const lightnessThumbColor = $derived(formatOklchColor({ lightness: draftColor.lightness, chroma: 0, hue: 0 }));
const lightnessThumbBorderColor = $derived(formatOklchColor({ lightness: 100 - draftColor.lightness, chroma: 0, hue: 0 }));
const chromaGradient = $derived(createChromaGradient(draftColor.lightness, draftColor.hue));
const chromaThumbBorderColor = $derived(
  formatOklchColor({
    lightness: 100 - draftColor.lightness,
    chroma: 0.4 - draftColor.chroma,
    hue: (draftColor.hue + 180) % 360,
  }),
);
const hueGradient = createHueGradient();
const hueThumbColor = $derived(formatOklchColor({ lightness: huePaletteLightness, chroma: huePaletteChroma, hue: draftColor.hue }));
const hueThumbBorderColor = $derived(
  formatOklchColor({ lightness: 100 - huePaletteLightness, chroma: huePaletteChroma, hue: (draftColor.hue + 180) % 360 }),
);

$effect(() => {
  const nextValue = value;
  untrack(() => {
    const result = parseOklchColor(nextValue);
    if (!result.ok) {
      if (draftValue !== nextValue) draftValue = nextValue;
      errorMessage = result.error;
      return;
    }
    if (draftValue !== result.color.value) initialColor = result.color;
    if (draftValue !== result.color.value) draftValue = result.color.value;
    if (!isSameColor(draftColor, result.color)) draftColor = result.color;
    errorMessage = null;
  });
});

function updateDraftValue(nextValue: string): void {
  draftValue = nextValue;
  const result = parseOklchColor(nextValue);
  if (!result.ok) {
    errorMessage = result.error;
    return;
  }
  draftColor = result.color;
  errorMessage = null;
  commit(result.color.value);
}

function updateChannel(channel: keyof Omit<OklchColor, "value">, event: Event): void {
  const target = event.currentTarget;
  if (!(target instanceof HTMLInputElement)) return;
  applyColor({ ...draftColor, [channel]: Number(target.value) });
}

function updateNumericChannel(channel: keyof Omit<OklchColor, "value">, event: Event): void {
  const target = event.currentTarget;
  if (!(target instanceof HTMLInputElement) || target.value === "" || !target.validity.valid) return;
  applyColor({ ...draftColor, [channel]: Number(target.value) });
}

function applyColor(nextColor: Omit<OklchColor, "value">): void {
  draftColor = nextColor;
  const nextValue = formatOklchColor(nextColor);
  draftValue = nextValue;
  errorMessage = null;
  commit(nextValue);
}

function selectPreset(preset: Omit<OklchColor, "value">): void {
  applyColor(preset);
}

function resetToInitialValue(): void {
  applyColor(initialColor);
}

async function copyValue(): Promise<void> {
  if (submittedValue === "") return;
  try {
    await navigator.clipboard.writeText(submittedValue);
    isCopied = true;
    if (copyStatusResetTimer !== undefined) clearTimeout(copyStatusResetTimer);
    copyStatusResetTimer = setTimeout(() => {
      isCopied = false;
    }, 1_500);
  } catch {
    isCopied = false;
  }
}

function commit(nextValue: string): void {
  if (value === nextValue) return;
  value = nextValue;
  onchange?.(nextValue);
}

function readColor(source: string): Omit<OklchColor, "value"> | undefined {
  const result = parseOklchColor(source);
  return result.ok ? result.color : undefined;
}

function readError(source: string): string | null {
  const result = parseOklchColor(source);
  return result.ok ? null : result.error;
}

function readSubmittedValue(source: string): string {
  const result = parseOklchColor(source);
  return result.ok ? result.color.value : "";
}

function createHueGradient(): string {
  const colorStops = Array.from({ length: 7 }, (_, index) => {
    const hue = index * 60;
    return formatOklchColor({ lightness: huePaletteLightness, chroma: huePaletteChroma, hue });
  });
  return `linear-gradient(to right, ${colorStops.join(", ")})`;
}

function createChromaGradient(lightness: number, hue: number): string {
  return `linear-gradient(to right, ${formatOklchColor({ lightness, chroma: 0, hue })}, ${formatOklchColor({ lightness, chroma: 0.4, hue })})`;
}

function isSameColor(left: Omit<OklchColor, "value">, right: Omit<OklchColor, "value">): boolean {
  return left.lightness === right.lightness && left.chroma === right.chroma && left.hue === right.hue;
}
</script>

<div class={cn("inline-flex", className)} data-slot="oklch-color-picker">
  {#if name !== undefined}<input type="hidden" {name} value={draftValue} />{/if}
  <TooltipProvider>
    <Popover>
      <PopoverTrigger>
        {#snippet child({ props })}
          <Button {...props} size="icon" class="cursor-pointer rounded-full border-2 border-background p-0 shadow-sm" style={`background-color: ${previewColor};`} aria-label={`テーマカラーを編集: ${value}`} {disabled} />
        {/snippet}
      </PopoverTrigger>
      <PopoverContent align="start" class="w-80 p-4" onOpenAutoFocus={(event) => event.preventDefault()}>
      <div class="grid gap-4">
        <div class="flex items-center gap-3">
          <div class="size-14 shrink-0 rounded-xl border border-black/10 shadow-sm" style:background-color={previewColor} aria-label="選択中の色" role="img"></div>
          <div class="min-w-0"><div class="flex items-center gap-1"><input id={inputId} class="oklch-inline-value min-w-0 flex-1 truncate p-0 font-mono text-xs text-muted-foreground placeholder:text-muted-foreground aria-invalid:text-destructive disabled:cursor-not-allowed disabled:opacity-50" aria-label="OKLCH値" placeholder="oklch(62% 0.14 250)" value={draftValue} aria-describedby={describedBy} aria-invalid={errorMessage === null ? undefined : true} {disabled} {required} oninput={(event) => updateDraftValue(event.currentTarget.value)} /><Tooltip><TooltipTrigger>{#snippet child({ props })}<Button {...props} type="button" size="icon" variant="ghost" class="size-5 shrink-0 cursor-pointer rounded-sm" aria-label={isCopied ? "OKLCH値をコピーしました" : "OKLCH値をコピー"} disabled={disabled || submittedValue === ""} onclick={copyValue}>{#if isCopied}<CheckIcon class="size-3" />{:else}<CopyIcon class="size-3" />{/if}</Button>{/snippet}</TooltipTrigger><TooltipContent>{isCopied ? "コピーしました" : "コピー"}</TooltipContent></Tooltip><Tooltip><TooltipTrigger>{#snippet child({ props })}<Button {...props} type="button" size="icon" variant="ghost" class="size-5 shrink-0 cursor-pointer rounded-sm" aria-label="初期値に戻す" disabled={disabled || isSameColor(draftColor, initialColor)} onclick={resetToInitialValue}><RotateCcwIcon class="size-3" /></Button>{/snippet}</TooltipTrigger><TooltipContent>初期値に戻す</TooltipContent></Tooltip></div></div>
        </div>
        <div class="grid gap-2">
          <div class="flex flex-wrap gap-2" role="group" aria-label="テーマカラープリセット">
            {#each presetColors as preset}
              <Tooltip><TooltipTrigger>{#snippet child({ props })}<Button {...props} type="button" size="icon" variant="outline" class={cn("size-7 cursor-pointer rounded-full border-2 p-0 shadow-sm", isSameColor(draftColor, preset) && "border-foreground")} style={`background-color: ${formatOklchColor(preset)};`} aria-label={`プリセット: ${preset.label}`} aria-pressed={isSameColor(draftColor, preset)} {disabled} onclick={() => selectPreset(preset)}></Button>{/snippet}</TooltipTrigger><TooltipContent>{preset.label}</TooltipContent></Tooltip>
            {/each}
          </div>
        </div>
        <div class="grid gap-2">
          <div class="grid gap-1 text-sm"><div class="flex justify-between"><label for={`${inputId}-lightness`}>明度</label><input id={`${inputId}-lightness-value`} class="oklch-channel-value w-12" aria-label="明度の数値" type="number" min="0" max="100" step="1" value={draftColor.lightness} {disabled} oninput={(event) => updateNumericChannel("lightness", event)} onchange={(event) => updateNumericChannel("lightness", event)} /></div><input id={`${inputId}-lightness`} class="oklch-lightness-slider" aria-label="明度" type="range" min="0" max="100" step="1" value={draftColor.lightness} style={`--oklch-lightness-thumb-color: ${lightnessThumbColor}; --oklch-lightness-thumb-border-color: ${lightnessThumbBorderColor};`} {disabled} oninput={(event) => updateChannel("lightness", event)} onchange={(event) => updateChannel("lightness", event)} /></div>
          <div class="grid gap-1 text-sm"><div class="flex justify-between"><label for={`${inputId}-chroma`}>彩度</label><input id={`${inputId}-chroma-value`} class="oklch-channel-value w-12" aria-label="彩度の数値" type="number" min="0" max="0.4" step="0.01" value={draftColor.chroma} {disabled} oninput={(event) => updateNumericChannel("chroma", event)} onchange={(event) => updateNumericChannel("chroma", event)} /></div><input id={`${inputId}-chroma`} class="oklch-chroma-slider" aria-label="彩度" type="range" min="0" max="0.4" step="0.01" value={draftColor.chroma} style={`--oklch-chroma-gradient: ${chromaGradient}; --oklch-chroma-thumb-color: ${previewColor}; --oklch-chroma-thumb-border-color: ${chromaThumbBorderColor};`} {disabled} oninput={(event) => updateChannel("chroma", event)} onchange={(event) => updateChannel("chroma", event)} /></div>
          <div class="grid gap-1 text-sm"><div class="flex justify-between"><label for={`${inputId}-hue`}>色相</label><input id={`${inputId}-hue-value`} class="oklch-channel-value w-12" aria-label="色相の数値" type="number" min="0" max="360" step="1" value={draftColor.hue} {disabled} oninput={(event) => updateNumericChannel("hue", event)} onchange={(event) => updateNumericChannel("hue", event)} /></div><input id={`${inputId}-hue`} class="oklch-hue-slider" aria-label="色相" type="range" min="0" max="360" step="1" value={draftColor.hue} style={`--oklch-hue-gradient: ${hueGradient}; --oklch-hue-thumb-color: ${hueThumbColor}; --oklch-hue-thumb-border-color: ${hueThumbBorderColor};`} {disabled} oninput={(event) => updateChannel("hue", event)} onchange={(event) => updateChannel("hue", event)} /></div>
        </div>
        {#if errorMessage !== null}<p id={errorId} class="text-sm text-destructive" role="alert">{errorMessage}</p>{/if}
      </div>
      </PopoverContent>
    </Popover>
  </TooltipProvider>
</div>

<style>
  .oklch-inline-value {
    appearance: none;
    border: 0;
    border-radius: 0.125rem;
    background: transparent;
    outline: none;
    padding-inline: 0.25rem;
  }

  .oklch-inline-value:focus-visible {
    background: var(--muted);
    box-shadow: 0 0 0 2px color-mix(in oklch, var(--ring) 50%, transparent);
  }

  .oklch-channel-value {
    appearance: textfield;
    border: 0;
    border-radius: 0.125rem;
    background: transparent;
    padding-inline: 0.25rem;
    text-align: right;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--muted-foreground);
    outline: none;
  }

  .oklch-channel-value::-webkit-inner-spin-button,
  .oklch-channel-value::-webkit-outer-spin-button {
    appearance: none;
  }

  .oklch-channel-value:focus-visible {
    background: var(--muted);
    box-shadow: 0 0 0 2px color-mix(in oklch, var(--ring) 50%, transparent);
  }

  .oklch-lightness-slider {
    appearance: none;
    background: transparent;
    cursor: pointer;
  }

  .oklch-lightness-slider::-webkit-slider-runnable-track {
    height: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 9999px;
    background: linear-gradient(to right, #000, #fff);
  }

  .oklch-lightness-slider::-moz-range-track {
    height: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 9999px;
    background: linear-gradient(to right, #000, #fff);
  }

  .oklch-lightness-slider::-webkit-slider-thumb {
    width: 1.25rem;
    height: 1.25rem;
    margin-top: -0.4375rem;
    appearance: none;
    border: 2px solid var(--oklch-lightness-thumb-border-color);
    border-radius: 9999px;
    background: var(--oklch-lightness-thumb-color);
    box-shadow: 0 1px 2px rgb(0 0 0 / 20%);
  }

  .oklch-lightness-slider::-moz-range-thumb {
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid var(--oklch-lightness-thumb-border-color);
    border-radius: 9999px;
    background: var(--oklch-lightness-thumb-color);
    box-shadow: 0 1px 2px rgb(0 0 0 / 20%);
  }

  .oklch-chroma-slider {
    appearance: none;
    background: transparent;
    cursor: pointer;
  }

  .oklch-chroma-slider::-webkit-slider-runnable-track {
    height: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 9999px;
    background: var(--oklch-chroma-gradient);
  }

  .oklch-chroma-slider::-moz-range-track {
    height: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 9999px;
    background: var(--oklch-chroma-gradient);
  }

  .oklch-chroma-slider::-webkit-slider-thumb {
    width: 1.25rem;
    height: 1.25rem;
    margin-top: -0.4375rem;
    appearance: none;
    border: 2px solid var(--oklch-chroma-thumb-border-color);
    border-radius: 9999px;
    background: var(--oklch-chroma-thumb-color);
    box-shadow: 0 1px 2px rgb(0 0 0 / 20%);
  }

  .oklch-chroma-slider::-moz-range-thumb {
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid var(--oklch-chroma-thumb-border-color);
    border-radius: 9999px;
    background: var(--oklch-chroma-thumb-color);
    box-shadow: 0 1px 2px rgb(0 0 0 / 20%);
  }

  .oklch-hue-slider {
    appearance: none;
    background: transparent;
    cursor: pointer;
  }

  .oklch-hue-slider::-webkit-slider-runnable-track {
    height: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 9999px;
    background: var(--oklch-hue-gradient);
  }

  .oklch-hue-slider::-moz-range-track {
    height: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 9999px;
    background: var(--oklch-hue-gradient);
  }

  .oklch-hue-slider::-webkit-slider-thumb {
    width: 1.25rem;
    height: 1.25rem;
    margin-top: -0.4375rem;
    appearance: none;
    border: 2px solid var(--oklch-hue-thumb-border-color);
    border-radius: 9999px;
    background: var(--oklch-hue-thumb-color);
    box-shadow: 0 1px 2px rgb(0 0 0 / 20%);
  }

  .oklch-hue-slider::-moz-range-thumb {
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid var(--oklch-hue-thumb-border-color);
    border-radius: 9999px;
    background: var(--oklch-hue-thumb-color);
    box-shadow: 0 1px 2px rgb(0 0 0 / 20%);
  }
</style>
