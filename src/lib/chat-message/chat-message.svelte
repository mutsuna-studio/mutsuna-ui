<script module lang="ts">
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BubbleVariant } from "../bubble/bubble.svelte";
import type { WithElementRef } from "../utils.js";

export type ChatMessageProps = WithElementRef<Omit<HTMLAttributes<HTMLElement>, "children">> & {
  /** Display name; independent of whether the sender is a person or an AI. */
  author: string;
  children: Snippet;
  /** Omit layout to retain the original align/variant presentation. */
  layout?: "bubble" | "timeline";
  /** Timeline keeps both sides left aligned; side still identifies the sender. */
  side?: "incoming" | "outgoing";
  /** Override the surface color without changing layout. */
  bubbleVariant?: BubbleVariant;
  /** Bubble defaults to incoming authors only; timeline shows both. */
  showAuthor?: boolean;
  /** Quote rendered above the message body. */
  quote?: Snippet;
  /** Reactions displayed below the surface, independently of actions. */
  reactions?: Snippet;
  /** Opt in to typography for semantic HTML supplied by the consumer; does not parse Markdown. */
  prose?: boolean;
  /** Persistent controls below the body, e.g. copy or retry after a long response. */
  footerActions?: Snippet;
  align?: "start" | "end";
  variant?: "bubble" | "plain";
  avatar?: Snippet;
  /** Timestamp, delivery state, or other consumer-owned information. */
  metadata?: Snippet;
  /** Named buttons/links, rendered in the normal keyboard order. */
  actions?: Snippet;
};
</script>

<script lang="ts">
import { cn } from "../utils.js";
import * as Message from "../message/index.js";
import * as Bubble from "../bubble/index.js";
let {
  ref = $bindable(null), author, children, align = "start", variant = "bubble",
  layout, side, bubbleVariant, showAuthor, quote, reactions, prose = false, footerActions, avatar, metadata, actions, class: className, ...restProps
}: ChatMessageProps = $props();
const senderSide = $derived(side ?? (align === "end" ? "outgoing" : "incoming"));
const messageAlign = $derived(layout ? (layout === "bubble" && senderSide === "outgoing" ? "end" : "start") : align);
const authorVisible = $derived(showAuthor ?? (layout === "timeline" || senderSide === "incoming"));
const surface = $derived(bubbleVariant ?? (layout === "timeline" ? "ghost" : senderSide === "outgoing" ? "default" : "outline"));
</script>

<article bind:this={ref} aria-label={author} {...restProps} data-slot="chat-message" data-align={messageAlign} data-variant={variant} data-layout={layout} data-side={senderSide} class={cn("w-full min-w-0 text-sm", layout && "chat-layout", className)}>
  {#if layout}
  <Message.Root align={messageAlign} class="chat-layout-row">
    {#if layout === "timeline" && avatar}<Message.Avatar data-slot="chat-message-avatar" class="chat-layout-avatar">{@render avatar()}</Message.Avatar>{/if}
    <div class="layout-body">
      {#if authorVisible}
        <div data-slot="chat-message-header" class="layout-header">
          {#if layout === "bubble" && avatar}<span data-slot="chat-message-avatar" class="header-avatar">{@render avatar()}</span>{/if}
          <span class="author">{author}</span>
          {#if layout === "timeline" && metadata}<div data-slot="chat-message-metadata" class="timeline-metadata">{@render metadata()}</div>{/if}
        </div>
      {:else if layout === "timeline" && metadata}
        <div data-slot="chat-message-metadata" class="timeline-metadata">{@render metadata()}</div>
      {/if}
      <div class="layout-cluster">
        <div class="layout-surface">
          <Bubble.Root variant={surface} class="chat-layout-bubble">
            {#if quote}{@render quote()}{/if}
            <Bubble.Content class="chat-layout-text"><div data-slot="chat-message-content" data-prose={prose || undefined}>{@render children()}</div></Bubble.Content>
          </Bubble.Root>
          {#if layout === "bubble" && metadata}<div data-slot="chat-message-metadata" class="delivery-metadata">{@render metadata()}</div>{/if}
        </div>
        {#if reactions || actions || footerActions}<Message.Footer class="chat-layout-footer">
          {#if reactions}<div data-slot="chat-message-reactions" class="layout-reactions">{@render reactions()}</div>{/if}
          {#if actions}<div data-slot="chat-message-actions" class="layout-actions">{@render actions()}</div>{/if}
          {#if footerActions}<div data-slot="chat-message-footer-actions" class="footer-actions">{@render footerActions()}</div>{/if}
        </Message.Footer>{/if}
      </div>
    </div>
  </Message.Root>
  {:else}
  <Message.Root {align}>
    {#if avatar}<Message.Avatar data-slot="chat-message-avatar" class="self-start translate-y-0 bg-transparent">{@render avatar()}</Message.Avatar>{/if}
    <Message.Content class="max-w-[85%] gap-2 sm:max-w-2xl">
      <Message.Header data-slot="chat-message-header" class="flex-wrap gap-x-2 gap-y-1 px-0">
        <span class="break-words font-medium text-foreground [overflow-wrap:anywhere]">{author}</span>
        {#if metadata}<div data-slot="chat-message-metadata" class="min-w-0 text-xs [overflow-wrap:anywhere]">{@render metadata()}</div>{/if}
      </Message.Header>
      <Bubble.Root variant={variant === "plain" ? "ghost" : "muted"} class="max-w-full">
        <Bubble.Content data-slot="chat-message-content" data-prose={prose || undefined} class="whitespace-pre-wrap [overflow-wrap:anywhere] [&_img]:max-w-full [&_pre]:max-w-full [&_pre]:overflow-x-auto">{@render children()}</Bubble.Content>
      </Bubble.Root>
      {#if actions}<Message.Footer data-slot="chat-message-actions" class="flex-wrap gap-1 px-0">{@render actions()}</Message.Footer>{/if}
      {#if footerActions}<Message.Footer data-slot="chat-message-footer-actions" class="flex-wrap gap-2 px-0">{@render footerActions()}</Message.Footer>{/if}
    </Message.Content>
  </Message.Root>
  {/if}
</article>


<style>
  [data-layout="timeline"] { container: chat-timeline / inline-size; }
  .layout-body { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; width: 100%; min-width: 0; }
  [data-layout="bubble"] .layout-body { width: fit-content; max-width: min(calc(100% - 48px), 34rem); }
  [data-layout="bubble"][data-side="outgoing"] .layout-body { align-items: flex-end; }
  .layout-header { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; min-height: 24px; max-width: 100%; overflow-wrap: anywhere; }
  .author { min-width: 0; font-weight: 650; font-size: 13px; }
  [data-layout="bubble"] .author { font-size: 11px; font-weight: 400; color: var(--muted-foreground); }
  .header-avatar { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; flex-shrink: 0; }
  .header-avatar :global([data-slot="avatar"]) { width: 20px; height: 20px; font-size: 10px; }
  .chat-layout :global(.chat-layout-avatar) { align-self: flex-start; transform: none; translate: none; background: transparent; }
  .timeline-metadata { min-width: 0; font-size: 10px; color: var(--muted-foreground); overflow-wrap: anywhere; }
  .layout-cluster { position: relative; display: flex; flex-direction: column; gap: 4px; width: 100%; min-width: 0; }
  .layout-surface { position: relative; width: 100%; min-width: 0; }
  .chat-layout :global(.chat-layout-bubble) { max-width: 100%; }
  .chat-layout :global(.chat-layout-text) { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 13px; line-height: 1.7; }
  .chat-layout :global(.chat-layout-text img), .chat-layout :global(.chat-layout-text pre) { max-width: 100%; }
  .chat-layout :global(.chat-layout-text pre) { overflow-x: auto; }
  [data-layout="bubble"] :global(.chat-layout-bubble) { width: 100%; }
  [data-layout="bubble"] :global(.chat-layout-text) { width: 100%; padding: 10px 13px; border-radius: 16px; }
  .delivery-metadata { position: absolute; inset-block-end: 0; inset-inline-start: calc(100% + 8px); display: flex; flex-direction: column; align-items: flex-start; gap: 2px; inline-size: 40px; color: var(--muted-foreground); font-size: 10px; line-height: 1.3; overflow-wrap: anywhere; }
  [data-side="outgoing"] .delivery-metadata { inset-inline-start: auto; inset-inline-end: calc(100% + 8px); align-items: flex-end; text-align: end; }
  .chat-layout :global(.chat-layout-footer) { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; width: 100%; min-height: 0; padding: 0; column-gap: 8px; font-size: 11px; font-weight: 400; }
  .layout-reactions { grid-column: 1; min-width: 0; }
  .layout-actions { grid-column: 2; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .footer-actions { grid-column: 1 / -1; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; min-width: 0; }
  .chat-layout :global(.chat-layout-footer:has([data-slot="chat-message-footer-actions"])) { row-gap: 8px; }
  [data-slot="chat-message"] :global([data-prose="true"]) { display: flow-root; min-width: 0; max-width: 72ch; white-space: normal; line-height: 1.8; }
  .chat-layout :global(.chat-layout-text:has(> [data-prose="true"])) { width: 100%; }
  [data-slot="chat-message"] :global([data-prose="true"] :where(p, ul, ol, blockquote, pre, figure)) { margin: 0; }
  [data-slot="chat-message"] :global([data-prose="true"] > * + *) { margin-block-start: 1em; }
  [data-slot="chat-message"] :global([data-prose="true"] :where(h1, h2, h3, h4, h5, h6)) { margin-block: 1.8em .6em; font-weight: 650; line-height: 1.5; text-wrap: pretty; }
  [data-slot="chat-message"] :global([data-prose="true"] > :first-child) { margin-block-start: 0; }
  [data-slot="chat-message"] :global([data-prose="true"] h1) { font-size: 1.5em; }
  [data-slot="chat-message"] :global([data-prose="true"] h2) { font-size: 1.25em; }
  [data-slot="chat-message"] :global([data-prose="true"] :where(h3, h4, h5, h6)) { font-size: 1.1em; }
  [data-slot="chat-message"] :global([data-prose="true"] :where(ul, ol)) { padding-inline-start: 1.6em; }
  [data-slot="chat-message"] :global([data-prose="true"] ul) { list-style: disc; }
  [data-slot="chat-message"] :global([data-prose="true"] ol) { list-style: decimal; }
  [data-slot="chat-message"] :global([data-prose="true"] li + li) { margin-block-start: .4em; }
  [data-slot="chat-message"] :global([data-prose="true"] li > :where(p, ul, ol) + *) { margin-block-start: .5em; }
  [data-slot="chat-message"] :global([data-prose="true"] blockquote) { border-inline-start: 3px solid var(--border); padding-inline-start: 1em; color: var(--muted-foreground); }
  [data-slot="chat-message"] :global([data-prose="true"] a) { color: var(--primary); text-decoration: underline; text-underline-offset: 3px; }
  [data-slot="chat-message"] :global([data-prose="true"] :not(pre) > code) { padding: .15em .35em; border-radius: 4px; background: var(--muted); font-size: .9em; }
  [data-slot="chat-message"] :global([data-prose="true"] pre) { max-width: 100%; overflow-x: auto; padding: 14px 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--muted); font-size: .9em; line-height: 1.7; white-space: pre; overflow-wrap: normal; overscroll-behavior-inline: contain; }
  [data-slot="chat-message"] :global([data-prose="true"] pre code) { padding: 0; background: transparent; font-size: inherit; }
  [data-slot="chat-message"] :global([data-prose="true"] [data-slot="chat-message-scroll"]) { max-width: 100%; overflow-x: auto; border: 1px solid var(--border); border-radius: 8px; overscroll-behavior-inline: contain; }
  [data-slot="chat-message"] :global([data-prose="true"] table) { width: 100%; border-collapse: collapse; font-size: .9em; text-align: start; }
  [data-slot="chat-message"] :global([data-prose="true"] caption) { padding: 10px 12px; text-align: start; font-weight: 600; }
  [data-slot="chat-message"] :global([data-prose="true"] :where(th, td)) { padding: 10px 12px; border-block-start: 1px solid var(--border); vertical-align: top; }
  [data-slot="chat-message"] :global([data-prose="true"] th) { background: var(--muted); font-weight: 600; }
  [data-slot="chat-message"] :global([data-prose="true"] :where(pre, [data-slot="chat-message-scroll"]):focus-visible) { outline: 2px solid var(--ring); outline-offset: -2px; }
  [data-layout="timeline"] .layout-body { position: relative; gap: 6px; }
  [data-layout="timeline"] :global(.chat-layout-row) { gap: 12px; }
  [data-layout="timeline"] .layout-header { min-height: 32px; gap: 8px; }
  [data-layout="timeline"] .author { font-size: 14px; font-weight: 600; line-height: 1.5; }
  [data-layout="timeline"] .timeline-metadata { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: 11px; line-height: 1.5; }
  [data-layout="timeline"] .layout-cluster { gap: 8px; }
  [data-layout="timeline"] :global(.chat-layout-bubble) { gap: 8px; }
  [data-layout="timeline"] :global(.chat-layout-text) { font-size: 14px; line-height: 1.75; }
  [data-layout="timeline"] :global(.chat-layout-bubble[data-variant="ghost"] > .chat-layout-text) { border-width: 0; }
  [data-layout="timeline"] :global(.chat-layout-avatar),
  [data-layout="timeline"] :global(.chat-layout-avatar [data-slot="avatar"]) { width: 32px; height: 32px; }
  .chat-layout[data-layout="timeline"] :global([data-slot="message-actions"] .copy-feedback) { inset-inline-start: auto; inset-inline-end: 0; }
  @media (min-width: 768px) and (hover: hover) and (pointer: fine) {
    [data-layout="bubble"] :global(.chat-layout-row) { isolation: isolate; }
    [data-layout="timeline"] .layout-cluster { position: static; }
    [data-layout="timeline"] .layout-body:has(:global([data-slot="message-actions"])) > .layout-header,
    [data-layout="timeline"] .layout-body:has(:global([data-slot="message-actions"])) > .timeline-metadata { padding-inline-end: 152px; }
    [data-layout="timeline"] .layout-body:has(:global([data-slot="message-actions"])) > .timeline-metadata { min-height: 32px; }
    [data-layout="timeline"] .layout-body:has(:global([data-slot="message-actions"])):not(:has(> .layout-header, > .timeline-metadata)) { padding-block-start: 38px; }
    .chat-layout :global([data-slot="message-actions"]) { inset-block-start: 0; transform: translateY(-50%); }
    [data-layout="timeline"] :global([data-slot="message-actions"]) { inset-block-start: -4px; transform: none; }
    [data-layout="bubble"][data-side="outgoing"] :global([data-slot="message-actions"]) { inset-inline-end: 12px; }
    [data-layout="bubble"][data-side="incoming"] :global([data-slot="message-actions"]) { inset-inline-start: 12px; inset-inline-end: auto; }
    [data-layout="bubble"] :global([data-slot="message-actions"][data-open="false"]:not(:has(:focus-visible))) { opacity: 0; pointer-events: none; }
    [data-layout="bubble"] .layout-cluster:has(:global(.chat-layout-bubble:hover)) :global([data-slot="message-actions"]),
    [data-layout="bubble"] .layout-cluster:has(:global([data-slot="message-actions"]:hover)) :global([data-slot="message-actions"]) { opacity: 1; pointer-events: auto; }
    @container chat-timeline (max-width: 24rem) {
      [data-layout="timeline"] .layout-body:has(:global([data-slot="message-actions"])) > .layout-header,
      [data-layout="timeline"] .layout-body:has(:global([data-slot="message-actions"])) > .timeline-metadata { padding-inline-end: 0; }
      [data-layout="timeline"] .layout-body:has(:global([data-slot="message-actions"])):not(:has(> .layout-header, > .timeline-metadata)) { padding-block-start: 0; }
      [data-layout="timeline"] :global([data-slot="message-actions"]) { position: relative; inset-block-start: auto; inset-inline-end: auto; opacity: 1; pointer-events: auto; }
    }
  }
  @media (max-width: 767px) {
    [data-layout="timeline"] :global(.chat-layout-row:has(> [data-slot="chat-message-avatar"])) { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 8px; }
    [data-layout="timeline"] :global(.chat-layout-avatar) { grid-column: 1; grid-row: 1; min-width: 28px; width: 28px; }
    [data-layout="timeline"] :global(.chat-layout-avatar [data-slot="avatar"]) { width: 28px; height: 28px; }
    [data-layout="timeline"]:has(:global([data-slot="chat-message-avatar"])) .layout-body { display: contents; }
    [data-layout="timeline"] .layout-header { grid-column: 2; grid-row: 1; align-self: center; }
    [data-layout="timeline"] .layout-cluster { grid-column: 1 / -1; }
    [data-layout="timeline"] .author { font-size: 14px; }
    .chat-layout :global(.chat-layout-text) { font-size: 15px; line-height: 1.65; }
    [data-layout="timeline"] :global(.chat-layout-text) { font-size: 15px; line-height: 1.75; }
  }
</style>
