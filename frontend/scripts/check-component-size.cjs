const fs = require('node:fs');
const path = require('node:path');
const violations = [];
let checked = 0;
function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { visit(file); continue; }
    if (!/\.(ts|html|css)$/.test(file)) continue;
    checked++;
    const lines = fs.readFileSync(file, 'utf8').trimEnd().split(/\r?\n/).length;
    if (lines >= 300) violations.push(`${file}: ${lines} líneas`);
  }
}
visit(path.join(__dirname, '../src/app/components'));
if (violations.length) {
  console.error(violations.join('\n'));
  process.exitCode = 1;
} else console.log(`${checked} archivos de componentes: todos tienen menos de 300 líneas.`);
