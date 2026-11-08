import assert from 'node:assert/strict';
import test from 'node:test';
import { checkButtonIcons } from '../tooling/button-icons.mjs';
const imports = `<script lang="ts">import { Button as Action } from '@mutsuna/ui/button'; import Save from '@lucide/svelte/icons/save'; let busy: boolean = false;</script>\n`;

test('accepts managed icons, text, and unrelated components', () => {
  for (const body of ['<Action icon={Save} loading={busy}>保存</Action>', '<Action size="icon" icon={Save} aria-label="保存"/>', '<Save/>', '<Other><Save/></Other>', '<Action><span>保存</span></Action>']) {
    assert.deepEqual(checkButtonIcons(imports + body), []);
  }
});
test('rejects child icons with or without loading and through wrappers/branches', () => {
  for (const body of ['<Action><Save/></Action>', '<Action loading><Save/></Action>', '<Action loading><span class="loading-spinner"/></Action>', '<Action>{#if busy}<span><Save/></span>{:else}<svg/>{/if}</Action>']) {
    assert.ok(checkButtonIcons(imports + body).length > 0);
  }
  assert.equal(checkButtonIcons(imports + '<Action><Save/></Action>')[0].line, 2);
});
test('resolves named and namespace imports without guessing component names', () => {
  assert.equal(checkButtonIcons(`<script>import * as UI from '@mutsuna/ui'; import * as Icons from '@lucide/svelte';</script><UI.Button><Icons.Save/></UI.Button>`).length, 1);
  assert.equal(checkButtonIcons(`<script>import {Root as B} from '@mutsuna/ui/button'; import {Save as S} from 'lucide-svelte';</script><B><S/></B>`).length, 1);
  assert.equal(checkButtonIcons(`<script>import {Button} from 'other';</script><Button><svg/></Button>`).length, 0);
});
test('does not silently accept invalid syntax', () => {
  assert.throws(() => checkButtonIcons('<Button>'));
});

test('detects deep default Button imports without changing managed-icon usage', () => {
  const prefix = `<script>import Action from '@mutsuna/ui/button/button.svelte'; import Save from '@lucide/svelte/icons/save';</script>\n`;
  assert.equal(checkButtonIcons(prefix + '<Action loading><Save/></Action>')[0].line, 2);
  assert.deepEqual(checkButtonIcons(prefix + '<Action icon={Save} loading>保存</Action>'), []);
});

test('detects native spinner overlap while allowing exclusive and single-icon states', () => {
  const prefix = `<script>import Save from '@lucide/svelte/icons/save'; import Loader from '@lucide/svelte/icons/loader-circle';</script>\n`;
  for (const body of [
    '<button>{#if busy}<span class="loading loading-spinner"/>{/if}<Save/></button>',
    '<button><Loader class="animate-spin"/><Save/></button>',
  ]) assert.equal(checkButtonIcons(prefix + body).length, 1);
  for (const body of [
    '<button>{#if busy}<span class="loading loading-spinner"/>{:else}<Save/>{/if}</button>',
    '<button>{#if busy}<Loader class="animate-spin"/>{/if}{#if !busy}<Save/>{/if}</button>',
    '<button>{#await result}<Loader class="animate-spin"/>{:then value}<Save/>{:catch error}<Save/>{/await}</button>',
    '<button>{#each items as item}<Save/>{:else}<Loader class="animate-spin"/>{/each}</button>',
    '<button><Save class={busy ? "animate-spin" : ""}/></button>',
    '<button>{#if busy}<Loader class="animate-spin"/>{/if}保存</button>',
  ]) assert.deepEqual(checkButtonIcons(prefix + body), []);
});

test('recognizes Loading from its public named and namespace exports', () => {
  for (const declaration of [
    "import { Loading } from '@mutsuna/ui';",
    "import { Root as Loading } from '@mutsuna/ui/loading';",
    "import * as UI from '@mutsuna/ui';",
  ]) {
    const loading = declaration.includes('* as UI') ? 'UI.Loading' : 'Loading';
    const prefix = `<script>${declaration}import {Button} from '@mutsuna/ui/button';import Save from '@lucide/svelte/icons/save';</script>`;
    assert.equal(checkButtonIcons(prefix + `<button><${loading}/><Save/></button>`).length, 1);
    assert.equal(checkButtonIcons(prefix + `<Button loading><${loading}/>保存</Button>`).length, 1);
    assert.deepEqual(checkButtonIcons(prefix + `<button>{#if busy}<${loading}/>{:else}<Save/>{/if}</button>`), []);
  }
});
