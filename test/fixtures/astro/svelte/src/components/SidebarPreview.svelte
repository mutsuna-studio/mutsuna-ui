<script lang="ts">
import { SidebarUserMenu } from "@mutsuna/ui/sidebar-identity";
import * as Sidebar from "@mutsuna/ui/sidebar";
import * as DropdownMenu from "@mutsuna/ui/dropdown-menu";
import UsersIcon from "@lucide/svelte/icons/users";
let open = $state(false);
let changes = $state(0);
let expandOnHover = $state(true);
let side = $state<"left" | "right">("left");
let variant = $state<"sidebar" | "inset" | "floating">("sidebar");
</script>
<button id="preview-opt-out" onclick={() => expandOnHover = !expandOnHover}>Toggle hover preview</button>
<button id="preview-side" onclick={() => side = side === "left" ? "right" : "left"}>Toggle side</button>
<button id="preview-variant" onclick={() => variant = variant === "sidebar" ? "inset" : "floating"}>Change variant</button>
<Sidebar.Provider bind:open onOpenChange={() => changes++} class="relative min-h-80" id="sidebar-preview">
  <Sidebar.Root {expandOnHover} {side} {variant} collapsible="icon" class="absolute h-full">
    <Sidebar.Content>
      <Sidebar.Group><Sidebar.Menu>
        <Sidebar.MenuItem><Sidebar.MenuButton tooltipContent="Preview members" aria-label="Preview members"><UsersIcon /><span>Preview members</span></Sidebar.MenuButton></Sidebar.MenuItem>
        <Sidebar.MenuItem>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}<Sidebar.MenuButton {...props} aria-label="Preview menu"><UsersIcon /><span>Preview menu</span></Sidebar.MenuButton>{/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content side="right"><DropdownMenu.Item>Preview action</DropdownMenu.Item></DropdownMenu.Content>
          </DropdownMenu.Root>
        </Sidebar.MenuItem>
      </Sidebar.Menu></Sidebar.Group>
    </Sidebar.Content>
  <Sidebar.Footer><SidebarUserMenu user={{ name: "Preview user", email: "preview@example.com" }} /></Sidebar.Footer>
  </Sidebar.Root>
  <Sidebar.Inset><Sidebar.Trigger aria-label="Pin sidebar" /><button id="preview-outside">Outside sidebar</button><span id="preview-changes">{changes}</span></Sidebar.Inset>
</Sidebar.Provider>
