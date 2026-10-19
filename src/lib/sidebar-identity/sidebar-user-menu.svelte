<script lang="ts">
import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
import { CustomerAvatar } from "../avatar/index.js";
import * as DropdownMenu from "../dropdown-menu/index.js";
import * as Sidebar from "../sidebar/index.js";
import type { SidebarUser, SidebarUserMenuItem } from "./types.js";

interface Props {
  primaryItems?: readonly SidebarUserMenuItem[];
  secondaryItems?: readonly SidebarUserMenuItem[];
  user: SidebarUser;
}

let { primaryItems = [], secondaryItems = [], user }: Props = $props();
const sidebar = Sidebar.useSidebar();
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Sidebar.MenuButton
            size="default"
            class="h-8 px-2 py-[3px] max-md:min-h-11 [@media(pointer:coarse)]:min-h-11 group-data-[collapsible=icon]:p-[3px]! data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            aria-label={user.name}
            {...props}
          >
            <CustomerAvatar shape="rounded" id={user.email || user.name} name={user.name} imageUrl={user.avatarUrl} size="sm" />
            <span class="min-w-0 flex-1 truncate text-start text-xs font-medium group-data-[collapsible=icon]:hidden">{user.name}</span>
            <ChevronsUpDownIcon class="ms-auto size-3.5 group-data-[collapsible=icon]:hidden" aria-hidden="true" />
          </Sidebar.MenuButton>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
        side={sidebar.isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenu.Label class="p-0 font-normal">
          <div class="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
            <CustomerAvatar shape="rounded" id={user.email || user.name} name={user.name} imageUrl={user.avatarUrl} />
            <div class="grid flex-1 text-start text-sm leading-tight">
              <span class="truncate font-medium">{user.name}</span>
              <span class="truncate text-xs">{user.email}</span>
            </div>
          </div>
        </DropdownMenu.Label>
        {#if primaryItems.length > 0}
          <DropdownMenu.Separator />
          <DropdownMenu.Group>
            {#each primaryItems as item (item.id)}
              <DropdownMenu.Item onSelect={() => item.onSelect?.()}>
                <item.icon aria-hidden="true" />
                {item.label}
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Group>
        {/if}
        {#if secondaryItems.length > 0}
          <DropdownMenu.Separator />
          {#each secondaryItems as item (item.id)}
            <DropdownMenu.Item onSelect={() => item.onSelect?.()}>
              <item.icon aria-hidden="true" />
              {item.label}
            </DropdownMenu.Item>
          {/each}
        {/if}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Sidebar.MenuItem>
</Sidebar.Menu>
