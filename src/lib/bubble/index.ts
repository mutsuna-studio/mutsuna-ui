// Adapted from shadcn-svelte (MIT); see upstream/chat/README.md.
import Content from "./bubble-content.svelte";
import Group from "./bubble-group.svelte";
import Reactions, {
	bubbleReactionsVariants,
	type BubbleReactionsAlign,
	type BubbleReactionsSide,
} from "./bubble-reactions.svelte";
import Root, { bubbleVariants, type BubbleVariant } from "./bubble.svelte";

export {
	Root,
	Group,
	Content,
	Reactions,
	bubbleVariants,
	bubbleReactionsVariants,
	type BubbleVariant,
	type BubbleReactionsSide,
	type BubbleReactionsAlign,
	//
	Root as Bubble,
	Group as BubbleGroup,
	Content as BubbleContent,
	Reactions as BubbleReactions,
};

import type { ComponentProps } from "svelte";
export type BubbleProps = ComponentProps<typeof Root>;
export type BubbleContentProps = ComponentProps<typeof Content>;
export type BubbleGroupProps = ComponentProps<typeof Group>;
export type BubbleReactionsProps = ComponentProps<typeof Reactions>;
