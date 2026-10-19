<script lang="ts">
import { AdminShellFrame } from "@mutsuna/ui/admin-shell-frame";
import * as Sidebar from "@mutsuna/ui/sidebar";
import { SidebarUserMenu } from "@mutsuna/ui/sidebar-identity";
import { Button } from "@mutsuna/ui/button";
let { explicitPadding, explicitGutter, initiallyOpen = false }: { initiallyOpen?: boolean; explicitPadding?: "default" | "none"; explicitGutter?: "stable" | "auto" | "both-edges" } = $props();
let clicks = $state(0);
</script>
<AdminShellFrame pageTitle="Shell workspace" contentPadding={explicitPadding} contentGutter={explicitGutter} sidebarOpen={initiallyOpen}>
  {#snippet sidebar()}<Sidebar.Root collapsible="icon" hideHeaderSeam><Sidebar.Header>Workspace</Sidebar.Header><Sidebar.Content><Sidebar.Menu><Sidebar.MenuItem><Sidebar.MenuButton>Navigation</Sidebar.MenuButton></Sidebar.MenuItem></Sidebar.Menu></Sidebar.Content><Sidebar.Footer><SidebarUserMenu user={{ name: "Shell user", email: "user@example.com" }} /></Sidebar.Footer></Sidebar.Root>{/snippet}
  {#snippet headerActions()}<Button variant="outline" onclick={() => clicks++}>Shell action</Button>{/snippet}
  <section aria-label="Shell workspace" style="height:100%;overflow:auto">
    <div style="min-height:1600px;padding:16px"><Button>Workspace action</Button><p>Workspace content</p><output aria-label="Shell action count">{clicks}</output></div>
  </section>
  {#snippet footer()}<a href="#footer" class="inline-flex min-h-11 items-center">Shell footer link</a>{/snippet}
</AdminShellFrame>
