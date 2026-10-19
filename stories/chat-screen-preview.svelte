<script lang="ts">
import { ChatMessage, ChatHeader, ChatThreadList, type ChatThreadListItem, ChatAttachment, ChatComposer, type ChatComposerAttachment, type ChatComposerSubmission } from "@mutsuna/ui/chat";
import { onDestroy, tick } from "svelte";
import { ArrowLeft, MessageSquare, PanelLeft, Plus, Sparkles, Hash, Home, ChevronDown, Pencil, RotateCcw, Square } from "@lucide/svelte";
import * as Message from "@mutsuna/ui/message";
import * as Menu from "@mutsuna/ui/dropdown-menu";
import ChatLongAnswerContent from "./chat-long-answer-content.svelte";
import * as MessageScroller from "@mutsuna/ui/message-scroller";
import ChatToolsPreview from "./chat-tools-preview.svelte";
import { Badge } from "@mutsuna/ui/badge";
import ChatQuestionContext from "./chat-question-context.svelte";
import ChatScrollCommand from "./chat-scroll-command.svelte";
import { CustomerAvatar } from "@mutsuna/ui/avatar";
import { Button } from "@mutsuna/ui/button";
import { ScrollbarArea } from "@mutsuna/ui/scrollbar";
import { chatSampleImage, chatSampleScreen, chatSamplePdf } from "./chat-sample-images.js";
import { copyChatText } from "./chat-copy-text.js";

type ScreenAttachment = ChatComposerAttachment & { downloadUrl?: string; mediaType?: string };
type ReplyTarget = { id: number; author: string; text: string };
type Message = { id: number; author: string; text: string; own?: boolean; edited?: boolean; time: string; rich?: boolean; attachment?: boolean; files?: readonly ScreenAttachment[]; replyTo?: ReplyTarget };
let { layout = "timeline", scenario = "conversation", submitOn = "mod-enter", longAnswer = false, simulateFailure = false, showHeader = true, embedded = false, showThreads = $bindable(false), onConversationChange }: { showHeader?: boolean; embedded?: boolean; showThreads?: boolean; onConversationChange?: (conversation: { title: string; status: string }) => void; submitOn?: "enter" | "mod-enter"; scenario?: "conversation" | "assistant"; layout?: "timeline" | "bubble"; longAnswer?: boolean; simulateFailure?: boolean } = $props();
const isAssistant = $derived(scenario === "assistant");
let topBarInset = $state(60);
$effect(() => {
  const query = matchMedia("(max-width: 767px)");
  const update = () => topBarInset = query.matches ? 68 : 60;
  update(); query.addEventListener("change", update);
  return () => query.removeEventListener("change", update);
});
const threads = $derived(isAssistant ? [
  { id: "main", title: "文章とアイデア", preview: "アシスタントと考えを整理する", initials: "AI", time: "10:24", unread: false },
  { id: "notes", title: "ミーティングの振り返り", preview: "次のアクションを整理する", initials: "AI", time: "昨日", unread: false },
  { id: "ideas", title: "新しいアイデアのメモ", preview: "考えを広げる壁打ち", initials: "AI", time: "昨日", unread: false },
] : [
  { id: "main", title: "佐藤 美咲", preview: "余白を広げた案、よさそうです！", initials: "佐", time: "10:24", unread: true },
  { id: "notes", title: "田中 花", preview: "ありがとうございます。確認します。", initials: "田", time: "09:40", unread: false },
  { id: "ideas", title: "鈴木 健", preview: "今日の共有事項をまとめました", initials: "鈴", time: "昨日", unread: false },
]);
const threadItems = $derived<ChatThreadListItem[]>(threads.map(item => ({
  id: item.id, title: item.title, avatarId: item.title,
  ...(!isAssistant ? { preview: item.preview, time: item.time, unreadCount: item.unread ? 2 : 0, online: item.id === "main" } : {})
})));
const threadDetails = $derived<Record<string, { status: string }>>(isAssistant ? {
  main: { status: "下書き" }, notes: { status: "確認待ち" }, ideas: { status: "完了" },
} : {
  main: { status: "対応中" }, notes: { status: "返信待ち" }, ideas: { status: "完了" },
});
let memoValues = $state<Record<string, string>>({});
let memoDraft = $state("");
let memoOpen = $state(false);
let statusOverrides = $state<Record<string, string>>({});
function currentStatus(id: string) { return statusOverrides[id] ?? threadDetails[id]?.status ?? ""; }
function updateStatus(value: string) { statusOverrides = { ...statusOverrides, [selected]: value }; }
const initialMemo = (id: string) => isAssistant ? id === "main" ? "結論を先に書く。紹介文は短く、具体例を一つ添える。" : id === "notes" ? "決まったことと次の行動を分けて整理する。" : "" : id === "main" ? "次回は余白を広げた画面案を確認する。" : id === "ideas" ? "共有事項は次の打ち合わせで確認する。" : "";
function memoValue(id: string) { return memoValues[id] ?? initialMemo(id); }
function saveMemo(value: string) { memoValues = { ...memoValues, [selected]: value }; }
let selected = $state("main");
$effect(() => { selected; isAssistant; memoDraft = memoValue(selected); });
let draft = $state("");
let attachments = $state<ScreenAttachment[]>([]);
let fresh = $state(false);
let additions = $state<Message[]>([]);
let revisedMessages = $state<Message[] | null>(null);
let editingId = $state<number | null>(null);
let savedDraft = "";
let submittingEdit = $state(false);
let editError = $state<string>();
let regeneratingId = $state<number | null>(null);
let regenerationError = $state<string>();
let revisionNotice = $state("");
let operationTimer: ReturnType<typeof setTimeout> | undefined;
let revision = 0;
const revisionBusy = $derived(submittingEdit || regeneratingId !== null);
onDestroy(() => clearTimeout(operationTimer));
let replyTarget = $state<ReplyTarget | null>(null);
let reactionState = $state<Record<number, Message.MessageReaction[]>>({ 1: [{ emoji: "👍", label: "いいね", count: 2 }] });
let copyState = $state<Record<number, "idle" | "copied" | "error">>({});
const copyTimers = new Map<number, ReturnType<typeof setTimeout>>();
onDestroy(() => { for (const timer of copyTimers.values()) clearTimeout(timer); });
function resetActions() {
  clearTimeout(operationTimer);
  editingId = null; savedDraft = ""; submittingEdit = false; editError = undefined;
  regeneratingId = null; regenerationError = undefined; revisionNotice = ""; revisedMessages = null;
  replyTarget = null; reactionState = {}; copyState = {};
  for (const timer of copyTimers.values()) clearTimeout(timer);
  copyTimers.clear();
}
function reactionOptions() { return isAssistant ? [{ emoji: "👍", label: "役に立った" }, { emoji: "👎", label: "改善が必要" }] : [{ emoji: "👍", label: "いいね" }, { emoji: "❤️", label: "ハート" }, { emoji: "🎉", label: "お祝い" }]; }
function toggleReaction(id: number, emoji: string) {
  const items = reactionState[id] ?? [];
  const existing = items.find(item => item.emoji === emoji);
  const updated = existing ? items.map(item => item.emoji === emoji ? { ...item, selected: !item.selected, count: item.count + (item.selected ? -1 : 1) } : item) : [...items, { emoji, label: reactionOptions().find(item => item.emoji === emoji)?.label ?? emoji, count: 1, selected: true }];
  reactionState[id] = isAssistant ? updated.map(item => item.emoji !== emoji && item.selected ? { ...item, selected: false, count: Math.max(0, item.count - 1) } : item) : updated;
}
function messageText(message: Message) { return message.text || message.files?.map(file => file.name).join("、") || "添付ファイル"; }
async function replyTo(message: Message) {
  revisionNotice = "";
  replyTarget = { id: message.id, author: message.author, text: messageText(message) };
  await tick();
  requestAnimationFrame(() => root.querySelector<HTMLTextAreaElement>("textarea")?.focus());
}
async function dismissReply() {
  replyTarget = null;
  await tick();
  root.querySelector<HTMLTextAreaElement>("textarea")?.focus();
}
function navigateToMessage(id: number) {
  const article = root.querySelector<HTMLElement>(`[data-outline-message="${id}"]`);
  const history = root.querySelector<HTMLElement>('[aria-label="メッセージ履歴"]');
  if (article && history) { history.scrollTop += article.getBoundingClientRect().top - history.getBoundingClientRect().top - 16; article.focus({ preventScroll: true }); }
}
async function copyMessage(message: Message) {
  const text = message.rich ? root.querySelector<HTMLElement>(`[data-outline-message="${message.id}"] [data-slot="chat-message-content"]`)?.innerText ?? messageText(message) : messageText(message);
  try { await copyChatText(text); copyState[message.id] = "copied"; }
  catch { copyState[message.id] = "error"; }
  clearTimeout(copyTimers.get(message.id));
  copyTimers.set(message.id, setTimeout(() => { copyState[message.id] = "idle"; copyTimers.delete(message.id); }, 2000));
}
let nextId = 100;
const previewUrls = new Set<string>();
function releasePreviews() { for (const url of previewUrls) URL.revokeObjectURL(url); previewUrls.clear(); }
onDestroy(releasePreviews);
let root: HTMLDivElement;
function measureComposer(node: HTMLElement) {
  const panel = node.parentElement!;
  const update = () => panel.style.setProperty("--composer-height", `${node.offsetHeight}px`);
  update();
  const observer = new ResizeObserver(update);
  observer.observe(node);
  return { destroy() { observer.disconnect(); panel.style.removeProperty("--composer-height"); } };
}
let sendRequest = $state(0);
const thread = $derived(threads.find(item => item.id === selected) ?? threads[0]);
const title = $derived(fresh ? (isAssistant ? "新しい会話" : "新しいメッセージ") : thread.title);
$effect(() => { onConversationChange?.({ title, status: fresh ? "" : currentStatus(selected) }); });
const initialMessages = $derived<Message[]>(fresh ? [] : selected !== "main" ? [
  { id: 1, author: isAssistant ? "アシスタント" : thread.title, text: isAssistant ? "どこから整理しましょうか？今考えていることを教えてください。" : "共有ありがとうございます。気になったことがあれば、ここで相談しましょう。", time: "09:40" },
] : isAssistant ? [
  { id: 1, author: "あなた", own: true, text: "新しい機能の紹介文を書いています。情報が多くなってしまったので、読みやすい構成を一緒に考えてください。", time: "10:22", files: [{ id: "screen", name: "チャット画面のラフ.svg", previewUrl: chatSampleScreen, downloadUrl: chatSampleScreen, mediaType: "SVG" }, { id: "photo", name: "参考画像.svg", previewUrl: chatSampleImage, downloadUrl: chatSampleImage, mediaType: "SVG" }] },
  { id: 2, author: "アシスタント", text: "まず、読み手にいちばん伝えたいことを一つに絞りましょう。\n\nおすすめは、次の3つのまとまりです。\n\n1. 何ができるようになるか\n2. どんな場面で役に立つか\n3. 使い始めるための最初の一歩\n\n機能の一覧よりも、使った後の変化から書くと伝わりやすくなります。", rich: longAnswer, time: "10:23" },
  { id: 3, author: "あなた", own: true, text: "いいですね。冒頭の一文から考えたいです。", time: "10:24" },
  { id: 4, author: "アシスタント", text: "冒頭は「考えをすっきりまとめて、次の一歩へ。」のように、読み手にとっての変化から始めてみましょう。\n\nこの後に具体的な利用場面を一つ添えると、自然につながります。", time: "10:24" },
] : [
  { id: 1, author: "佐藤 美咲", text: "こんにちは！メッセージ画面のラフをまとめました。\n情報の優先順位と余白について、意見をもらえますか？", time: "10:18", attachment: true, files: [{ id: "screen", name: "チャット画面のラフ.svg", previewUrl: chatSampleScreen, downloadUrl: chatSampleScreen, mediaType: "SVG" }, { id: "reference", name: "参考写真.svg", previewUrl: chatSampleImage, downloadUrl: chatSampleImage, mediaType: "SVG" }] },
  { id: 2, author: "あなた", own: true, text: "ありがとうございます。会話に集中できる感じがいいですね。本文の周りを少し広げると、長文も読みやすくなりそうです。", time: "10:21", files: [{ id: "photo", name: "共有した写真.svg", previewUrl: chatSampleImage, downloadUrl: chatSampleImage, mediaType: "SVG" }] },
  { id: 3, author: "佐藤 美咲", text: "余白を広げた案、よさそうです！\nこの方向で調整してみます。", time: "10:24" },
]);
const messages = $derived(revisedMessages ?? [...initialMessages, ...additions]);
function conversationText() {
  return messages.map(message => `${message.author}\n${root?.querySelector<HTMLElement>(`[data-outline-message="${message.id}"] [data-slot="chat-message-content"]`)?.innerText ?? messageText(message)}`).join("\n\n");
}
const lastResponseId = $derived(isAssistant && messages.some(message => message.own) && !messages.at(-1)?.own ? messages.at(-1)?.id : undefined);
const affectedCount = $derived(editingId === null ? 0 : messages.length - messages.findIndex(message => message.id === editingId) - 1);
const outline = $derived(messages.filter(message => message.own).map(message => ({ id: String(message.id), label: message.text || message.files?.map(file => file.name).join("、") || "添付ファイル" })));
function restoreEditFocus(id: number) {
  const previous = document.activeElement;
  void tick().then(() => {
    if (document.activeElement !== previous && document.activeElement !== document.body) return;
    const article = root.querySelector<HTMLElement>(`[data-outline-message="${id}"]`);
    const desktop = matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)").matches;
    article?.querySelector<HTMLButtonElement>(desktop ? '[title="質問を編集"], [title="メッセージを編集"]' : '[aria-label="その他の操作"]')?.focus({ preventScroll: true });
  });
}
async function beginEdit(message: Message) {
  if (!message.own || revisionBusy || editingId !== null) return;
  savedDraft = draft; draft = message.text; editingId = message.id; editError = undefined; revisionNotice = "";
  await tick();
  root.querySelector<HTMLTextAreaElement>("textarea")?.focus({ preventScroll: true });
}
function cancelEdit() {
  if (submittingEdit || editingId === null) return;
  const id = editingId; editingId = null; draft = savedDraft; editError = undefined; restoreEditFocus(id);
}
function stopRevision() {
  clearTimeout(operationTimer); submittingEdit = false; regeneratingId = null;
  revisionNotice = "生成を停止しました。元の会話を残しています。";
  if (editingId !== null) void tick().then(() => root.querySelector<HTMLTextAreaElement>("textarea")?.focus({ preventScroll: true }));
}
function submitEdit(value: string) {
  if (editingId === null || revisionBusy) return;
  const snapshot = [...messages]; const index = snapshot.findIndex(message => message.id === editingId);
  if (index < 0) return;
  const question = snapshot[index]; const fail = simulateFailure;
  submittingEdit = true; editError = undefined; revisionNotice = "";
  operationTimer = setTimeout(() => {
    submittingEdit = false;
    if (fail) { void tick().then(() => root.querySelector<HTMLTextAreaElement>("textarea")?.focus({ preventScroll: true })); editError = isAssistant ? "やり直せませんでした。編集内容と元の会話は残っています。" : "送信できませんでした。編集内容は残っています。"; return; }
    if (isAssistant) {
      revisedMessages = [...snapshot.slice(0, index), { ...question, text: value }, { id: nextId++, author: "アシスタント", text: `「${value}」に合わせて、構成を見直しました。\n\n伝えたい変化を最初に示し、利用する場面と具体例を続けると、読み手が流れを追いやすくなります。`, time: "10:25" }];
      regenerationError = undefined; reactionState = {}; copyState = {};
      for (const timer of copyTimers.values()) clearTimeout(timer); copyTimers.clear();
    } else {
      revisedMessages = snapshot.map(message => message.id === question.id ? { ...message, text: value, edited: true } : message);
      copyState[question.id] = "idle"; clearTimeout(copyTimers.get(question.id));
    }
    editingId = null; draft = savedDraft;
    revisionNotice = isAssistant ? "編集した質問から会話を作り直しました。" : "メッセージを更新しました。";
    restoreEditFocus(question.id);
  }, 1000);
}
function regenerate(message: Message) {
  if (revisionBusy || editingId !== null || message.id !== lastResponseId) return;
  const fail = simulateFailure;
  regeneratingId = message.id; regenerationError = undefined; revisionNotice = "";
  operationTimer = setTimeout(() => {
    regeneratingId = null;
    if (fail) { regenerationError = "回答を生成できませんでした。元の回答を残しています。"; return; }
    revisedMessages = messages.map(item => item.id === message.id ? { ...item, rich: false, text: `別の表現でまとめました（再生成 ${++revision}）。\n\n読み手が得られる変化を一文で伝え、その後に具体的な利用場面を一つ添えてみましょう。質問の内容は変わりません。` } : item);
    reactionState[message.id] = []; copyState[message.id] = "idle"; clearTimeout(copyTimers.get(message.id));
    revisionNotice = "回答を再生成しました。";
  }, 1800);
}
async function closeThreads() {
  showThreads = false;
  await tick();
  root.querySelector<HTMLButtonElement>('[aria-label="会話一覧を開く"]')?.focus();
}
async function openThreads() {
  showThreads = true;
  await tick();
  root.querySelector<HTMLButtonElement>('[aria-label="会話一覧を閉じる"]')?.focus();
}
function selectThread(id: string) {
  memoOpen = false;
  resetActions();
  releasePreviews();
  selected = id; fresh = false; additions = []; draft = ""; attachments = []; if (showThreads) void closeThreads();
}
function newConversation() {
  memoOpen = false;
  resetActions();
  releasePreviews();
  fresh = true; additions = []; draft = ""; attachments = []; if (showThreads) void closeThreads();
}
function selectFiles(files: File[]) {
  attachments = [...attachments, ...files.map(file => {
    const downloadUrl = URL.createObjectURL(file);
    const previewUrl = file.type.startsWith("image/") ? downloadUrl : undefined;
    previewUrls.add(downloadUrl);
    return { id: `file-${nextId++}`, name: file.name, size: file.size, previewUrl, downloadUrl, mediaType: file.type || undefined };
  })];
}
function removeAttachment(id: string) {
  const url = attachments.find(file => file.id === id)?.downloadUrl;
  if (url) { URL.revokeObjectURL(url); previewUrls.delete(url); }
  attachments = attachments.filter(file => file.id !== id);
}
async function submit(submission: ChatComposerSubmission) {
  if (revisionBusy) return;
  if (editingId !== null) { if (submission.text.trim()) submitEdit(submission.text.trim()); return; }
  revisionNotice = ""; regenerationError = undefined;
  const sent: Message[] = [{ id: nextId++, author: "あなた", own: true, text: submission.text, files: submission.attachments.map(file => ({ ...file, downloadUrl: attachments.find(item => item.id === file.id)?.downloadUrl, mediaType: attachments.find(item => item.id === file.id)?.mediaType })), time: "10:25", replyTo: replyTarget ? { ...replyTarget } : undefined }];
  if (isAssistant) sent.push({ id: nextId++, author: "アシスタント", text: "冒頭では、読み手にとっての変化を短く伝えてみましょう。\n\n「考えをすっきりまとめて、次の一歩へ。」\n\nこの一文に続けて、具体的な使い方を一つ添えると自然につながります。", time: "10:25" });
  if (revisedMessages) revisedMessages = [...revisedMessages, ...sent]; else additions = [...additions, ...sent];
  replyTarget = null;
  draft = "";
  attachments = [];
  await tick();
  sendRequest++;
}
function editKeydown(event: KeyboardEvent) {
  if (editingId === null || revisionBusy || event.isComposing || event.keyCode === 229) return;
  if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); cancelEdit(); }
}
</script>

{#snippet conversationMetadata(id: string)}
  {#if threadDetails[id]}<Badge variant="secondary" class="my-0.5 h-4 rounded-sm border-0 bg-foreground/[0.04] px-1.5 py-0 text-[10px] font-medium leading-4 text-foreground/75">{currentStatus(id)}</Badge>{/if}
{/snippet}
{#snippet dateLabel()}<div class="date-divider"><time datetime="2026-10-17">10月17日（土）</time></div>{/snippet}
<div bind:this={root} class="chat-screen bg-background text-foreground font-sans" class:workspace={isAssistant} class:direct={!isAssistant} class:embedded data-chat-screen={layout}>
  {#if isAssistant && !embedded}
    <nav class="workspace-rail" aria-label="ワークスペース">
      <span class="workspace-mark" aria-label="Studio">S</span>
      <button type="button" class="rail-active" aria-label="ホーム" onclick={() => selectThread("main")}><Home size={20} /><span>ホーム</span></button>
      <button type="button" aria-label="会話一覧" onclick={openThreads}><MessageSquare size={20} /><span>会話</span></button>
      <span class="rail-bottom"><CustomerAvatar size="sm" id="あなた" name="あなた" /></span>
    </nav>
  {/if}
  <aside class:mobile-open={showThreads} class="thread-sidebar" aria-label="会話一覧">
    <div class="sidebar-heading">
      <div class="sidebar-brand">{#if !isAssistant}<span class="dm-brand"><MessageSquare size={18} /></span>{/if}<span>{isAssistant ? "Studio" : "メッセージ"}</span>{#if isAssistant}<ChevronDown size={16} />{/if}</div>
      <Button variant="ghost" size="icon-sm" class="mobile-navigation" icon={ArrowLeft} aria-label="会話一覧を閉じる" onclick={closeThreads} />
    </div>
    <div class="sidebar-create"><Button variant="outline" class="w-full justify-start bg-background" icon={Plus} onclick={newConversation}>{isAssistant ? "新しい会話" : "新しいメッセージ"}</Button></div>
    {#if isAssistant}<div class="sidebar-section"><span>チャンネル</span><span class="section-count">3</span></div>{:else}<div class="sidebar-section"><span>最近のやり取り</span><span class="section-count">3</span></div>{/if}
    {#snippet threadIcon()}<Hash size={17} />{/snippet}
    <ScrollbarArea class="thread-scroll" aria-label="会話の選択">
      <ChatThreadList items={threadItems} selectedId={fresh ? undefined : selected} variant={isAssistant ? "compact" : "default"} leading={isAssistant ? threadIcon : undefined} onSelect={selectThread}>{#snippet metadata(item)}{@render conversationMetadata(item.id)}{/snippet}</ChatThreadList>
      {#if isAssistant}<div class="sidebar-section assistant-label">アシスタント</div><button type="button" class="assistant-entry" onclick={() => selectThread("main")}><span class="assistant-icon"><Sparkles size={15} /></span><span>文章アシスタント</span><span class="assistant-dot"></span></button>{/if}
    </ScrollbarArea>
    <div class="sidebar-account"><CustomerAvatar size="sm" id="あなた" name="あなた" /><div><p>あなた</p><span>{isAssistant ? "Studio ワークスペース" : "オンライン"}</span></div></div>
  </aside>

  <section data-memo-open={memoOpen} class:threads-open={showThreads} class="chat-panel" aria-label={isAssistant ? "AIとのチャット" : "ダイレクトメッセージ"}>
    {#if showHeader}<ChatHeader {title} headingLevel={1} description={isAssistant ? "文章づくりを相談するチャンネル" : "オンライン"}>
      {#snippet navigation()}<Button variant="ghost" size="icon-sm" class="mobile-navigation" icon={PanelLeft} aria-label="会話一覧を開く" onclick={openThreads} />{/snippet}
      {#snippet leading()}{#if isAssistant}<Hash size={22} />{:else}<CustomerAvatar id={thread.title} name={thread.title} />{/if}{/snippet}
      {#snippet metadata()}{#if !fresh}{@render conversationMetadata(selected)}{/if}{/snippet}

    </ChatHeader>{/if}


    {#key `${selected}-${fresh}`}
    <MessageScroller.Provider autoScroll defaultScrollPosition="start">
      <MessageScroller.Root class="transcript">
        {#if messages.length > 0}<MessageScroller.TopBar placement="overlay" aria-label="履歴の上部情報">
          {#if isAssistant}<ChatQuestionContext items={outline} fallback={dateLabel} />{:else}{@render dateLabel()}{/if}
          {#snippet actions()}<div class="conversation-tools">{#if !fresh}{#key selected}<ChatToolsPreview placement="inline" {title} assistant={isAssistant} status={currentStatus(selected)} statuses={isAssistant ? ["下書き", "確認待ち", "完了"] : ["対応中", "返信待ち", "完了"]} onStatusChange={updateStatus} text={messages.map(message => `${message.author}\n${messageText(message)}`).join("\n\n")} getText={conversationText} bind:memoOpen bind:memoValue={memoDraft} memoSavedValue={memoValue(selected)} onMemoSave={saveMemo} />{/key}{/if}</div>{/snippet}
        </MessageScroller.TopBar>{/if}
        <MessageScroller.Viewport aria-label="メッセージ履歴">
          <MessageScroller.Content class="message-history" aria-label="会話のメッセージ" aria-live="off">
            {#if messages.length === 0}
              <MessageScroller.Item messageId="empty"><div class="empty-conversation"><span class="empty-icon">{#if isAssistant}<Hash size={28} />{:else}<MessageSquare size={28} />{/if}</span><h2>会話を始めましょう</h2><p>考えていることを、あなたの言葉で。</p></div></MessageScroller.Item>
            {:else}
              {#each messages as message (message.id)}
                  {#snippet regenerateMenu({ close }: { close: () => void })}
                    <Menu.Item class="min-h-11" onclick={() => { close(); regeneratingId === message.id ? stopRevision() : regenerate(message); }}>
                      {#if regeneratingId === message.id}<Square />生成を停止{:else}<RotateCcw />{regenerationError ? "再生成を再試行" : "回答を再生成"}{/if}
                    </Menu.Item>
                  {/snippet}
                  {#snippet regenerateMobile({ close }: { close: () => void })}
                    <Button variant="ghost" icon={regeneratingId === message.id ? Square : RotateCcw} class="min-h-12 w-full justify-start gap-3 px-3" onclick={() => { close(); regeneratingId === message.id ? stopRevision() : regenerate(message); }}>{regeneratingId === message.id ? "生成を停止" : regenerationError ? "再生成を再試行" : "回答を再生成"}</Button>
                  {/snippet}
                <MessageScroller.Item messageId={String(message.id)} class={message.rich || editingId === message.id ? "[content-visibility:visible]" : undefined}>
                  <ChatMessage {layout} side={message.own ? "outgoing" : "incoming"} author={message.author} prose={isAssistant && !message.own} tabindex={-1} data-outline-message={message.id} class="message-row" data-editing={editingId === message.id}>
                    {#snippet avatar()}<CustomerAvatar id={message.author} name={message.author} />{/snippet}
                    {#snippet metadata()}
                      {#if !isAssistant && message.own}<span>既読</span>{/if}<time datetime={`2026-10-17T${message.time}:00+09:00`}>{message.time}</time>{#if !isAssistant && message.edited}<span>編集済み</span>{/if}{#if isAssistant && !message.own}<span class="bot-label">AI</span>{/if}
                    {/snippet}
                    {#snippet quote()}{#if message.replyTo}<Message.Quote author={message.replyTo.author} text={message.replyTo.text} onNavigate={() => navigateToMessage(message.replyTo!.id)} />{/if}{/snippet}
                    {#snippet reactions()}{#if !isAssistant || !message.own}<Message.Reactions items={reactionState[message.id] ?? []} onToggle={emoji => toggleReaction(message.id, emoji)} />{/if}{/snippet}
                    {#snippet actions()}{#if editingId !== message.id}<Message.Actions onEdit={message.own ? () => beginEdit(message) : undefined} editLabel={isAssistant ? "質問を編集" : "メッセージを編集"} disabled={editingId !== null || (revisionBusy && regeneratingId !== message.id)} onReply={!revisionBusy ? () => replyTo(message) : undefined} onCopy={!revisionBusy ? () => copyMessage(message) : undefined} onReact={!revisionBusy && (!isAssistant || !message.own) ? emoji => toggleReaction(message.id, emoji) : undefined} actions={message.id === lastResponseId ? regenerateMenu : undefined} mobileActions={message.id === lastResponseId ? regenerateMobile : undefined} reactions={reactionOptions()} copyState={copyState[message.id] ?? "idle"} ariaLabel={`${message.author}のメッセージの操作`} />{/if}{/snippet}
                    {#if isAssistant && !message.own}
                      {#if message.rich}<ChatLongAnswerContent />{:else}{#each message.text.split(/\n\s*\n/) as paragraph}<p class="whitespace-pre-wrap">{paragraph}</p>{/each}{/if}
                    {:else}{message.text}{/if}
                    {#if message.id === regeneratingId}<p class="generation-status" role="status">回答を生成中…</p>{:else if message.id === lastResponseId && regenerationError}<p class="generation-error" role="alert">{regenerationError}</p>{/if}
                    {#each message.files ?? [] as file (file.id)}<ChatAttachment {...file} previewImages={message.files?.flatMap(item => item.previewUrl ? [{ src: item.previewUrl, alt: item.name, title: item.name, description: item.mediaType, downloadUrl: item.downloadUrl, downloadName: item.name }] : [])} previewIndex={(message.files?.filter(item => item.previewUrl) ?? []).findIndex(item => item.id === file.id)} class="message-attachment" />{/each}{#if message.attachment}<ChatAttachment name="メッセージ画面のラフ.pdf" mediaType="PDF" downloadUrl={chatSamplePdf} class="message-attachment" />{/if}
                  </ChatMessage>
                </MessageScroller.Item>
              {/each}
            {/if}
          </MessageScroller.Content>
        </MessageScroller.Viewport>
        <MessageScroller.Button />
        {#if isAssistant}<MessageScroller.Outline items={outline} scrollMargin={topBarInset + 16} ariaLabel="会話の目次" />{/if}
      </MessageScroller.Root>
      <ChatScrollCommand request={sendRequest} editTarget={editingId} topInset={topBarInset} />
    </MessageScroller.Provider>
    {/key}
    <footer use:measureComposer class="composer-footer">
      <div class="composer-glass" aria-hidden="true"><span class="glass-soft"></span><span class="glass-medium"></span><span class="glass-strong"></span></div>
      <div class="composer-form">
        {#if isAssistant && messages.length === 0}<div class="prompt-suggestions"><Button variant="outline" size="sm" onclick={() => draft = "文章の構成を考えたいです。"}>文章を整える</Button><Button variant="outline" size="sm" onclick={() => draft = "アイデアを一緒に広げてください。"}>アイデアを広げる</Button></div>{/if}
        {#snippet composerContext()}
        {#if replyTarget && editingId === null}<Message.Quote variant="composer" author={replyTarget.author} text={replyTarget.text} onDismiss={dismissReply} onNavigate={() => navigateToMessage(replyTarget!.id)} role="region" aria-label="返信先" />{/if}
        {#if editingId !== null}
          <div class="edit-context" role="region" aria-label="メッセージの編集">
            <div class="edit-context-heading"><span><Pencil size={14} aria-hidden="true" />メッセージを編集中</span><Button variant="ghost" size="sm" disabled={submittingEdit} onclick={cancelEdit}>キャンセル</Button></div>
            {#if isAssistant && affectedCount > 0}<p id="edit-impact">この質問以降の会話（{affectedCount}件）を作り直します。</p>{/if}
          </div>
        {/if}
        {/snippet}
        <ChatComposer {submitOn} notice="送信前に内容をご確認ください。" context={replyTarget || editingId !== null ? composerContext : undefined} bind:value={draft} attachments={editingId === null ? attachments : []} disabled={regeneratingId !== null} sending={submittingEdit} ariaLabel={editingId !== null ? isAssistant ? "質問を編集" : "メッセージを編集" : "メッセージ"} onkeydown={editKeydown} onFilesSelect={editingId === null ? selectFiles : undefined} onRemoveAttachment={editingId === null ? removeAttachment : undefined} onSend={submit} />
        {#if editingId !== null && editError}<p role="alert" class="edit-error">{editError}</p>{/if}
        {#if submittingEdit && isAssistant}<Button variant="ghost" size="sm" onclick={stopRevision}>生成を停止</Button>{/if}
        <p role="status" class="revision-notice">{revisionNotice}</p>
      </div>
    </footer>
  </section>
</div>

<style>
  .generation-status { font-size: 12px; color: var(--muted-foreground); }
  .generation-error { font-size: 12px; color: var(--destructive); }
  .edit-context { margin-bottom: 0; min-width: 0; }
  .edit-context-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12px; color: var(--muted-foreground); }
  .edit-context-heading > span { display: flex; align-items: center; gap: 6px; }
  .edit-context-heading :global(button) { min-height: 44px; }
  .edit-context p, .edit-error { font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
  .edit-context p { color: var(--muted-foreground); }
  .edit-error { margin-top: 6px; color: var(--destructive); }
  .chat-screen :global(.message-row[data-editing="true"] [data-slot="bubble"]) { border-radius: 16px; outline: 1px solid color-mix(in oklab, var(--primary) 30%, transparent); outline-offset: 3px; }
  .workspace :global(.message-row[data-editing="true"] [data-slot="bubble"]) { border-radius: 8px; background: color-mix(in oklab, var(--primary) 6%, transparent); }
  .revision-notice { font-size: 12px; line-height: 1.6; color: var(--muted-foreground); }
  .revision-notice:not(:empty) { margin-top: 8px; }
  .chat-screen { --chat-top-bar-height: 60px; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); height: min(54rem, 100dvh); min-height: 0; position: relative; isolation: isolate; overflow: hidden; }
  .thread-sidebar { display: none; min-height: 0; flex-direction: column; border-inline-end: 1px solid var(--border); background: color-mix(in oklab, var(--muted) 55%, var(--background)); }
  .thread-sidebar.mobile-open { display: flex; position: absolute; inset: 0; z-index: 20; background: var(--background); }
  .workspace-rail { display: none; }
  .sidebar-heading { height: 72px; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-shrink: 0; }
  .sidebar-brand { display: flex; align-items: center; gap: 10px; font-size: 17px; font-weight: 700; letter-spacing: -.03em; }
  .sidebar-create { padding: 0 16px 24px; }
  .sidebar-section { display: flex; align-items: center; justify-content: space-between; padding: 0 22px 10px; font-size: 11px; font-weight: 600; color: var(--muted-foreground); }
  .section-count { font-variant-numeric: tabular-nums; opacity: .7; }
  .chat-screen :global(.thread-scroll) { min-height: 0; flex: 1; overflow-y: auto; overscroll-behavior: contain; }
  .assistant-entry:focus-visible, .workspace-rail button:focus-visible { outline: 2px solid var(--ring); outline-offset: -2px; }
  .assistant-label { padding-top: 32px; }
  .assistant-entry { display: flex; align-items: center; gap: 9px; margin: 0 10px; padding: 8px 12px; font-size: 12px; border-radius: 6px; cursor: pointer; }
  .assistant-icon { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; background: color-mix(in oklab, var(--primary) 10%, var(--background)); color: var(--primary); }
  .assistant-dot { display: inline-block; width: 6px; height: 6px; background: #22835b; border-radius: 50%; flex-shrink: 0; }
  .sidebar-account { display: flex; gap: 10px; align-items: center; border-top: 1px solid var(--border); padding: 16px; }
  .sidebar-account p { font-size: 12px; font-weight: 600; }
  .sidebar-account span { font-size: 10px; color: var(--muted-foreground); }
  .chat-panel { --composer-glass-overhang: 44px; position: relative; display: flex; min-height: 0; min-width: 0; flex-direction: column; }
  .chat-panel.threads-open { display: none; }
  .chat-screen :global(.message-history) { width: 100%; padding: 24px 28px; gap: 22px; }
  .workspace :global(.message-history) { max-width: 56rem; margin-inline: auto; gap: 28px; }
  .workspace .composer-form { max-width: 52.5rem; margin-inline: auto; }
  .chat-screen :global(.message-row:focus-visible) { outline: 2px solid var(--ring); outline-offset: 3px; border-radius: 6px; }
  .conversation-tools { padding: 3px; border: 1px solid var(--border); border-radius: 12px; background: var(--background); box-shadow: 0 3px 14px rgb(0 0 0 / .08); }
  .conversation-tools:empty { display: none; }
  .date-divider { width: 100%; min-height: 44px; display: flex; align-items: center; justify-content: center; margin-bottom: 0; font-size: 10px; font-weight: 500; color: var(--muted-foreground); }
  .date-divider time { display: inline-flex; align-items: center; padding: 4px 12px; border: 1px solid var(--border); border-radius: 99px; background: color-mix(in oklab, var(--background) 94%, transparent); backdrop-filter: blur(8px); box-shadow: 0 1px 3px color-mix(in oklab, var(--foreground) 5%, transparent); }

  .bot-label { display: inline-flex; padding: 1px 4px; border-radius: 3px; background: var(--muted); font-size: 9px; color: var(--muted-foreground); }
  .composer-footer { position: absolute; inset: auto 0 0; z-index: 12; isolation: isolate; padding: 8px 28px 12px; pointer-events: none; }
  .composer-form { position: relative; pointer-events: auto; }
  .composer-glass { position: absolute; z-index: -1; inset: calc(-1 * var(--composer-glass-overhang)) 0 0; pointer-events: none; }
  .composer-glass span { position: absolute; inset: 0; }
  .glass-soft { backdrop-filter: blur(2px); mask-image: linear-gradient(to bottom, transparent, black 18px); }
  .glass-medium { backdrop-filter: blur(6px); mask-image: linear-gradient(to bottom, transparent 10px, black 38px); }
  .glass-strong { backdrop-filter: blur(12px); mask-image: linear-gradient(to bottom, transparent 26px, black 56px); }
  .composer-form { width: 100%; }
  .prompt-suggestions { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
  .empty-conversation { display: grid; justify-items: start; align-content: center; min-height: 280px; gap: 12px; }
  .empty-icon { display: flex; width: 56px; height: 56px; align-items: center; justify-content: center; border-radius: 12px; background: var(--muted); }
  .empty-conversation h2 { font-size: 20px; font-weight: 650; }
  .empty-conversation p { color: var(--muted-foreground); font-size: 13px; }

  /* DM: a conversation surface, distinct outgoing bubbles and compact input. */
  .direct .thread-sidebar { background: var(--background); }
  .dm-brand { display: inline-flex; color: var(--primary); }
  .direct .chat-panel { background: color-mix(in oklab, var(--muted) 65%, var(--background)); }
  .direct :global(.message-history) { padding: 20px 16px; gap: 20px; }
  .direct .date-divider { justify-content: center; }
  .direct .date-divider::before, .direct .date-divider::after { display: none; }
  .direct .date-divider time { color: var(--foreground); padding: 5px 12px; background: color-mix(in oklab, var(--foreground) 6%, var(--background)); border-radius: 99px; font-size: 10px; }

  .chat-screen :global(.message-attachment) { margin-top: 12px; }
  .direct .composer-footer { border-top: 0; background: transparent; padding: 8px 16px max(8px, env(safe-area-inset-bottom)); }
  .chat-screen :global(.transcript) { flex: 1; min-height: 0; }
  .chat-screen :global([data-slot="message-scroller-button"][data-direction="end"]) { bottom: var(--composer-height, 80px); z-index: 13; }
  @media (min-width: 768px) {
    .chat-panel.threads-open { display: flex; }
    .workspace { grid-template-columns: 64px 228px minmax(0, 1fr); }
    .direct { grid-template-columns: 300px minmax(0, 1fr); }
    .thread-sidebar, .thread-sidebar.mobile-open { display: flex; position: static; }
    .chat-screen :global(.mobile-navigation), .chat-screen :global([data-slot="chat-header-navigation"]) { display: none; }
    .workspace-rail { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 18px 8px; background: #251e31; color: #f8f5fc; }
    .workspace-mark { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 10px; background: #f8f5fc; color: #251e31; font-weight: 800; }
    .workspace-rail button { display: flex; flex-direction: column; align-items: center; gap: 5px; width: 46px; padding: 9px 0; border-radius: 9px; cursor: pointer; }
    .workspace-rail button span { font-size: 9px; }
    .workspace-rail .rail-active { background: #ffffff20; }
    .rail-bottom { margin-top: auto; }
  }
  @media (min-width: 1100px) {
    .chat-panel[data-memo-open="true"] :global(.transcript) { width: calc(100% - 296px); margin-inline-end: 296px; }
    .chat-panel[data-memo-open="true"] .composer-footer { margin-inline-end: 296px; }
  }
  @media (max-height: 600px) {
    .sidebar-heading { height: 56px; }
    .sidebar-create { padding-bottom: 12px; }
    .assistant-label { padding-top: 16px; }
    .sidebar-account { padding-block: 10px; }
    .workspace-rail { gap: 12px; padding-block: 12px; }
    .chat-screen :global(.message-history) { padding-block: 16px; gap: 18px; }
    .composer-footer { padding-block: 6px; }
  }
  @media (max-width: 767px) {
    .chat-screen { --chat-top-bar-height: 68px; height: 100dvh; min-height: 0; }
    .chat-screen :global([data-slot="message-scroller-button"][data-direction="end"]) { inset-inline-start: calc(100% - 38px); }
    .chat-screen :global(.mobile-navigation) { width: 44px; height: 44px; }
    .chat-screen :global(.message-history) { padding: 16px; }
    .date-divider { margin-bottom: 0; }

    .composer-footer, .direct .composer-footer { padding: 8px 12px max(10px, env(safe-area-inset-bottom)); border-top: 0; background: transparent; }
    .direct .composer-footer { padding: 6px 12px max(6px, env(safe-area-inset-bottom)); border-top: 0; background: transparent; }
  }
  .chat-screen :global([data-slot="message-scroller-viewport"]) { scroll-padding-top: min(var(--message-scroller-top-bar-height, 0px), var(--chat-top-bar-height)); scroll-padding-bottom: calc(var(--composer-height, 80px) + var(--composer-glass-overhang) + 16px); }
  .chat-screen :global(.message-history) { padding-top: calc(min(var(--message-scroller-top-bar-height, 0px), var(--chat-top-bar-height)) + 16px); padding-bottom: calc(var(--composer-height, 80px) + var(--composer-glass-overhang) + 16px); }
  .chat-screen.embedded { height: 100%; }
  @media (min-width: 768px) { .workspace.embedded { grid-template-columns: 228px minmax(0, 1fr); } }
</style>
