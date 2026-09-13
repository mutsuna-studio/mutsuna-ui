import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const inputSource = await readFile(new URL("../src/lib/input/input.svelte", import.meta.url), "utf8");
const textareaSource = await readFile(new URL("../src/lib/textarea/textarea.svelte", import.meta.url), "utf8");

test("input and textarea enable floating labels only when label is provided", () => {
  for (const source of [inputSource, textareaSource]) {
    assert.match(source, /Boolean\(label\)/);
    assert.doesNotMatch(source, /label \?\? placeholder/);
    assert.doesNotMatch(source, /floatingLabel/);
  }
});

test("textarea floats its label by opening the outline itself", () => {
  assert.match(textareaSource, /class="floating-textarea"/);
  assert.match(textareaSource, /<fieldset aria-hidden="true"><legend><span>\{label\}<\/span><\/legend><\/fieldset>/);
  assert.match(textareaSource, /\.floating-textarea:has\(textarea:focus\) legend/);
  assert.match(textareaSource, /--floating-outline: var\(--color-ring\)/);
  assert.match(textareaSource, /prefers-reduced-motion: reduce/);
});

test("placeholder remains independent from the floating label", () => {
  assert.match(inputSource, /placeholder=\{floating \? \(placeholder \|\| " "\) : placeholder\}/);
  assert.match(textareaSource, /placeholder=\{floating \? \(placeholder \|\| " "\) : placeholder\}/);
});
