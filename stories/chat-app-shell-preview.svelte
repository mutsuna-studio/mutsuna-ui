<script lang="ts">
import { AdminShellFrame } from "@mutsuna/ui/admin-shell-frame";
import * as Sidebar from "@mutsuna/ui/sidebar";
import { Button } from "@mutsuna/ui/button";
import { Badge } from "@mutsuna/ui/badge";
import { MessageSquare } from "@lucide/svelte";
import ChatScreenPreview from "./chat-screen-preview.svelte";
let { layout = "bubble", scenario = "conversation", submitOn = "mod-enter", longAnswer = false, simulateFailure = false }: { layout?: "timeline" | "bubble"; scenario?: "conversation" | "assistant"; submitOn?: "enter" | "mod-enter"; longAnswer?: boolean; simulateFailure?: boolean } = $props();
let conversation = $state({ title: "メッセージ", status: "" });
let showThreads = $state(false);
</script>
<AdminShellFrame pageTitle={conversation.title} sidebarOpen={false}>
  {#snippet sidebar()}
    <Sidebar.Root collapsible="icon" hideHeaderSeam>
      <Sidebar.Header><span class="truncate px-2 text-sm font-semibold">Workspace</span></Sidebar.Header>
      <Sidebar.Content><Sidebar.Group><Sidebar.Menu><Sidebar.MenuItem><Sidebar.MenuButton isActive tooltipContent="メッセージ"><MessageSquare /><span>メッセージ</span></Sidebar.MenuButton></Sidebar.MenuItem></Sidebar.Menu></Sidebar.Group></Sidebar.Content>
    </Sidebar.Root>
  {/snippet}
  {#snippet headerActions()}
    {#if conversation.status}<Badge variant="secondary" class="shrink-0 text-[10px]">{conversation.status}</Badge>{/if}
    <Button variant="ghost" size="icon" icon={MessageSquare} aria-label="会話一覧を開く" class="md:hidden" onclick={() => showThreads = true} />
  {/snippet}
  <ChatScreenPreview {layout} {scenario} {submitOn} {longAnswer} {simulateFailure} showHeader={false} embedded bind:showThreads onConversationChange={value => conversation = value} />
</AdminShellFrame>
