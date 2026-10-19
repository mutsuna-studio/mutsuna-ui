// Adapted from shadcn-svelte (MIT); see upstream/chat/README.md.
import Avatar from "./message-avatar.svelte";
import Content from "./message-content.svelte";
import Footer from "./message-footer.svelte";
import Group from "./message-group.svelte";
import Header from "./message-header.svelte";
import Root from "./message.svelte";
export { default as Actions, default as MessageActions, type MessageActionsProps, type MessageReactionOption } from "./message-actions.svelte";
export { default as Reactions, default as MessageReactions, type MessageReactionsProps, type MessageReaction } from "./message-reactions.svelte";
export { default as Quote, default as MessageQuote, type MessageQuoteProps } from "./message-quote.svelte";

export {
	Root,
	Group,
	Avatar,
	Content,
	Header,
	Footer,
	//
	Root as Message,
	Group as MessageGroup,
	Avatar as MessageAvatar,
	Content as MessageContent,
	Header as MessageHeader,
	Footer as MessageFooter,
};

import type { ComponentProps } from "svelte";
export type MessageProps = ComponentProps<typeof Root>;
export type MessageContentProps = ComponentProps<typeof Content>;
export type MessageHeaderProps = ComponentProps<typeof Header>;
export type MessageFooterProps = ComponentProps<typeof Footer>;
export type MessageAvatarProps = ComponentProps<typeof Avatar>;
export type MessageGroupProps = ComponentProps<typeof Group>;
