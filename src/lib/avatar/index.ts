import Root from "./avatar.svelte";
import Badge from "./avatar-badge.svelte";
import Fallback from "./avatar-fallback.svelte";
import Group from "./avatar-group.svelte";
import GroupCount from "./avatar-group-count.svelte";
import Image from "./avatar-image.svelte";
import CustomerAvatar from "./customer-avatar.svelte";

export type { CustomerAvatarProps } from "./customer-avatar.svelte";
export {
  Badge,
  Badge as AvatarBadge,
  CustomerAvatar,
  Fallback,
  Fallback as AvatarFallback,
  Group,
  Group as AvatarGroup,
  GroupCount,
  GroupCount as AvatarGroupCount,
  Image,
  Image as AvatarImage,
  Root,
  //
  Root as Avatar,
};
