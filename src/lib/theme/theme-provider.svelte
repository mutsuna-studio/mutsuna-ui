<script lang="ts">
import type { Snippet } from "svelte";
import { themeToCssVariables, type Theme } from "./theme.js";

let { theme = null, children }: { theme?: Theme | null; children?: Snippet } = $props();

const cssVariables = $derived(themeToCssVariables(theme));

$effect(() => {
  const root = document.documentElement;
  const previousVariables = cssVariables.map(([name]) => [name, root.style.getPropertyValue(name), root.style.getPropertyPriority(name)] as const);

  for (const [name, value] of cssVariables) {
    if (value === null) {
      root.style.removeProperty(name);
      continue;
    }
    root.style.setProperty(name, value);
  }

  return () => {
    for (const [name, value, priority] of previousVariables) {
      if (value.length === 0) {
        root.style.removeProperty(name);
        continue;
      }
      root.style.setProperty(name, value, priority);
    }
  };
});
</script>

<div
	class="contents"
	style:--primary={theme?.primary}
	style:--primary-foreground={theme?.primaryForeground}
	style:--sidebar-primary={theme?.sidebarPrimary}
	style:--sidebar-primary-foreground={theme?.sidebarPrimaryForeground}
	style:--ring={theme?.primary}
>
	{@render children?.()}
</div>
