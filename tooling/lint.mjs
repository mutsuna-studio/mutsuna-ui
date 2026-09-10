#!/usr/bin/env node
import { lstat, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { checkButtonIcons } from './button-icons.mjs';

const paths = process.argv.slice(2);
if (!paths.length || paths.includes('--help')) {
  console.log('Usage: mutsuna-ui-lint <file-or-directory> [...]\nChecks Svelte Button children for duplicate-icon risks.');
  process.exit(paths.includes('--help') ? 0 : 2);
}
const ignored = new Set(['node_modules', '.git', '.svelte-kit', 'dist', 'build', 'storybook-static']);
const visited = new Set();
async function check(path) {
  if (visited.has(path)) return;
  visited.add(path);
  const stat = await lstat(path);
  if (stat.isSymbolicLink()) return;
  if (stat.isDirectory()) {
    for (const name of (await readdir(path)).sort()) if (!ignored.has(name)) await check(join(path, name));
  } else if (path.endsWith('.svelte')) {
    for (const diagnostic of checkButtonIcons(await readFile(path, 'utf8'), path)) {
      console.error(`${path}:${diagnostic.line}:${diagnostic.column} mutsuna/button-icon ${diagnostic.message}`);
      process.exitCode = 1;
    }
  }
}
for (const path of paths) {
  try { await check(path); }
  catch (error) { console.error(`${path}: ${error.message}`); process.exitCode = 1; }
}
