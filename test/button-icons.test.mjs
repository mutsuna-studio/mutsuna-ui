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
  for (const body of ['<Action><Save/></Action>', '<Action loading><Save/></Action>', '<Action>{#if busy}<span><Save/></span>{:else}<svg/>{/if}</Action>']) {
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
