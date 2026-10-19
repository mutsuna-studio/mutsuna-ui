<script lang="ts">
import { ChatMessageEditor, ChatRegenerateAction } from '@mutsuna/ui/chat-message';
const states = [
  { name: '通常', submitting: false, disabled: false, error: undefined },
  { name: '実行中', submitting: true, disabled: false, error: undefined },
  { name: 'エラー', submitting: false, disabled: false, error: '実行できませんでした。入力内容は残っています。' },
  { name: '操作不可・長文', submitting: false, disabled: true, error: undefined },
];
</script>

<div class="grid w-full max-w-3xl gap-8">
  {#each states as state}
    <section aria-label={state.name} class="grid gap-3">
      <h2 class="text-sm font-semibold">{state.name}</h2>
      <ChatMessageEditor value={state.disabled ? '長い質問を編集します。条件と目的を整理し、読み手に必要な情報を順番に説明してください。'.repeat(5) : '文章の構成を、具体例と一緒に考えてください。'} label={`${state.name}の編集`} description="この質問以降の会話を作り直します。" submitting={state.submitting} disabled={state.disabled} error={state.error} autofocus={false} onSubmit={() => {}} onCancel={() => {}} onStop={() => {}} />
      <ChatRegenerateAction generating={state.submitting} disabled={state.disabled} error={state.error} ariaLabel={`${state.name}の再生成`} onRegenerate={() => {}} onStop={() => {}} />
    </section>
  {/each}
</div>
