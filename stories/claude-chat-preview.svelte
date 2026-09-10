<script lang="ts">
import { ArrowUp, Code, PenLine, Plus } from "@lucide/svelte";
import { Button } from "@mutsuna/ui/button";
import { ThemeProvider, type Theme } from "@mutsuna/ui/theme";

let { theme }: { theme: Theme } = $props();
let draft = $state("");
let message = $state("");

function previewMessage(event: SubmitEvent) {
  event.preventDefault();
  if (!draft.trim()) return;
  message = draft.trim();
  draft = "";
}
</script>

<ThemeProvider {theme}>
  <section class="chat-preview bg-background text-foreground font-sans" aria-label="チャット画面のテーマプレビュー">
    <header class="flex items-center justify-between border-b px-5 py-3 text-sm">
      <span class="font-medium">Claude-inspired</span>
      <span class="text-muted-foreground">チャット</span>
    </header>
    <div class="chat-content">
      <h2 class="chat-greeting">こんにちは。<br class="sm:hidden" />何から始めましょうか？</h2>
      {#if message}
        <div class="mb-5 ml-auto max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-secondary px-4 py-3 text-sm">{message}</div>
      {/if}
      <form class="chat-composer bg-card text-card-foreground" onsubmit={previewMessage}>
        <label for="claude-preview-message" class="sr-only">メッセージ</label>
        <textarea id="claude-preview-message" bind:value={draft} placeholder="どんなことを考えていますか？" rows="3"></textarea>
        <div class="flex items-center justify-between px-3 pb-3">
          <span class="text-muted-foreground" aria-hidden="true"><Plus class="size-5" /></span>
          <Button type="submit" size="icon-sm" class="rounded-lg" aria-label="プレビューにメッセージを追加" disabled={!draft.trim()}><ArrowUp class="size-4" /></Button>
        </div>
      </form>
      <div class="mt-4 flex flex-wrap justify-center gap-2">
        <Button variant="outline" size="sm" class="rounded-lg bg-transparent font-normal" onclick={() => draft = "コードを読みやすく整理したいです。"}><Code class="size-4" />コードを書く</Button>
        <Button variant="outline" size="sm" class="rounded-lg bg-transparent font-normal" onclick={() => draft = "文章の構成を一緒に考えてください。"}><PenLine class="size-4" />文章を考える</Button>
      </div>
    </div>
  </section>
</ThemeProvider>

<style>
.chat-preview { min-height: 560px; }
.chat-content { width: min(100%, 700px); margin: 0 auto; padding: 110px 24px 90px; }
.chat-greeting { margin: 0 0 32px; text-align: center; font-size: clamp(24px, 3vw, 34px); font-weight: 400; line-height: 1.45; letter-spacing: -.025em; }
.chat-composer { border: 1px solid var(--border); border-radius: 22px; box-shadow: 0 4px 20px rgb(0 0 0 / 3%); }
.chat-composer:focus-within { border-color: var(--ring); }
textarea { display: block; width: 100%; min-height: 108px; padding: 18px 20px 8px; resize: vertical; border: 0; background: transparent; border-radius: 22px 22px 0 0; font-family: inherit; font-size: 15px; line-height: 1.6; outline: none; }
textarea::placeholder { color: var(--muted-foreground); }
@media (max-width: 480px) { .chat-content { padding: 70px 16px; } .chat-preview { min-height: 500px; } }
</style>
