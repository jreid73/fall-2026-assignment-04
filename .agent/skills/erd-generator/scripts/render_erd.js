const { spawnSync } = process.getBuiltinModule('node:child_process');
const fs = process.getBuiltinModule('node:fs');
const path = process.getBuiltinModule('node:path');

const input = path.resolve(process.argv[2] || 'docs/architecture/schema.mmd');
const output = path.resolve('docs/architecture/erd.svg');

function fail(trace) {
  console.log(`SYNTAX_ERROR:\n${trace}`);
  process.exit(1);
}

if (!fs.existsSync(input)) {
  fail(`Input file not found: ${input}`);
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.rmSync(output, { force: true });

const result = spawnSync('npx', ['mmdc', '-i', input, '-o', output, '--quiet'], {
  encoding: 'utf8',
});

if (result.error || result.status !== 0 || !fs.existsSync(output)) {
  fail(result.stderr || (result.error ? String(result.error) : result.stdout) || 'Unknown error');
}

console.log('SUCCESS');
process.exit(0);