<script lang="ts">
import { ImagePreview } from "@mutsuna/ui/image-preview";
let portrait = $state(false);
const src = $derived(`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${portrait ? 1200 : 4000}" height="${portrait ? 4000 : 1200}"><rect width="100%" height="100%" fill="seagreen"/></svg>`)}`);
</script>
<button type="button" onclick={() => portrait = !portrait}>Switch image orientation</button>
<div style="max-width:320px"><ImagePreview {src} alt="Astro landscape" /></div>
