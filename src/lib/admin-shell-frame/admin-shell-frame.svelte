<script lang="ts">
import type { Snippet } from "svelte";
import * as Breadcrumb from "../breadcrumb/index.js";
import ScrollbarArea from "../scrollbar/scrollbar-area.svelte";
import type { ScrollbarGutter } from "../scrollbar/types.js";
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
  contentGutter?: ScrollbarGutter;
  contentPadding?: "default" | "none";
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
  contentGutter = "stable",
  contentPadding = "default",
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
        "bg-sidebar flex h-14 shrink-0 items-center justify-between gap-2 px-4 transition-[width,height] ease-linear",
        headerClass,
      )}
    >
      <div class="flex min-w-0 items-center gap-2">
        <Sidebar.Trigger class="-ms-1 size-11" />
        <Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
        {#if breadcrumb}
          <h1 class="sr-only">{pageTitle}</h1>
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
                <h1 class="text-foreground font-normal" aria-current="page">{pageTitle}</h1>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb.Root>
        {/if}
      </div>
      {#if headerActions}
        <div
          class="flex shrink-0 items-center gap-2 [&_[data-slot=button]]:min-h-11 [&_[data-slot=button]]:min-w-11"
        >
          {@render headerActions()}
        </div>
      {/if}
    </header>
    <ScrollbarArea
      gutter={contentGutter}
      class={cn(
        "bg-background border-sidebar-border mb-2 min-h-0 min-w-0 flex-1 overflow-auto rounded-[14px] border-y sm:me-2 sm:border",
        contentPadding === "default" && "px-2 sm:p-4 sm:pt-0",
        contentClass,
      )}
    >
      {@render children?.()}
    </ScrollbarArea>
  </Sidebar.Inset>
</Sidebar.Provider>
