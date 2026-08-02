<script lang="ts" module>
export type CustomerAvatarProps = {
  readonly id: string;
  readonly name: string;
  readonly imageUrl?: string | null;
  readonly size?: "default" | "sm" | "lg";
  readonly class?: string;
};
</script>

<script lang="ts">
import { cn } from "../utils.js";
import Root from "./avatar.svelte";
import Fallback from "./avatar-fallback.svelte";
import Image from "./avatar-image.svelte";

let { id, name, imageUrl = null, size = "default", class: className }: CustomerAvatarProps = $props();

function avatarGradientStyle(seed: string): string {
  const hash = hashString(seed);
  const hue = hash % 360;
  const accentHue = (hue + 72 + ((hash >>> 8) % 96)) % 360;
  const saturation = 48 + ((hash >>> 16) % 44);
  const accentSaturation = Math.max(24, saturation - 18 + ((hash >>> 24) % 28));
  const lightness = 40 + ((hash >>> 4) % 20);
  const accentLightness = 34 + ((hash >>> 12) % 22);
  return `background: linear-gradient(135deg, hsl(${hue} ${saturation}% ${lightness}%), hsl(${accentHue} ${accentSaturation}% ${accentLightness}%));`;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
</script>

<Root {size} class={cn(className)} aria-label={name}>
  {#if imageUrl !== null}
    <Image src={imageUrl} alt={name} />
  {/if}
  <Fallback style={avatarGradientStyle(id)} aria-hidden="true" />
</Root>
