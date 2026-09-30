<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { CodeEditor, CodeDiff, type CodeDiffMode } from "@mutsuna/ui/code-editor";
  import { Button } from "@mutsuna/ui/button";
  const { Story } = defineMeta({ title: "Components/Inputs/CodeEditor", component: CodeEditor, tags: ["autodocs"] });
</script>
<script lang="ts">let code = $state('const greeting = "Hello";\nconsole.log(greeting);');
let diffMode = $state<CodeDiffMode>("split");
let diffReadonly = $state(false);
const original = 'function greet(name) {\n  return "Hello, " + name;\n}\n\nconsole.log(greet("World"));';
let modified = $state('function greet(name) {\n  return `こんにちは、${name}さん`;\n}\n\nconsole.log(greet("むつな"));\nconsole.log("Welcome!");');
</script>
<Story name="States" asChild>
  <div class="grid w-full max-w-2xl gap-6">
    <CodeEditor bind:value={code} language="javascript" aria-label="JavaScript" />
    <CodeEditor value={'{ "enabled": true }'} language="json" readonly aria-label="読み取り専用" height="8rem" />
    <CodeEditor value="変更できません" disabled aria-label="無効" height="6rem" />
    <CodeEditor value="invalid code" aria-invalid aria-label="エラー" height="6rem" />
    <div class="max-w-64"><CodeEditor value="長い行でもコンテナの幅に合わせて折り返して表示できます。長い行でもコンテナの幅に合わせて折り返して表示できます。" lineWrapping aria-label="狭い幅" height="8rem" /></div>
  </div>
</Story>

<Story name="Diff" parameters={{ controls: { disable: true } }} asChild>
  <div class="grid w-full max-w-5xl gap-4">
    <CodeDiff {original} bind:value={modified} bind:mode={diffMode} readonly={diffReadonly} language="javascript" lineWrapping>
      {#snippet actions()}
        <Button size="xs" variant="ghost" aria-pressed={diffReadonly} onclick={() => diffReadonly = !diffReadonly}>読み取り専用</Button>
      {/snippet}
    </CodeDiff>
    <p class="text-sm text-muted-foreground">変更前は固定です。変更後を編集すると差分も更新されます。</p>
  </div>
</Story>
