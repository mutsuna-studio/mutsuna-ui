<script lang="ts">
import Building2Icon from "@lucide/svelte/icons/building-2";
import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
import LoaderCircleIcon from "@lucide/svelte/icons/loader-circle";
import ClientReady from "../client-ready/client-ready.svelte";
import * as DropdownMenu from "../dropdown-menu/index.js";
import * as Sidebar from "../sidebar/index.js";
import type { SidebarWorkspace, SidebarWorkspaceManagementAction } from "./types.js";

interface Props {
  activeAvatarUrl?: string | null;
  activeDescription?: string | null;
  activeWorkspaceId: string | null;
  emptyLabel?: string;
  isLoading?: boolean;
  managementAction?: SidebarWorkspaceManagementAction | null;
  menuLabel?: string;
  onSelectWorkspace?: (workspaceId: string) => void;
  switchingWorkspaceId?: string | null;
  workspaces?: readonly SidebarWorkspace[];
}

let {
  activeAvatarUrl = null,
  activeDescription = null,
  activeWorkspaceId,
  emptyLabel = "切り替え可能なワークスペースがありません",
  isLoading = false,
  managementAction = null,
  menuLabel = "ワークスペースを切り替え",
  onSelectWorkspace = () => undefined,
  switchingWorkspaceId = null,
  workspaces = [],
}: Props = $props();

const sidebar = Sidebar.useSidebar();
const activeWorkspace = $derived(workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null);
const isSwitching = $derived(switchingWorkspaceId !== null);
const triggerDescription = $derived(activeDescription ?? (isLoading ? "読み込み中" : ""));
const triggerName = $derived(activeWorkspace?.name ?? (isLoading ? "読み込み中" : "ワークスペースなし"));

function selectWorkspace(workspaceId: string): void {
  if (workspaceId === activeWorkspaceId || isSwitching) return;
  onSelectWorkspace(workspaceId);
}
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <ClientReady>
      {#snippet fallback()}
        <button
          type="button"
          class="ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground gap-2 rounded-xl px-3 py-1 text-left text-sm whitespace-nowrap transition-[width,height,padding] duration-200 group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-1! focus-visible:ring-3 has-[>svg:first-child]:pl-2.5 has-[>svg:last-child]:pr-2.5 data-active:font-medium peer/menu-button group/menu-button flex h-10 w-full items-center overflow-hidden outline-hidden"
          data-slot="sidebar-menu-button"
          data-sidebar="menu-button"
          data-size="lg"
          disabled={activeWorkspace === null}
        >
          <div class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
            {#if activeAvatarUrl}
              <img src={activeAvatarUrl} alt="" class="size-full object-cover" />
            {:else}
              <Building2Icon class="size-4" aria-hidden="true" />
            {/if}
          </div>
          <div class="grid flex-1 text-start text-sm leading-tight">
            <span class="truncate font-medium">{triggerName}</span>
            <span class="truncate text-xs">{triggerDescription}</span>
          </div>
          {#if isSwitching}
            <LoaderCircleIcon class="ms-auto size-4 animate-spin text-muted-foreground" aria-hidden="true" />
          {:else}
            <span class="ms-auto text-muted-foreground">⌄</span>
          {/if}
        </button>
      {/snippet}

      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Sidebar.MenuButton
              {...props}
              size="lg"
              class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                {#if activeAvatarUrl}
                  <img src={activeAvatarUrl} alt="" class="size-full object-cover" />
                {:else}
                  <Building2Icon class="size-4" aria-hidden="true" />
                {/if}
              </div>
              <div class="grid flex-1 text-start text-sm leading-tight">
                <span class="truncate font-medium">{triggerName}</span>
                <span class="truncate text-xs">{triggerDescription}</span>
              </div>
              {#if isSwitching}
                <LoaderCircleIcon class="ms-auto size-4 animate-spin" aria-hidden="true" />
              {:else}
                <ChevronsUpDownIcon class="ms-auto" aria-hidden="true" />
              {/if}
            </Sidebar.MenuButton>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
          align="start"
          side={sidebar.isMobile ? "bottom" : "right"}
          sideOffset={4}
        >
          <DropdownMenu.Label class="text-muted-foreground text-xs">{menuLabel}</DropdownMenu.Label>
          {#if workspaces.length > 0}
            {#each workspaces as workspace, index (workspace.id)}
              {@const isTargetWorkspace = switchingWorkspaceId === workspace.id}
              <DropdownMenu.Item
                onSelect={() => selectWorkspace(workspace.id)}
                disabled={isSwitching}
                class="gap-2 p-2"
              >
                <div class="flex size-6 items-center justify-center rounded-md border">
                  {#if isTargetWorkspace}
                    <LoaderCircleIcon class="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
                  {:else}
                    <Building2Icon class="size-3.5 shrink-0" aria-hidden="true" />
                  {/if}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="truncate">{workspace.name}</div>
                  {#if workspace.description}
                    <div class="text-muted-foreground truncate text-xs">{workspace.description}</div>
                  {/if}
                </div>
                <DropdownMenu.Shortcut>⌘{index + 1}</DropdownMenu.Shortcut>
              </DropdownMenu.Item>
            {/each}
          {:else}
            <DropdownMenu.Item disabled class="gap-2 p-2">
              <div class="flex size-6 items-center justify-center rounded-md border">
                <Building2Icon class="size-3.5 shrink-0" aria-hidden="true" />
              </div>
              <div class="text-muted-foreground min-w-0 flex-1 truncate">
                {isLoading ? "ワークスペースを読み込み中" : emptyLabel}
              </div>
            </DropdownMenu.Item>
          {/if}
          {#if managementAction}
            <DropdownMenu.Separator />
            <DropdownMenu.Item class="gap-2 p-2">
              {#snippet child({ props })}
                <a href={managementAction.href} {...props}>
                  <div class="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <Building2Icon class="size-4" aria-hidden="true" />
                  </div>
                  <div class="text-muted-foreground font-medium">{managementAction.label}</div>
                </a>
              {/snippet}
            </DropdownMenu.Item>
          {/if}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </ClientReady>
  </Sidebar.MenuItem>
</Sidebar.Menu>
