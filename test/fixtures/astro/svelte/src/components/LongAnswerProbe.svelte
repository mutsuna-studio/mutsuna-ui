<script lang="ts">
import { ChatMessage } from '@mutsuna/ui/chat-message';
import * as Scroller from '@mutsuna/ui/message-scroller';
import { Button } from '@mutsuna/ui/button';
let copied = $state(false);
let additions = $state(0);
const paragraph = '長い回答では、結論と理由を分けて説明します。見出しと段落を使うと、必要な内容を探して読み返すことができます。途中の内容を読んでいる間に回答が追加されても、読んでいる位置を保ちます。';
</script>

<section aria-label="Astro long answer">
  <Button onclick={() => additions++}>Append answer paragraph</Button>
  <output data-long-additions>{additions}</output>
  <div style="height:440px;max-width:800px;margin-top:12px">
    <Scroller.Provider autoScroll defaultScrollPosition="start">
      <Scroller.Root>
        <Scroller.Viewport aria-label="Long answer history">
          <Scroller.Content class="p-4 pb-16" aria-live="off">
            <Scroller.Item messageId="long-answer" class="[content-visibility:visible]">
              <ChatMessage layout="timeline" author="Long answer assistant" prose>
                {#snippet footerActions()}<Button onclick={() => copied = true}>Copy complete answer</Button><output role="status">{copied ? 'Answer copied' : ''}</output>{/snippet}
                <h2>回答の結論</h2>
                <p>{paragraph}</p>
                <blockquote><p>全文を折りたたまず、見出しと余白で読みやすくします。</p></blockquote>
                {#each Array.from({ length: 10 }, (_, i) => i) as index}
                  <h3>確認すること {index + 1}</h3><p>{paragraph.repeat(3)}</p>
                {/each}
                <ul><li>必要な情報を見つける</li><li>読み位置を維持する</li></ul>
                <!-- svelte-ignore a11y_no_noninteractive_tabindex (Horizontal code scrolling must work with the keyboard.) -->
                <pre role="region" tabindex="0" aria-label="Long answer code"><code>{'const answer = "' + 'long_code_line_'.repeat(30) + '";\nrender(answer);'}</code></pre>
                <!-- svelte-ignore a11y_no_noninteractive_tabindex (Horizontal table scrolling must work with the keyboard.) -->
                <div data-slot="chat-message-scroll" role="region" aria-label="Long answer comparison" tabindex="0">
                  <table style="min-width:900px"><caption>表示方法の比較</caption><thead><tr><th scope="col">構成</th><th scope="col">用途</th><th scope="col">注意点</th></tr></thead><tbody><tr><th scope="row">見出しと段落</th><td>長文の説明</td><td>段落を分ける</td></tr></tbody></table>
                </div>
                {#each Array.from({ length: additions }, (_, i) => i) as index}<p data-long-added>{index + 1}: {paragraph}</p>{/each}
              </ChatMessage>
            </Scroller.Item>
          </Scroller.Content>
        </Scroller.Viewport>
        <Scroller.Button behavior="instant" />
      </Scroller.Root>
    </Scroller.Provider>
  </div>
</section>
