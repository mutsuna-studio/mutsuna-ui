<script lang="ts">
import * as Message from "@mutsuna/ui/message";
</script>
<Message.Root role="article" aria-label="操作対象" tabindex={-1}>
  <Message.Content><p>メッセージ本文</p><button type="button">添付ファイル</button><Message.Actions onCopy={() => {}} /></Message.Content>
</Message.Root>
<button type="button">外側</button>
