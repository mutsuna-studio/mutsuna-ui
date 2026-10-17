import { posix } from "node:path";
import ts from "typescript";

/** Resolve source modules using the same extensions emitted by svelte-package. */
function resolveSource(owner, specifier) {
  if (!specifier.startsWith(".")) return undefined;
  return posix.normalize(posix.join(posix.dirname(owner), specifier)).replace(/\.js$/, ".ts");
}

function entrySource(target) {
  const runtime = typeof target === "string" ? target : target.svelte ?? target.default;
  return runtime?.startsWith("./dist/") ? runtime.slice("./dist/".length).replace(/\.js$/, ".ts") : undefined;
}

/** Only modules forwarded by an entry count as an intentional public surface.
 * Ordinary imports used to implement an entry do not make helpers public. */
export function forwardedModules(source, owner) {
  const ast = ts.createSourceFile(owner, source, ts.ScriptTarget.Latest, true);
  const imports = new Map();
  for (const node of ast.statements) {
    if (!ts.isImportDeclaration(node) || !node.importClause || !ts.isStringLiteral(node.moduleSpecifier)) continue;
    const specifier = node.moduleSpecifier.text;
    const clause = node.importClause;
    if (clause.name) imports.set(clause.name.text, specifier);
    if (clause.namedBindings) {
      if (ts.isNamespaceImport(clause.namedBindings)) imports.set(clause.namedBindings.name.text, specifier);
      else for (const element of clause.namedBindings.elements) imports.set(element.name.text, specifier);
    }
  }
  const modules = new Set();
  const add = specifier => { const resolved = resolveSource(owner, specifier); if (resolved) modules.add(resolved); };
  for (const node of ast.statements) {
    if (ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) add(node.moduleSpecifier.text);
      else if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const element of node.exportClause.elements) {
          const specifier = imports.get((element.propertyName ?? element.name).text);
          if (specifier) add(specifier);
        }
      }
    } else if (ts.isExportAssignment(node) && ts.isIdentifier(node.expression)) {
      const specifier = imports.get(node.expression.text);
      if (specifier) add(specifier);
    }
  }
  return modules;
}

export function inspectPublicBoundaries(exports, sources) {
  const entries = new Set(Object.entries(exports).filter(([name]) => !name.includes("*")).map(([, target]) => entrySource(target)).filter(Boolean));
  const wildcardDirectories = new Set(Object.keys(exports).filter(name => name.endsWith("/*")).map(name => name.slice(2, -2)));
  const publicDirectories = new Set([...entries].filter(file => file.includes("/")).map(file => file.split("/")[0]));
  const forwarded = new Set();
  const violations = [];
  for (const entry of entries) {
    if (entry.startsWith("internal/")) violations.push(`Internal source is a public entry: ${entry}`);
    if (!entry.endsWith(".ts")) continue;
    if (!sources.has(entry)) { violations.push(`Missing public entry source: ${entry}`); continue; }
    for (const file of forwardedModules(sources.get(entry), entry)) {
      const throughEntry = entries.has(file);
      const sameComponent = entry.includes("/") && file.split("/")[0] === entry.split("/")[0];
      if (!throughEntry && !sameComponent && !file.startsWith("internal/")) {
        violations.push(`Public entry ${entry} must forward another component through its registered entry: ${file}`);
      }
      if (sameComponent || throughEntry) forwarded.add(file);
      if (file.startsWith("internal/")) violations.push(`Public entry ${entry} forwards internal source: ${file}`);
    }
  }
  // Export targets matter as well as names: ./button/* must not point at internal/.
  for (const [name, target] of Object.entries(exports)) {
    const targets = typeof target === "string" ? [target] : Object.values(target);
    if (name === "./internal" || name.startsWith("./internal/") || targets.some(value => posix.normalize(value).startsWith("dist/internal/"))) {
      violations.push(`Internal modules must not have a package export: ${name}`);
    }
  }
  const unindexedDeepImports = [];
  const deepImports = [];
  for (const file of sources.keys()) {
    if (file.startsWith("internal/") || file.endsWith(".d.ts")) continue;
    const directory = file.includes("/") ? file.split("/")[0] : undefined;
    if (directory && !publicDirectories.has(directory)) violations.push(`Private source belongs in internal/: ${file}`);
    if (!directory && !entries.has(file)) violations.push(`Unregistered root source belongs in internal/: ${file}`);
    if (directory && wildcardDirectories.has(directory)) {
      const specifier = `./${file.replace(/\.ts$/, ".js")}`;
      deepImports.push(specifier);
      if (!entries.has(file) && !forwarded.has(file)) unindexedDeepImports.push(specifier);
    }
  }
  return { violations, unindexedDeepImports: unindexedDeepImports.sort(), deepImports: deepImports.sort() };
}

export function validateLegacyDeepImports(actual, legacy, available = actual) {
  if (new Set(legacy).size !== legacy.length) throw new Error("Duplicate legacy deep imports");
  const additions = actual.filter(name => !legacy.includes(name));
  const removals = legacy.filter(name => !available.includes(name));
  if (additions.length) throw new Error(`New files exposed only by wildcard: ${additions.join(", ")}. Export public modules from their index; place implementation helpers in internal/.`);
  if (removals.length) throw new Error(`Legacy deep import paths changed: ${removals.join(", ")}. Preserve compatibility or explicitly review the public contract change.`);
}
