// Groups the exploratory runs by meaning and reports how often each observation came back.
// Key = charter : category : page path. The summaries differ in wording between runs, so they are not compared.
// Usage: node 04-scripts/aggregate-explorations.mjs <dir with run-NN-<charter>.json files>
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2] ?? 'evidence/explore';
const files = fs.existsSync(dir) ? fs.readdirSync(dir, { recursive: true }).filter((f) => String(f).endsWith('.json')) : [];
if (!files.length) {
  console.error(`No exploration files in ${dir}`);
  process.exit(2);
}
const sessions = files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const findingsDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', '05-findings');
const register = fs.existsSync(findingsDir)
  ? fs.readdirSync(findingsDir).filter((f) => f.endsWith('.md')).map((f) => ({ file: f, text: fs.readFileSync(path.join(findingsDir, f), 'utf8') }))
  : [];

const byCharter = new Map();
for (const s of sessions) byCharter.set(s.charter, [...(byCharter.get(s.charter) ?? []), s]);

const groups = new Map();
for (const s of sessions) {
  for (const o of [...s.observations, ...(s.codeDetected ?? []).map((c) => ({ ...c, path: '(any page)' }))]) {
    const key = `${s.charter}:${o.category}:${o.path}`;
    const g = groups.get(key) ?? { key, runs: new Set(), example: o };
    g.runs.add(s.run);
    groups.set(key, g);
  }
}

const rows = [...groups.values()].map((g) => {
  const total = new Set(byCharter.get(g.key.split(':')[0]).map((s) => s.run)).size;
  const seen = g.runs.size;
  const cls = total < 2 ? 'single run' : seen === total ? 'finding' : seen === 1 ? 'candidate' : 'intermittent';
  const known = register.filter((r) => r.text.includes(`Explorer key: ${g.key}`)).map((r) => r.file);
  return { ...g, seen, total, cls, known };
}).sort((a, b) => b.seen / b.total - a.seen / a.total);

const metric = [...byCharter.entries()].map(([charter, list]) => {
  const sum = (fn) => list.reduce((a, s) => a + fn(s), 0);
  return `| ${charter} | ${list.length} | ${(sum((s) => s.steps.length) / list.length).toFixed(1)} | ${sum((s) => s.observations.length)} | ${sum((s) => s.rejected.length)} | ${sum((s) => s.invalidResponses)} | ${sum((s) => s.repeats ?? 0)} |`;
});

const table = rows.map((r) => `| ${r.key} | ${r.seen}/${r.total} | ${r.cls} | ${String(r.example.summary).replace(/\|/g, '/')} | "${String(r.example.quote).replace(/\|/g, '/').slice(0, 60)}" | ${r.known.join(', ') || '**not in the register**'} |`);
const newOnes = rows.filter((r) => !r.known.length).length;
const report = `# Exploration report\n\nSessions: ${sessions.length}, model ${sessions[0].model}, Ollama ${sessions[0].ollamaVersion}\n\n## What came back\n\n| Key (charter:category:page) | Seen | Class | Example summary | Quote | Register |\n|---|---|---|---|---|---|\n${table.join('\n') || '| (nothing reported) | | | | | |'}\n\n${newOnes} group(s) are not in the register: a person decides what each one is.\n\n## How the model behaved\n\n| Charter | Sessions | Avg steps | Accepted observations | Rejected (quote not on the page) | Invalid replies | Repeated actions (not executed) |\n|---|---|---|---|---|---|---|\n${metric.join('\n')}\n\nA rejected observation is one the model reported without being able to quote it from the page. A high number means the model is guessing.\n`;
console.log(report);
fs.mkdirSync('evidence', { recursive: true });
fs.writeFileSync('evidence/explore-report.md', report);
