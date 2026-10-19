<script lang="ts">
import { ImagePreview, type ImagePreviewImage } from "../image-preview/index.js";
import FileText from "@lucide/svelte/icons/file-text";
let { src, alt, images, initialIndex = 0 }: { src: string; alt: string; images?: readonly ImagePreviewImage[]; initialIndex?: number } = $props();
let failedSource = $state<string | null>(null);
</script>

{#if failedSource === src}
  <span class="fallback" role="img" aria-label={`${alt}（プレビューを表示できません）`}><FileText size={22} aria-hidden="true" /></span>
{:else}
  <ImagePreview {src} {alt} {images} {initialIndex} class="h-full w-full">
    {#snippet trigger({ props })}<button {...props} class="preview-trigger"><img {src} {alt} onerror={() => failedSource = src} /></button>{/snippet}
  </ImagePreview>
{/if}

<style>
  .preview-trigger { display: block; width: 100%; height: 100%; padding: 0; border: 0; background: transparent; cursor: zoom-in; }
  .preview-trigger:focus-visible { outline: 2px solid var(--ring); outline-offset: -2px; }
  img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .fallback { display: grid; place-items: center; width: 100%; height: 100%; color: var(--muted-foreground); }
</style>
