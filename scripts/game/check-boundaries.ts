import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const contracts = JSON.parse(fs.readFileSync(path.join(root, 'plan/data/module-contracts.json'), 'utf8')) as { modules: Record<string, { path: string; imports: string[] }>; pure_modules: string[] };
const forbidden = new Set(['window', 'document', 'Date', 'fetch', 'XMLHttpRequest', 'WebSocket', 'localStorage', 'sessionStorage', 'navigator', 'performance', 'crypto', 'globalThis', 'setTimeout', 'setInterval', 'requestAnimationFrame', 'process', 'require', 'eval', 'Function']);
export interface BoundaryIssue { file: string; line: number; code: string; message: string }
function moduleOf(file: string) {
  if (file === 'src/generated/content.json' || file === 'src/generated/runtime-manifest.json') return 'content';
  if (file === 'src/generated/contracts.d.ts') return 'contracts';
  return Object.entries(contracts.modules).find(([, value]) => file === value.path || file.startsWith(value.path + '/'))?.[0];
}
export function inspectSource(file: string, source: string): BoundaryIssue[] {
  const module = moduleOf(file), issues: BoundaryIssue[] = [];
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const pure = module !== undefined && contracts.pure_modules.includes(module);
  function issue(node: ts.Node, code: string, message: string) { issues.push({ file, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1, code, message }); }
  if (!module) return [{ file, line: 1, code: 'unowned_module', message: 'Source path has no module owner' }];
  function imported(node: ts.Node, specifier: string, typeOnly = false) {
    if (!specifier.startsWith('.')) {
      const allowed = module === 'content' && (specifier === 'ajv' || specifier.startsWith('ajv/'));
      if (pure && !allowed) issue(node, 'pure_external', specifier);
      if (module === 'ui' && /supabase|server|node:/.test(specifier)) issue(node, 'ui_persistence', specifier);
      return;
    }
    const targetPath = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
    const target = moduleOf(targetPath);
    if (!target || (target !== module && !(typeOnly && target === 'contracts') && !contracts.modules[module!]!.imports.includes(target))) issue(node, 'module_import', `${module} -> ${target ?? targetPath}`);
    if (module === 'content' && target === 'contracts' && !typeOnly) issue(node, 'content_dependency', 'Content may import generated contract types only');
  }
  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) imported(node, node.moduleSpecifier.text, !!node.importClause?.isTypeOnly);
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) imported(node, node.moduleSpecifier.text, node.isTypeOnly);
    if (ts.isImportEqualsDeclaration(node)) issue(node, 'require_import', 'Use checked ESM imports');
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteral(arg)) imported(node, arg.text);
      else issue(node, 'dynamic_import', 'Import path must be statically checkable');
    }
    if (pure && ts.isIdentifier(node) && forbidden.has(node.text)) {
      const parent = node.parent;
      const property = (ts.isPropertyAccessExpression(parent) && parent.name === node)
        || ((ts.isPropertyAssignment(parent) || ts.isPropertySignature(parent) || ts.isMethodSignature(parent)) && parent.name === node);
      if (!property) issue(node, 'pure_global', node.text);
    }
    if (pure && ts.isPropertyAccessExpression(node) && ((node.expression.getText(ast) === 'Math' && node.name.text === 'random') || node.name.text === 'localeCompare')) issue(node, 'nondeterministic', node.getText(ast));
    if (pure && ts.isElementAccessExpression(node) && node.expression.getText(ast) === 'Math') issue(node, 'computed_math', node.getText(ast));
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return issues;
}
export function checkWorkspace(): BoundaryIssue[] {
  const issues: BoundaryIssue[] = [];
  function collect(dir: string) {
    if (!fs.existsSync(path.join(root, dir))) return;
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const file = `${dir}/${entry.name}`;
      if (file === 'src/generated') continue;
      if (entry.isDirectory()) collect(file);
      else if (/\.(ts|tsx|mjs)$/.test(file)) issues.push(...inspectSource(file, fs.readFileSync(path.join(root, file), 'utf8')));
    }
  }
  collect('src'); collect('api');
  return issues;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const issues = checkWorkspace();
  console.log(JSON.stringify({ passed: issues.length === 0, issues }, null, 2));
  process.exitCode = issues.length ? 1 : 0;
}
