<script lang="ts">
  import { RangeCalendar } from "@mutsuna/ui/range-calendar";
  import { parseDate } from "@internationalized/date";
  import { FilterSelect } from "@mutsuna/ui/filter-select";
  import { Button } from "@mutsuna/ui/button";
  import { Input } from "@mutsuna/ui/input";
  import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@mutsuna/ui/dialog";

  import { CodeEditor, CodeDiff, type CodeDiffMode, type CodeEditorLanguage } from "@mutsuna/ui/code-editor";
  let diffMode = $state<CodeDiffMode>("split");
  let baseline = $state("const before = 1;");
  let diffLanguage = $state<CodeEditorLanguage>("javascript");
  let modified = $state("after");
  let diffLocked = $state(false);
  let diffEdits = $state(0);
  let code = $state("initial");
  let edits = $state(0);
  let locked = $state(false);
  let count = $state(0);
  let name = $state("");
</script>

<div class="grid max-w-sm gap-4">
  <Button id="counter" onclick={() => count += 1}>Count: {count}</Button>
  <Button disabled>Disabled</Button>
  <Input id="name" aria-label="Name" bind:value={name} />
  <output aria-live="polite">Hello {name}</output>
  <Dialog>
    <DialogTrigger>
      {#snippet child({ props })}<Button {...props}>Open dialog</Button>{/snippet}
    </DialogTrigger>
    <DialogContent><DialogTitle>Astro dialog</DialogTitle><p>Hydrated Svelte island</p></DialogContent>
  </Dialog>
</div>

<CodeEditor bind:value={code} onchange={() => edits++} readonly={locked} aria-label="Code" language="javascript" />
<span id="code-edits">{edits}</span>
<span id="code-value">{code}</span>
<Button onclick={() => code = "external"}>Replace code</Button>
<Button onclick={() => locked = !locked}>Toggle readonly</Button>
<CodeEditor value="disabled" disabled aria-label="Disabled code" />

<CodeDiff language={diffLanguage} original={baseline} bind:value={modified} bind:mode={diffMode} readonly={diffLocked} onchange={() => diffEdits++} aria-label="Diff" originalLabel="Original" modifiedLabel="Modified" />
<span id="diff-mode">{diffMode}</span><span id="diff-value">{modified}</span><span id="diff-edits">{diffEdits}</span>
<Button onclick={() => diffMode = diffMode === "split" ? "unified" : "split"}>Switch diff</Button>
<Button onclick={() => diffLocked = !diffLocked}>Lock diff</Button>
<Button onclick={() => { baseline = "baseline"; modified = "replacement"; }}>Replace diff</Button>

<Button onclick={() => diffLanguage = diffLanguage === "text" ? "javascript" : "text"}>Toggle diff language</Button>

<FilterSelect searchable label="担当者" ariaLabel="Astro multi filter" options={[{ value: "alpha", label: "Alpha" }, { value: "beta", label: "Beta" }]} />

<RangeCalendar scrollable aria-label="Astro date range" placeholder={parseDate("2026-06-01")} />
