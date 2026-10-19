<script module lang="ts">
import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { WithElementRef } from "../utils.js";
export type ImagePreviewImage = {
  src: string;
  alt: string;
  title?: string;
  description?: string;
  downloadUrl?: string;
  downloadName?: string;
  onDownload?: () => void;
  downloading?: boolean;
  error?: string;
};
export type ImagePreviewProps = WithElementRef<Omit<HTMLAttributes<HTMLDivElement>, "children" | "title">> & {
  src: string;
  alt: string;
  title?: string;
  description?: string;
  /** Optional gallery for the modal; src/alt still identify the thumbnail. */
  images?: readonly ImagePreviewImage[];
  initialIndex?: number;
  open?: boolean;
  disabled?: boolean;
  downloadUrl?: string;
  downloadName?: string;
  /** Consumer-owned authenticated download; takes precedence over downloadUrl. */
  onDownload?: () => void;
  downloading?: boolean;
  error?: string;
  /** Optional trigger; spread props onto one native button. */
  trigger?: Snippet<[{ props: HTMLButtonAttributes }]>;
};
</script>

<script lang="ts">
import { tick, untrack } from "svelte";
import { Download, X, ImageOff, ChevronLeft, ChevronRight } from "@lucide/svelte";
import { Button } from "../button/index.js";
import * as Dialog from "../dialog/index.js";
import { imagePreviewGestures } from "./image-preview-gestures.js";
import { cn } from "../utils.js";
let { ref = $bindable(null), src, alt, title, description, open = $bindable(false), disabled = false,
  downloadUrl, downloadName, onDownload, downloading = false, error, images = [], initialIndex = 0, trigger, class: className, ...restProps }: ImagePreviewProps = $props();
const triggerLabel = $derived(title || alt || "画像プレビュー");
let pageIndex = $state(untrack(() => initialIndex));
const currentIndex = $derived(Number.isFinite(pageIndex) ? Math.max(0, Math.min(Math.max(0, images.length - 1), Math.trunc(pageIndex))) : 0);
const active = $derived<ImagePreviewImage>(images.length ? images[currentIndex] : { src, alt, title, description, downloadUrl, downloadName, onDownload, downloading, error });
const label = $derived(active.title || active.alt || "画像プレビュー");
let wasOpen = false;
$effect(() => {
  if (open && !wasOpen) pageIndex = Number.isFinite(initialIndex) ? Math.max(0, Math.min(images.length - 1, Math.trunc(initialIndex))) : 0;
  wasOpen = open;
});
async function navigate(direction: -1 | 1) {
  if (disabled || images.length < 2) return;
  const next = Math.max(0, Math.min(images.length - 1, currentIndex + direction));
  if (next === currentIndex) return;
  const previous = document.activeElement;
  pageIndex = next;
  await tick();
  if (previous instanceof HTMLButtonElement && previous.disabled && (document.activeElement === previous || document.activeElement === document.body)) viewer?.querySelector<HTMLElement>(".viewer-body")?.focus({ preventScroll: true });
}
function galleryKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || viewer?.querySelector<HTMLElement>(".viewer-body")?.dataset.zoomed === "true") return;
  if (images.length > 1 && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
    event.preventDefault(); void navigate(event.key === "ArrowLeft" ? -1 : 1);
  }
}
let failedThumbnail = $state<string>();
let failedImage = $state<string>();
let viewer = $state<HTMLDivElement | null>(null);
let imageRatio = $state(4 / 3);
let preferredHeight = $state(600);
function imageLoaded(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  if (image.naturalHeight > 0) imageRatio = image.naturalWidth / image.naturalHeight;
}
$effect(() => {
  const element = viewer;
  const ratio = imageRatio;
  if (!element) return;
  const update = () => {
    const style = getComputedStyle(element);
    const horizontal = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const vertical = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const heading = element.querySelector<HTMLElement>(".viewer-heading")?.offsetHeight ?? 0;
    const footer = element.querySelector<HTMLElement>(".viewer-footer")?.offsetHeight ?? 0;
    preferredHeight = Math.ceil((element.clientWidth - horizontal) / ratio + vertical + heading + footer + 12);
  };
  update();
  const observer = new ResizeObserver(update);
  observer.observe(element);
  for (const part of element.querySelectorAll<HTMLElement>(".viewer-heading, .viewer-footer")) observer.observe(part);
  return () => observer.disconnect();
});
</script>

<div bind:this={ref} {...restProps} data-slot="image-preview" class={cn("image-preview", className)}>
  <Dialog.Root bind:open>
    <Dialog.Trigger>
      {#snippet child({ props })}
        {#if trigger}
          {@render trigger({ props: { ...props, type: "button", disabled, "aria-label": `${triggerLabel}を拡大表示` } })}
        {:else}
          <button {...props} type="button" class="image-trigger" aria-label={`${triggerLabel}を拡大表示`} disabled={disabled || failedThumbnail === src}>
            {#if failedThumbnail === src}<span class="image-fallback"><ImageOff aria-hidden="true" size={24} />プレビューを表示できません</span>
            {:else}<img {src} {alt} onerror={() => failedThumbnail = src} />{/if}
          </button>
        {/if}
      {/snippet}
    </Dialog.Trigger>
    <Dialog.Content onkeydown={galleryKeydown} bind:ref={viewer} style={`height: min(48rem, calc(100dvh - 2rem), ${preferredHeight}px)`} showCloseButton={false} class="image-viewer w-[min(56rem,calc(100vw-1rem))] md:min-w-0 md:w-[min(56rem,calc(100vw-2rem))]">
      <div class="viewer-heading">
        <div class="viewer-info"><Dialog.Title class="truncate pr-2" title={label}>{label}</Dialog.Title><Dialog.Description class={active.description ? "viewer-description" : "sr-only"}>{active.description || "画像の拡大プレビュー"}</Dialog.Description></div>
        <Dialog.Close>{#snippet child({ props })}<Button {...props} variant="ghost" size="icon-sm" icon={X} class="viewer-action" aria-label="画像を閉じる" />{/snippet}</Dialog.Close>
      </div>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (The image viewport supports keyboard zoom and panning.) -->
      <div class="viewer-body" role="region" aria-label="画像" tabindex="0" use:imagePreviewGestures={{ src: active.src, open, page: currentIndex, onNavigate: images.length > 1 && !disabled ? navigate : undefined }}>
        {#if failedImage === active.src}<p role="alert" class="viewer-error">画像を表示できません。</p>
        {:else}<img class="viewer-image" draggable="false" src={active.src} alt={active.alt} onload={imageLoaded} onerror={() => failedImage = active.src} />{/if}
      </div>
      {#if images.length > 1 || active.onDownload || active.downloadUrl || active.error}
        <div class="viewer-footer">
          {#if images.length > 1}
            <div class="viewer-pages" role="group" aria-label="画像の切り替え">
              <Button variant="ghost" size="icon-sm" icon={ChevronLeft} class="viewer-action" aria-label="前の画像" disabled={disabled || currentIndex === 0} onclick={() => navigate(-1)} />
              <span class="page-count" role="status">{currentIndex + 1} / {images.length}</span>
              <Button variant="ghost" size="icon-sm" icon={ChevronRight} class="viewer-action" aria-label="次の画像" disabled={disabled || currentIndex === images.length - 1} onclick={() => navigate(1)} />
            </div>
          {/if}
          {#if active.error}<p class="viewer-error" role="alert" title={active.error}>{active.error}</p>{/if}
          {#if active.onDownload}<Button variant="ghost" size="icon-sm" icon={Download} class="viewer-action" aria-label={`${label}をダウンロード`} loading={active.downloading} {disabled} onclick={active.onDownload} />
          {:else if active.downloadUrl}<Button href={active.downloadUrl} download={active.downloadName ?? ""} variant="ghost" size="icon-sm" icon={Download} class="viewer-action" aria-label={`${label}をダウンロード`} loading={active.downloading} {disabled} />{/if}
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Root>
</div>

<style>
.image-preview { min-width: 0; max-width: 100%; }
.image-trigger { display: block; width: 100%; padding: 0; border: 0; border-radius: 8px; background: var(--muted); cursor: zoom-in; }
.image-trigger:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
.image-trigger:disabled { cursor: default; opacity: .65; }
.image-trigger img { display: block; width: 100%; max-height: 240px; object-fit: contain; border-radius: inherit; }
.image-fallback { display: grid; justify-items: center; gap: 8px; padding: 24px; font-size: 12px; color: var(--muted-foreground); }
:global([data-slot="dialog-content"].image-viewer) { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr) auto; height: min(48rem, calc(100dvh - 2rem)); max-height: calc(100dvh - 2rem) !important; }
.viewer-heading { min-width: 0; display: flex; align-items: start; gap: 12px; flex-shrink: 0; }
.viewer-info { flex: 1; min-width: 0; overflow-wrap: anywhere; overflow: hidden; }
.viewer-heading :global(.viewer-action), .viewer-footer :global(.viewer-action) { width: 44px; height: 44px; flex-shrink: 0; }
.viewer-info :global(.viewer-description) { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; overflow: hidden; }
.viewer-body { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); place-items: center; min-width: 0; min-height: 0; overflow: hidden; margin-top: 12px; }
.viewer-body { touch-action: none; user-select: none; }
.viewer-body[data-zoomed="true"] { cursor: grab; }
.viewer-body[data-dragging="true"] { cursor: grabbing; }
.viewer-body:focus-visible { outline: 2px solid var(--ring); outline-offset: -2px; }
.viewer-image { display: block; width: 100%; height: 100%; min-width: 0; min-height: 0; object-fit: contain; }
.viewer-footer { min-width: 0; display: flex; align-items: center; justify-content: end; gap: 12px; padding-top: 8px; flex-shrink: 0; }
.viewer-pages { display: flex; align-items: center; gap: 4px; margin-inline-end: auto; flex-shrink: 0; }
.page-count { min-width: 44px; text-align: center; font-size: 12px; font-variant-numeric: tabular-nums; color: var(--muted-foreground); }
.viewer-error { min-width: 0; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; overflow: hidden; margin: 4px 0; font-size: 12px; color: var(--destructive); overflow-wrap: anywhere; }
</style>
