<script lang="ts">
import type { Snippet } from "svelte";
import * as Breadcrumb from "../breadcrumb/index.js";
import ScrollbarArea from "../scrollbar/scrollbar-area.svelte";
import Separator from "../separator/separator.svelte";
import * as Sidebar from "../sidebar/index.js";
import { cn } from "../utils.js";

interface Props {
  children?: Snippet;
  sidebar: Snippet;
  headerActions?: Snippet;
  breadcrumb?: Snippet;
  pageTitle: string;
  parentPageTitle?: string | null;
  parentPageHref?: string | null;
  contentClass?: string;
  insetClass?: string;
  headerClass?: string;
  sidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
}

let {
  children,
  sidebar,
  headerActions,
  breadcrumb,
  pageTitle,
  parentPageTitle = null,
  parentPageHref = null,
  contentClass,
  insetClass,
  headerClass,
  sidebarOpen = $bindable(true),
  onSidebarOpenChange = () => undefined,
}: Props = $props();

function handleSidebarOpenChange(open: boolean): void {
  sidebarOpen = open;
  onSidebarOpenChange(open);
}
</script>

<Sidebar.Provider open={sidebarOpen} onOpenChange={handleSidebarOpenChange}>
  {@render sidebar()}
  <Sidebar.Inset class={cn("bg-sidebar h-svh min-h-0 overflow-hidden", insetClass)}>
    <header
      class={cn(
        "bg-sidebar flex h-14 shrink-0 items-center justify-between gap-2 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-10",
        headerClass,
      )}
    >
      <div class="flex min-w-0 items-center gap-2">
        <Sidebar.Trigger class="-ms-1" />
        <Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
        {#if breadcrumb}
          {@render breadcrumb()}
        {:else}
          <Breadcrumb.Root>
            <Breadcrumb.List>
              {#if parentPageTitle}
                <Breadcrumb.Item class="hidden md:block">
                  <Breadcrumb.Link href={parentPageHref ?? "#"}>{parentPageTitle}</Breadcrumb.Link>
                </Breadcrumb.Item>
                <Breadcrumb.Separator class="hidden md:block" />
              {/if}
              <Breadcrumb.Item>
                <Breadcrumb.Page>{pageTitle}</Breadcrumb.Page>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb.Root>
        {/if}
      </div>
      {#if headerActions}
        <div class="flex shrink-0 items-center gap-2">
          {@render headerActions()}
        </div>
      {/if}
    </header>
    <ScrollbarArea
      class={cn(
        "bg-background border-sidebar-border rounded-t-2xl sm:rounded-se-none min-h-0 min-w-0 flex-1 overflow-auto border-t border-s p-2 pt-0 sm:p-4 sm:pt-0",
        contentClass,
      )}
    >
      {@render children?.()}
    </ScrollbarArea>
  </Sidebar.Inset>
</Sidebar.Provider>
