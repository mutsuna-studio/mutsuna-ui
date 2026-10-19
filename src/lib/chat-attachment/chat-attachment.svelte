<script module lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import type { ImagePreviewImage } from "../image-preview/index.js";
import type { WithElementRef } from "../utils.js";
export type ChatAttachmentProps = WithElementRef<Omit<HTMLAttributes<HTMLDivElement>, "children">> & {
  name: string;
  size?: number;
  mediaType?: string;
  previewUrl?: string;
  previewImages?: readonly ImagePreviewImage[];
  previewIndex?: number;
  downloadUrl?: string;
  /** Consumer handles authenticated downloads, errors and loading state. Takes precedence over downloadUrl. */
  onDownload?: () => void;
  downloading?: boolean;
  disabled?: boolean;
  error?: string;
};
</script>

<script lang="ts">
import { Download, FileText } from "@lucide/svelte";
import { Button } from "../button/index.js";
import { ImagePreview } from "../image-preview/index.js";
import { cn } from "../utils.js";
let { ref = $bindable(null), name, size, mediaType, previewUrl, downloadUrl, onDownload,
  downloading = false, disabled = false, error, previewImages, previewIndex = 0, class: className, ...restProps }: ChatAttachmentProps = $props();
let failedSource = $state<string | undefined>();
const imageAvailable = $derived(Boolean(previewUrl && previewUrl !== failedSource));
const sizeLabel = $derived(size === undefined ? "" : size >= 1_000_000 ? `${(size / 1_000_000).toFixed(1)} MB` : size === 0 ? "0 B" : `${Math.max(1, Math.round(size / 1000))} KB`);
const details = $derived([mediaType ?? (previewUrl ? "画像" : "ファイル"), sizeLabel].filter(Boolean).join(" · "));
</script>

{#snippet downloadAction()}
  {#if onDownload}
    <Button type="button" variant="ghost" size="icon-sm" icon={Download} class="download-action" aria-label={`${name}をダウンロード`} loading={downloading} {disabled} onclick={onDownload} />
  {:else}
    <Button href={downloadUrl} type="button" download={name} variant="ghost" size="icon-sm" icon={Download} class="download-action" aria-label={`${name}をダウンロード`} loading={downloading} disabled={disabled || !downloadUrl} />
  {/if}
{/snippet}

<div bind:this={ref} {...restProps} data-slot="chat-attachment" class={cn("chat-attachment", className)} data-image={imageAvailable} aria-busy={downloading}>
  {#if imageAvailable && previewUrl}
    <ImagePreview images={previewImages} initialIndex={previewIndex} src={previewUrl} alt={name} title={name} description={details} {downloadUrl} downloadName={name} {onDownload} {downloading} {disabled} {error}>
      {#snippet trigger({ props })}
        <button {...props} class="image-open"><img src={previewUrl} alt={name} onerror={() => failedSource = previewUrl} /></button>
      {/snippet}
    </ImagePreview>
  {/if}
  {#if !imageAvailable}
  <div class="file-row">
    {#if !imageAvailable}<FileText size={22} aria-hidden="true" />{/if}
    <div class="file-info"><p class="file-name" title={name}>{name}</p><p class="file-detail">{details}{#if previewUrl && !imageAvailable} · プレビューを表示できません{/if}</p></div>
    {@render downloadAction()}
  </div>
  {#if error}<p class="download-error" role="alert">{error}</p>{/if}
  {/if}
</div>

<style>
  .chat-attachment { width: min(100%, 320px); min-width: 0; padding: 6px; border: 1px solid var(--border); border-radius: 12px; background: var(--background); color: var(--foreground); white-space: normal; }
  .chat-attachment[data-image="true"] { width: min(100%, 280px); padding: 0; border: 0; background: transparent; }
  .file-row { display: flex; align-items: center; gap: 8px; min-width: 0; padding-inline-start: 6px; }
  .file-info { flex: 1; min-width: 0; }
  .file-name { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-weight: 500; }
  .file-detail { margin: 2px 0 0; font-size: 11px; color: var(--muted-foreground); overflow-wrap: anywhere; }
  .chat-attachment :global(.download-action) { width: 44px; height: 44px; flex-shrink: 0; }
  .image-open { display: block; width: 100%; padding: 0; border: 0; border-radius: 12px; background: var(--muted); cursor: zoom-in; }
  .image-open:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
  .image-open:disabled { cursor: default; opacity: .65; }
  .image-open img { display: block; width: 100%; height: auto; aspect-ratio: 3 / 2; max-height: 240px; object-fit: contain; border-radius: inherit; }
  .download-error { margin: 4px 6px; font-size: 12px; color: var(--destructive); overflow-wrap: anywhere; }
</style>
