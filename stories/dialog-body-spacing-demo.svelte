<script lang="ts">
import {Button} from "@mutsuna/ui/button";
import * as Dialog from "@mutsuna/ui/dialog";
import * as ResponsiveDialog from "@mutsuna/ui/responsive-dialog";
let expanded=$state<Record<string,boolean>>({});
const cases=[{mode:"standard",label:"通常"},{mode:"desktop",label:"レスポンシブ・PC"},{mode:"mobile",label:"レスポンシブ・モバイル"}] as const;
</script>
{#snippet body(key:string)}
 <div class="grid gap-2"><p>本文の最後の操作とフッターの間隔を確認できます。</p><Button variant="outline" onclick={()=>expanded[key]=!expanded[key]}>入力欄を切り替える</Button>{#if expanded[key]}<p>追加の入力内容を表示しています。</p>{/if}</div>
{/snippet}
<div class="grid gap-4">
{#each cases as item (item.mode)}<section><h3 class="mb-2 font-semibold">{item.label}</h3><div class="flex flex-wrap gap-2">
 {#each [false,true] as override (override)}{@const key=item.mode+"-"+override}{@const title=item.label+"・"+(override?"下余白なし":"標準余白")}
 {#if item.mode==="standard"}
 <Dialog.Root><Dialog.Trigger>{#snippet child({props})}<Button {...props} variant="outline">{title}</Button>{/snippet}</Dialog.Trigger><Dialog.Content><Dialog.Header><Dialog.Title>{title}</Dialog.Title><Dialog.Description>標準は16px、pb-0指定は0pxです。</Dialog.Description></Dialog.Header><Dialog.Body class={override?"pb-0":undefined} data-padding-case={key}>{@render body(key)}</Dialog.Body><Dialog.Footer><Dialog.Close>{#snippet child({props})}<Button {...props}>閉じる</Button>{/snippet}</Dialog.Close></Dialog.Footer></Dialog.Content></Dialog.Root>
 {:else}
 <ResponsiveDialog.Root mode={item.mode}><ResponsiveDialog.Trigger>{#snippet child({props})}<Button {...props} variant="outline">{title}</Button>{/snippet}</ResponsiveDialog.Trigger><ResponsiveDialog.Content><ResponsiveDialog.Header><ResponsiveDialog.Title>{title}</ResponsiveDialog.Title><ResponsiveDialog.Description>標準は16px、pb-0指定は0pxです。</ResponsiveDialog.Description></ResponsiveDialog.Header><ResponsiveDialog.Body class={override?"pb-0":undefined} data-padding-case={key}>{@render body(key)}</ResponsiveDialog.Body><ResponsiveDialog.Footer><ResponsiveDialog.Close>{#snippet child({props})}<Button {...props}>閉じる</Button>{/snippet}</ResponsiveDialog.Close></ResponsiveDialog.Footer></ResponsiveDialog.Content></ResponsiveDialog.Root>
 {/if}
 {/each}</div></section>{/each}
</div>
