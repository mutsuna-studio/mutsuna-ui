// Adapted from shadcn-svelte (MIT); see upstream/chat/README.md.
import Button from "./message-scroller-button.svelte";
import Content from "./message-scroller-content.svelte";
import Item from "./message-scroller-item.svelte";
import Outline from "./message-scroller-outline.svelte";
import Provider from "./message-scroller-provider.svelte";
import Viewport from "./message-scroller-viewport.svelte";
import TopBar from "./message-scroller-top-bar.svelte";
import Root from "./message-scroller.svelte";

export {
	useMessageScroller,
	useMessageScrollerScrollable,
	useMessageScrollerVisibility,
} from "@shadcn-svelte/primitives/message-scroller";

export {
	Provider,
	TopBar,
	Outline,
	Root,
	Viewport,
	Content,
	Item,
	Button,
	//
	Provider as MessageScrollerProvider,
	TopBar as MessageScrollerTopBar,
	Outline as MessageScrollerOutline,
	Root as MessageScroller,
	Viewport as MessageScrollerViewport,
	Content as MessageScrollerContent,
	Item as MessageScrollerItem,
	Button as MessageScrollerButton,
};

import type { ComponentProps } from "svelte";
export type MessageScrollerProviderProps = ComponentProps<typeof Provider>;
export type MessageScrollerProps = ComponentProps<typeof Root>;
export type MessageScrollerViewportProps = ComponentProps<typeof Viewport>;
export type MessageScrollerContentProps = ComponentProps<typeof Content>;
export type MessageScrollerItemProps = ComponentProps<typeof Item>;
export type MessageScrollerButtonProps = ComponentProps<typeof Button>;

export type { MessageScrollerDefaultScrollPosition, MessageScrollerScrollAlign, MessageScrollerScrollOptions, MessageScrollerScrollable, MessageScrollerVisibilityState } from "@shadcn-svelte/primitives/message-scroller";

export type { MessageScrollerOutlineProps } from "./message-scroller-outline.svelte";

export type { MessageScrollerTopBarProps } from "./message-scroller-top-bar.svelte";
