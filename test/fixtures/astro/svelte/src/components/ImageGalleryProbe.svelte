<script lang="ts">
import { ImagePreview, type ImagePreviewImage } from "@mutsuna/ui/image-preview";
const src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200"%3E%3Crect width="1600" height="1200" fill="seagreen"/%3E%3C/svg%3E';
const images: ImagePreviewImage[] = [{ src, alt: 'Gallery A', downloadUrl: src, downloadName: 'A.svg' }, { src, alt: 'Gallery B' }, { src: 'data:image/png;base64,broken', alt: 'Gallery C' }];
</script>
<div style="max-width:320px"><ImagePreview {src} alt="Gallery thumbnail" {images} initialIndex={1} /></div>
