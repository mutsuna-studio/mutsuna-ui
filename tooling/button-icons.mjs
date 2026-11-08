import { parse } from 'svelte/compiler';

const templateKeys = ['children', 'else', 'pending', 'then', 'catch'];

/** Detect shared Button child icons and overlapping native-button loading visuals. */
export function checkButtonIcons(source, filename = 'Component.svelte') {
  const ast = parse(source, { filename });
  const buttons = new Set();
  const icons = new Set();
  const namespaces = new Set();
  const loadingComponents = new Set();
  for (const script of [ast.instance, ast.module]) {
    for (const statement of script?.content.body ?? []) {
      if (statement.type !== 'ImportDeclaration' || statement.importKind === 'type') continue;
      const from = statement.source.value;
      for (const spec of statement.specifiers) {
        if (spec.importKind === 'type') continue;
        const name = spec.local.name;
        if (from === '@mutsuna/ui/button/button.svelte' && spec.type === 'ImportDefaultSpecifier') buttons.add(name);
        if (['@mutsuna/ui', '@mutsuna/ui/button'].includes(from)) {
          if (spec.imported?.name === 'Button' || (from.endsWith('/button') && spec.imported?.name === 'Root')) buttons.add(name);
          if (spec.type === 'ImportNamespaceSpecifier') buttons.add(`${name}.Button`);
          if (from.endsWith('/button') && spec.type === 'ImportNamespaceSpecifier') buttons.add(`${name}.Root`);
        }
        if (from === '@lucide/svelte' || from === 'lucide-svelte' || from.startsWith('@lucide/svelte/icons/')) {
          if (spec.type === 'ImportNamespaceSpecifier') namespaces.add(name);
          else icons.add(name);
        }
        if ((from === '@mutsuna/ui/loading' && ['Loading', 'Root'].includes(spec.imported?.name)) ||
          (from === '@mutsuna/ui' && spec.imported?.name === 'Loading')) loadingComponents.add(name);
        if (spec.type === 'ImportNamespaceSpecifier') {
          if (['@mutsuna/ui', '@mutsuna/ui/loading'].includes(from)) loadingComponents.add(`${name}.Loading`);
          if (from === '@mutsuna/ui/loading') loadingComponents.add(`${name}.Root`);
        }
      }
    }
  }
  const diagnostics = [];
  function diagnostic(node, message) {
    const before = source.slice(0, node.start);
    diagnostics.push({ line: before.split('\n').length, column: node.start - before.lastIndexOf('\n'), message });
  }
  function isIcon(node) {
    return (node.type === 'Element' && ['svg', 'img'].includes(node.name)) ||
      (node.type === 'InlineComponent' && (icons.has(node.name) || namespaces.has(node.name.split('.')[0])));
  }
  function isSpinner(node) {
    if (node.type === 'InlineComponent' && loadingComponents.has(node.name)) return true;
    const classes = node.attributes?.find(attribute => attribute.name === 'class');
    return Array.isArray(classes?.value) && classes.value.some(value => value.type === 'Text' && /(?:^|\s)(?:loading-spinner|animate-spin)(?:\s|$)/.test(value.data));
  }
  function condition(expression, truth) {
    if (expression.type === 'UnaryExpression' && expression.operator === '!') return condition(expression.argument, !truth);
    return [source.slice(expression.start, expression.end).trim(), truth];
  }
  function overlap(a, b) {
    const values = new Map();
    for (const [key, truth] of [...a, ...b]) {
      if (values.has(key) && values.get(key) !== truth) return false;
      values.set(key, truth);
    }
    return true;
  }
  function branches(node, guards, walk) {
    if (node.type === 'IfBlock') {
      walk(node.children, [...guards, condition(node.expression, true)]);
      walk(node.else, [...guards, condition(node.expression, false)]);
    } else if (node.type === 'AwaitBlock') {
      for (const phase of ['pending', 'then', 'catch']) walk(node[phase], [...guards, [`@await:${node.start}`, phase]]);
    } else if (node.type === 'EachBlock') {
      walk(node.children, [...guards, [`@each:${node.start}`, true]]);
      walk(node.else, [...guards, [`@each:${node.start}`, false]]);
    } else return false;
    return true;
  }
  function nativeVisuals(button, guards) {
    const visuals = [];
    function collect(node, conditions) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) { for (const child of node) collect(child, conditions); return; }
      if (node.type === 'Element' && node.name === 'button') return;
      const spinner = isSpinner(node);
      if (spinner || isIcon(node)) { visuals.push({ node, spinner, conditions }); return; }
      if (branches(node, conditions, collect)) return;
      for (const key of templateKeys) collect(node[key], conditions);
    }
    collect(button.children, guards);
    for (const spinner of visuals.filter(visual => visual.spinner)) {
      if (visuals.some(visual => visual !== spinner && overlap(spinner.conditions, visual.conditions))) {
        diagnostic(spinner.node, 'button内のスピナーと元アイコンが同時に表示されます。if/else等で排他表示にしてください。');
      }
    }
  }
  function visit(node, inside = false, guards = []) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { for (const child of node) visit(child, inside, guards); return; }
    const button = node.type === 'InlineComponent' && buttons.has(node.name);
    const icon = isIcon(node) && node.name !== 'img';
    if (inside && (icon || isSpinner(node))) {
      diagnostic(node, 'Buttonのアイコンは子要素に置かずiconプロパティへ渡してください。ローディング表示はloadingプロパティに任せてください。');
      return;
    }
    if (node.type === 'Element' && node.name === 'button') nativeVisuals(node, guards);
    if (branches(node, guards, (child, conditions) => visit(child, inside, conditions))) return;
    // Traverse template structure only, never expressions or attributes.
    for (const key of templateKeys) visit(node[key], inside || button, guards);
  }
  visit(ast.html);
  return diagnostics;
}
