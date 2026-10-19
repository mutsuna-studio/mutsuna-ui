<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import ClientReady from "@mutsuna/ui/client-ready";

const { Story } = defineMeta({
  title: "Foundations/Client Ready",
  component: ClientReady,
  tags: ["autodocs"],
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component: "ブラウザでのマウント後に中身を表示する部品です。SSR時とマウント前はfallbackを表示し、未指定なら何も表示しません。ブラウザ専用UIの表示切り替えに使います。通信の完了や外部SDKの準備完了を待つ機能ではありません。",
      },
    },
  },
});
</script>

<Story name="Default" asChild>
  <section class="grid max-w-xl gap-4">
    <div class="grid gap-2">
      <h2 class="text-base font-semibold">ブラウザでの初期化後に表示</h2>
      <p class="text-sm text-muted-foreground">ClientReadyは、ブラウザでコンポーネントがマウントされてから中身を表示します。ブラウザで動くUIを、サーバーで画面を生成する段階では表示しないために使います。</p>
    </div>
    <ClientReady>
      <div class="rounded-md border bg-card p-4 text-sm text-card-foreground">マウントが完了したため、中身を表示しています。</div>
      {#snippet fallback()}
        <div class="rounded-md border p-4 text-sm text-muted-foreground">ブラウザでの初期化を待っています。</div>
      {/snippet}
    </ClientReady>
    <p class="text-sm text-muted-foreground">SSR時とマウント前は代わりの表示（fallback）が使われます。Storybookではすぐにマウントされるため、通常は切り替わった後の表示だけが見えます。</p>
    <p class="text-sm text-muted-foreground">通信や画像の読み込み完了を待つ機能ではありません。また、ブラウザ専用コードのimportや実行を自動で安全にする機能でもありません。</p>
  </section>
</Story>
