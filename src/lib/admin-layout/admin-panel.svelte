<script lang="ts">
import type { Snippet } from "svelte";
import Card from "../card/card.svelte";
import CardAction from "../card/card-action.svelte";
import CardContent from "../card/card-content.svelte";
import CardDescription from "../card/card-description.svelte";
import CardFooter from "../card/card-footer.svelte";
import CardHeader from "../card/card-header.svelte";
import CardTitle from "../card/card-title.svelte";

interface Props {
  title: string;
  description?: string;
  children?: Snippet;
  action?: Snippet;
  footer?: Snippet;
  class?: string;
  contentClass?: string;
}

let { title, description, children, action, footer, class: className, contentClass }: Props = $props();
</script>

<Card class={className}>
  <CardHeader>
    <CardTitle>{title}</CardTitle>
    {#if description}<CardDescription>{description}</CardDescription>{/if}
    {#if action}<CardAction>{@render action()}</CardAction>{/if}
  </CardHeader>
  <CardContent class={contentClass}>{@render children?.()}</CardContent>
  {#if footer}<CardFooter>{@render footer()}</CardFooter>{/if}
</Card>
