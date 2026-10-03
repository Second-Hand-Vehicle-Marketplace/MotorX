// Regenerate the source navigation document with: node docs/generate-codebase-index.cjs
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const slash = (value) => value.replaceAll('\\', '/');
const files = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'coverage', '.git', 'public'].includes(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(?:tsx?|mjs)$/.test(entry.name)) files.push(full);
  }
}
for (const directory of ['apps', 'packages']) walk(path.join(root, directory));
const escape = (value) => value.replaceAll('|', '\\|').replace(/\s+/g, ' ').trim();
function purpose(file) {
  if (/\.test\./.test(file)) return 'Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.';
  if (/\.routes\./.test(file)) return 'Route definitions: inspect the listed registrations and guards. Express routes are mounted by backend app.ts; frontend route arrays are metadata, while app/App.tsx mounts the actual React routes.';
  if (/\.controller\./.test(file)) return 'HTTP boundary: reads request values, calls services, and sends responses.';
  if (/\.repository\./.test(file)) return 'Persistence operations: reads or writes stored records for the owning feature.';
  if (/\.model\./.test(file) || file.endsWith('/models.ts')) return 'Database shapes, Mongoose models, and indexes. Models describe stored documents; they do not open the database connection.';
  if (/\.validation\.|\.schema\.|Schemas\.ts$/.test(file)) return 'Validation rules and related types; these reject or normalize unsupported input.';
  if (/\.service\./.test(file)) return 'Business operations and orchestration; see each function and its direct calls below.';
  if (/\/pipeline\//.test(file)) return 'Worker transformation stage or helper. Follow imports from uploadJob.service.ts to establish which stages actually run.';
  if (/\/jobs\//.test(file)) return 'Background job handler or scheduled maintenance operation.';
  if (/Api\.ts$/.test(file)) return 'Frontend API adapter: translates UI requests into HTTP calls and extracts response data.';
  if (/\/pages\/|\/components\/|\/layout\//.test(file)) return 'React UI, page, or layout. Component-local functions handle interactions and state changes.';
  if (/\/config\//.test(file)) return 'Configuration, validated environment settings, or a shared external-service client.';
  if (/\/middleware\//.test(file)) return 'Express request middleware: authentication, authorization, validation, limits, or error handling.';
  if (/\/types\/|\/dtos\/|\/interfaces\//.test(file)) return 'Type contracts; these describe values for TypeScript and are not database writes or runtime checks by themselves.';
  if (file.endsWith('/index.ts')) return 'Module entry point or re-export barrel; inspect exported symbols/import targets.';
  return 'Supporting application module; use the symbols, comments, and direct calls below to follow its role.';
}
let namedCount = 0;
const blocks = [];
for (const absolute of files.sort()) {
  const file = slash(path.relative(root, absolute));
  const source = fs.readFileSync(absolute, 'utf8');
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const functions = [], tests = [], registrations = [], exports = [];
  const line = (node) => tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1;
  function comment(node) {
    let target = node;
    if (ts.isVariableDeclaration(node)) target = node.parent.parent;
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      target = node.parent;
      if (ts.isVariableDeclaration(target)) target = target.parent.parent;
    }
    const ranges = ts.getLeadingCommentRanges(source, target.getFullStart()) || [];
    return escape(ranges.map(({ pos, end }) => source.slice(pos, end).replace(/^\/\/\s?/gm, '').replace(/^\/\*\*?|\*\/$/g, '').replace(/^\s*\*\s?/gm, '')).join(' '));
  }
  function getName(node) {
    if (node.name) return node.name.getText(tree);
    if (ts.isVariableDeclaration(node.parent) || ts.isPropertyAssignment(node.parent)) return node.parent.name.getText(tree);
    return null;
  }
  function callsIn(node) {
    const calls = new Set();
    function visit(child) {
      if (child !== node && (ts.isFunctionDeclaration(child) || ts.isArrowFunction(child) || ts.isFunctionExpression(child) || ts.isMethodDeclaration(child))) return;
      if (ts.isCallExpression(child)) {
        const name = child.expression.getText(tree);
        if (/^[\w.$?!]+$/.test(name)) calls.add(name);
      }
      ts.forEachChild(child, visit);
    }
    visit(node);
    return [...calls];
  }
  function visit(node, parents = []) {
    const callable = ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isMethodDeclaration(node) || ts.isConstructorDeclaration(node);
    let next = parents;
    if (callable) {
      const name = ts.isConstructorDeclaration(node) ? 'constructor' : getName(node);
      if (name) {
        const qualified = [...parents, name].join('.');
        functions.push({ name: qualified, line: line(node), params: node.parameters.map((parameter) => parameter.name.getText(tree)).join(', '), comment: comment(node), calls: callsIn(node) });
        next = [...parents, name];
      }
    }
    if (ts.isCallExpression(node)) {
      const expression = node.expression.getText(tree);
      const first = node.arguments[0];
      if (/^(describe|it|test)(\.|$)/.test(expression) && first && (ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first))) tests.push(`${expression}: ${first.text} (line ${line(node)})`);
      if (/^(\w+Router|app)\.(get|post|patch|delete|put|use)$/.test(expression) && first && ts.isStringLiteral(first)) registrations.push(`${expression}(${JSON.stringify(first.text)}) — line ${line(node)}`);
    }
    if (node.parent === tree && node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      if (node.name) exports.push(node.name.getText(tree));
      if (ts.isVariableStatement(node)) for (const declaration of node.declarationList.declarations) exports.push(declaration.name.getText(tree));
    }
    ts.forEachChild(node, (child) => visit(child, next));
  }
  visit(tree);
  namedCount += functions.length;
  let block = `**[${file}](../${file})**\n\n${purpose(file)}\n`;
  if (exports.length) block += `\nExported declarations: ${exports.map((name) => '`' + escape(name) + '`').join(', ')}.\n`;
  if (functions.length) {
    block += '\n| Function/component | Parameters | Explanation and direct calls |\n| --- | --- | --- |\n';
    for (const fn of functions) block += `| \`${escape(fn.name)}\` (line ${fn.line}) | ${escape(fn.params) || 'None'} | ${fn.comment || 'No leading explanation comment; read the linked implementation.'}${fn.calls.length ? ' Direct named calls: ' + fn.calls.map((call) => '`' + escape(call) + '`').join(', ') + '.' : ''} |\n`;
  } else block += '\nNo named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.\n';
  if (registrations.length) block += '\nHTTP registrations (relative to the mount in `app.ts`):\n\n' + registrations.map((text) => '- ' + text).join('\n') + '\n';
  if (tests.length) block += '\nDeclared test groups and cases:\n\n' + tests.map((text) => '- ' + escape(text)).join('\n') + '\n';
  blocks.push(block);
}
const intro = `**MotorX file and function index**\n\nStart with [the walkthrough](CODEBASE_WALKTHROUGH.md). This index covers ${files.length} TypeScript/TSX/MJS source and configuration files under apps and packages, with ${namedCount} named functions, components, and methods, including local named helpers. Generated dependencies, build outputs, public binary assets, and private environment files are excluded.\n\nPaths are relative to D:/MotorX/MotorX. Line numbers describe this working-tree snapshot and may change. Named callbacks assigned to variables are included; anonymous effect/event callbacks are part of their containing implementation, not separately named functions. Test cases are listed by their declared names. Direct calls are syntactic navigation aids, not a complete runtime call graph; calls inside nested anonymous callbacks are omitted from that list. Leading source comments are reproduced as explanations and are not independent verification.\n\nRoot configuration, infrastructure, non-JavaScript scripts, generated reports, and runtime flows are explained in the walkthrough. This includes the uncommitted admin collection/account changes from the preceding task; their presence does not establish deployment or a passing test run.\n\nRegenerate with \`node docs/generate-codebase-index.cjs\`.\n\n`;
fs.writeFileSync(path.join(__dirname, 'CODEBASE_FILE_FUNCTION_INDEX.md'), intro + blocks.join('\n---\n\n'));
console.log(`Indexed ${files.length} files and ${namedCount} named functions.`);
