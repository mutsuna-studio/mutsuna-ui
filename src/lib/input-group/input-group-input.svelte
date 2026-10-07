<script lang="ts">
import { getGroupLabel } from "../internal/input-group-label.js";
import { cn } from "../utils.js";
import type { ComponentProps } from "svelte";
import { Input } from "@mutsuna/ui/input";

let { ref = $bindable(null), value = $bindable(), class: className, id, ...props }: ComponentProps<typeof Input> = $props();
const groupLabel = getGroupLabel();
</script>

<Input
    id={id ?? groupLabel?.controlId}
	bind:ref
	data-slot="input-group-control"
	class={cn("rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent flex-1", className)}
	bind:value
	{...props}
/>
