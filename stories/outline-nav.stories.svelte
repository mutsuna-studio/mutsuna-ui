<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { OutlineNav } from "@mutsuna/ui/outline-nav";
import Preview from "./outline-nav-preview.svelte";
const { Story } = defineMeta({ title: "Components/Navigation/Outline Nav", component: OutlineNav, tags: ["autodocs"] });
</script>
<Story name="Navigate" asChild><Preview /></Story>
<Story name="States" asChild>
  <div class="flex gap-12">
    <OutlineNav items={[{ id: "a", label: "最初の項目" }, { id: "b", label: "長い項目名も折り返して表示します。内容をホバーやキーボードで確認できます。" }]} activeId="b" ariaLabel="長い項目の目次" />
    <OutlineNav items={[{ id: "a", label: "操作不可" }]} disabled ariaLabel="操作不可の目次" />
    <OutlineNav items={[]} ariaLabel="空の目次" />

  </div>
</Story>

<Story name="Long Document" asChild><Preview long /></Story>
