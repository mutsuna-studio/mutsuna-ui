<script module lang="ts">
import type { Snippet } from "svelte";
import type { ScrollbarGutter } from "../scrollbar/types.js";
export interface AdminShellFrameProps {
  children?: Snippet;
  sidebar: Snippet;
  headerActions?: Snippet;
  footer?: Snippet;
  breadcrumb?: Snippet;
  pageTitle: string;
  parentPageTitle?: string | null;
  parentPageHref?: string | null;
  contentClass?: string;
  /** Defaults to auto; scrolling belongs to the child workspace. */
  contentGutter?: ScrollbarGutter;
  /** Defaults to none, preserving a single outer frame. */
  contentPadding?: "default" | "none";
  insetClass?: string;
  headerClass?: string;
  sidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
}
</script>
<script lang="ts">
import * as Breadcrumb from "../breadcrumb/index.js";
import ScrollbarArea from "../scrollbar/scrollbar-area.svelte";
import Separator from "../separator/separator.svelte";
import * as Sidebar from "../sidebar/index.js";
import { cn } from "../utils.js";

let {
  children,
  sidebar,
  headerActions,
  footer,
  breadcrumb,
  pageTitle,
  parentPageTitle = null,
  parentPageHref = null,
  contentClass,
  contentGutter = "auto",
  contentPadding = "none",
  insetClass,
  headerClass,
  sidebarOpen = $bindable(true),
  onSidebarOpenChange = () => undefined,
}: AdminShellFrameProps = $props();

let footerHeight = $state(0);

function measureFooter(node: HTMLElement) {
  const update = () => { footerHeight = node.offsetHeight; };
  update();
  const observer = new ResizeObserver(update);
  observer.observe(node);
  return { destroy() { observer.disconnect(); footerHeight = 0; } };
}

function handleSidebarOpenChange(open: boolean): void {
  sidebarOpen = open;
  onSidebarOpenChange(open);
}
</script>

<Sidebar.Provider
  open={sidebarOpen}
  onOpenChange={handleSidebarOpenChange}
  style={`--admin-shell-footer-height: ${footerHeight}px;`}
  class={footer ? "[&_[data-slot=sidebar-footer]]:min-h-[calc(var(--admin-shell-footer-height)+8px)] [&_[data-slot=sidebar-footer]]:py-0 [&_[data-slot=sidebar-footer]]:justify-center" : undefined}
>
  {@render sidebar()}
  <Sidebar.Inset class={cn("bg-sidebar h-svh min-h-0 overflow-hidden", insetClass)}>
    <header
      data-slot="admin-shell-header"
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
      data-slot="admin-shell-content"
      gutter={contentGutter}
      class={cn(
        "bg-background border-sidebar-border mb-2 min-h-0 min-w-0 flex-1 overflow-hidden rounded-[14px] border-y sm:me-2 sm:border",
        footer && "mb-0",
        contentPadding === "default" && "px-2 sm:p-4 sm:pt-0",
        contentClass,
      )}
    >
      {@render children?.()}
    </ScrollbarArea>
    {#if footer}
      <footer use:measureFooter data-slot="admin-shell-footer" class="min-w-0 shrink-0 px-2 py-1 sm:px-4">
        {@render footer()}
      </footer>
    {/if}
  </Sidebar.Inset>
</Sidebar.Provider>
