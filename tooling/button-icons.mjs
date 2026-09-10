import { parse } from 'svelte/compiler';

/** Detect known Lucide icons and inline SVG inside imported Mutsuna Button children. */
export function checkButtonIcons(source, filename = 'Component.svelte') {
  const ast = parse(source, { filename });
  const buttons = new Set();
  const icons = new Set();
  const namespaces = new Set();
  for (const script of [ast.instance, ast.module]) {
    for (const statement of script?.content.body ?? []) {
      if (statement.type !== 'ImportDeclaration' || statement.importKind === 'type') continue;
      const from = statement.source.value;
      for (const spec of statement.specifiers) {
        if (spec.importKind === 'type') continue;
        const name = spec.local.name;
        if (['@mutsuna/ui', '@mutsuna/ui/button'].includes(from)) {
          if (spec.imported?.name === 'Button' || (from.endsWith('/button') && spec.imported?.name === 'Root')) buttons.add(name);
          if (spec.type === 'ImportNamespaceSpecifier') buttons.add(`${name}.Button`);
          if (from.endsWith('/button') && spec.type === 'ImportNamespaceSpecifier') buttons.add(`${name}.Root`);
        }
        if (from === '@lucide/svelte' || from === 'lucide-svelte' || from.startsWith('@lucide/svelte/icons/')) {
          if (spec.type === 'ImportNamespaceSpecifier') namespaces.add(name);
          else icons.add(name);
        }
      }
    }
  }
  const diagnostics = [];
  function visit(node, inside = false) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { for (const child of node) visit(child, inside); return; }
    const button = node.type === 'InlineComponent' && buttons.has(node.name);
    const icon = (node.type === 'Element' && node.name === 'svg') ||
      (node.type === 'InlineComponent' && (icons.has(node.name) || namespaces.has(node.name.split('.')[0])));
    if (inside && icon) {
      const before = source.slice(0, node.start);
      diagnostics.push({ line: before.split('\n').length, column: node.start - before.lastIndexOf('\n'),
        message: 'Buttonのアイコンは子要素に置かずiconプロパティへ渡してください。ローディング表示はloadingプロパティに任せてください。' });
      return;
    }
    // Traverse template structure only, never expressions or attributes.
    for (const key of ['children', 'else', 'pending', 'then', 'catch']) visit(node[key], inside || button);
  }
  visit(ast.html);
  return diagnostics;
}
