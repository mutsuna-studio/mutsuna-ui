<script lang="ts">
import { OutlineNav } from "@mutsuna/ui/outline-nav";
import type { OutlineNavItem } from "@mutsuna/ui/outline-nav";
let { long = false }: { long?: boolean } = $props();
let selectedId = $state<string>();
const activeId = $derived(selectedId ?? (long ? "24" : "intro"));
const basic: OutlineNavItem[] = [{ id: "intro", label: "はじめに：伝えたいことを整理する" }, { id: "structure", label: "読みやすい構成を考える" }, { id: "next", label: "次の一歩を決める" }];
const chapters = ["目的を整理する", "読み手を知る", "構成を考える", "冒頭を書く", "本文を整える", "表現を磨く", "全体を見直す", "公開に備える"];
const sections = ["", "伝えたいことを一つに絞る", "読み手にとっての変化を示す", "具体例を添えて説明する", "情報の優先順位を決める", "次の行動につなげる"];
const items = $derived(long ? Array.from({ length: 48 }, (_, i) => ({ id: String(i), label: i % 6 === 0 ? chapters[Math.floor(i / 6)] : sections[i % 6], level: (i % 6 === 0 ? 1 : i % 3 === 0 ? 3 : 2) as 1 | 2 | 3 })) : basic);
</script>
<div class="flex h-[min(36rem,80dvh)] max-w-2xl items-center justify-between gap-6 rounded-xl border border-border p-6">
  <div><p class="text-xs text-muted-foreground">{long ? "48項目 · H1 / H2 / H3" : "選択中"}</p><p class="mt-2 text-sm">{items.find(item => item.id === activeId)?.label ?? "線を選んで移動"}</p><p class="mt-4 text-xs text-muted-foreground">線にホバーして内容を確認し、クリックすると選択できます。</p></div>
  <div class="flex h-full max-h-80"><OutlineNav {items} {activeId} onNavigate={id => selectedId = id} /></div>
</div>
