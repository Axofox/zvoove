// Local AI judge for the test plan. Text only, no dependencies, needs Ollama running.
// Usage: node 08-scripts/judge-ollama.mjs [--model qwen2.5:7b] [--runs 3]
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const model = arg('model', 'qwen2.5:7b');
const runs = Number(arg('runs', 1));
const host = process.env.OLLAMA_HOST ?? 'http://localhost:11434';
const read = (p) => fs.readFileSync(p, 'utf8');

const standards = read('02-standards/quality-standards.md') + '\n' + read('02-standards/test-types.md');
const plan = read('04-test-cases/test-cases.md');
const cases = plan.split(/^(?=<a id="tc-\d+"><\/a>)/m).slice(1);
// The six criteria come from the rubric table, so the rubric stays the single source.
const rubric = read('05-judge/judge-rubric.md');
const rows = [...rubric.matchAll(/^\| (Observable|Atomic|Discriminating|Self-contained|Isolating|Minimal) \| (.+) \|$/gm)];
const criteria = rows.map((r) => r[1].replace(/-(\w)/g, (_, c) => c.toUpperCase()).replace(/^./, (c) => c.toLowerCase()));
const criteriaText = rows.map((r) => `- ${criteria[rows.indexOf(r)]}: ${r[2]}`).join('\n');
if (rows.length !== 6) throw new Error('Could not find the six criteria in 05-judge/judge-rubric.md');

const prompt = (testCase) => `You review ONE manual test case for an online shop checkout.
Score each criterion 0 (absent), 1 (weak) or 2 (solid):
${criteriaText}
Also say whether the case traces to a rule in the STANDARDS below (traceable: true/false).
Reply with JSON only: {${criteria.map((c) => `"${c}":n`).join(',')},"traceable":bool,"quote":"exact words from the case that justify your lowest score","topFix":"one sentence"}

STANDARDS:
${standards}

TEST CASE:
${testCase}`;

async function judge(testCase) {
  const res = await fetch(`${host}/api/chat`, {
    method: 'POST',
    body: JSON.stringify({
      model,
      stream: false,
      format: 'json',
      options: { temperature: 0, seed: 1, num_ctx: 8192 },
      messages: [{ role: 'user', content: prompt(testCase) }],
    }),
  }).catch(() => {
    throw new Error(`Cannot reach Ollama at ${host}. Start it with "ollama serve" and pull the model with "ollama pull ${model}".`);
  });
  if (!res.ok) throw new Error(`Ollama answered ${res.status}: ${await res.text()}`);
  const data = JSON.parse((await res.json()).message.content);
  const scores = criteria.map((c) => Math.max(0, Math.min(2, Number(data[c]) || 0)));
  return { scores, total: scores.reduce((a, b) => a + b, 0), traceable: data.traceable === true, quote: String(data.quote ?? ''), topFix: String(data.topFix ?? '') };
}

let lint = '';
let lintOk = true;
try {
  lint = execFileSync('node', ['08-scripts/lint-cases.mjs'], { encoding: 'utf8' });
} catch (e) {
  lint = e.stdout;
  lintOk = false;
}

const all = []; // all[run][case]
for (let r = 0; r < runs; r++) {
  const row = [];
  for (const [i, c] of cases.entries()) {
    process.stdout.write(`run ${r + 1}/${runs} case ${i + 1}/${cases.length}\r`);
    row.push(await judge(c));
  }
  all.push(row);
}

const id = (c) => c.match(/## (TC-\d+) — (.+)/).slice(1).join(' — ');
const lines = cases.map((c, i) => {
  const totals = all.map((run) => run[i].total);
  const first = all[0][i];
  const spread = Math.max(...totals) - Math.min(...totals);
  const traceable = all.every((run) => run[i].traceable);
  return { name: id(c), first, avg: totals.reduce((a, b) => a + b, 0) / totals.length, spread, traceable };
});
const mean = lines.reduce((a, l) => a + l.avg, 0) / lines.length;
const unstable = lines.filter((l) => l.spread > 1);
const weak = lines.filter((l) => l.avg < 9 || !l.traceable);
const verdict = !lintOk ? 'REVISE' : weak.length ? 'REVISE' : 'ACCEPT';

const report = `# Judge report — ${new Date().toISOString().slice(0, 10)}

Verdict: **${verdict}**  ·  model: \`${model}\`  ·  runs: ${runs}  ·  mean score: ${mean.toFixed(1)}/12

## Deterministic checks
\`\`\`
${lint.trim()}
\`\`\`

## Case scores
Order: ${criteria.join(', ')}. Spread is the gap between the best and worst run; above 1 means the judge disagrees with itself.

| Case | Scores | Avg /12 | Spread | Traceable | Top fix |
|---|---|---|---|---|---|
${lines.map((l) => `| ${l.name} | ${l.first.scores.join(' ')} | ${l.avg.toFixed(1)} | ${l.spread} | ${l.traceable ? 'yes' : 'NO'} | ${l.first.topFix.replace(/\|/g, '/')} |`).join('\n')}

## Cases to revisit
${weak.length ? weak.map((l) => `- ${l.name}: ${l.avg.toFixed(1)}/12${l.traceable ? '' : ', not traceable'}. "${l.first.quote.replace(/\n/g, ' ')}"`).join('\n') : 'None.'}

## Judge stability
${runs > 1 ? (unstable.length ? `Unstable cases (the rubric or the case is ambiguous): ${unstable.map((l) => l.name).join('; ')}` : 'All cases scored consistently across runs.') : 'Run with --runs 3 to measure stability.'}
`;
fs.writeFileSync('05-judge/judge-report.md', report);
console.log(`\n${verdict}: mean ${mean.toFixed(1)}/12, ${weak.length} to revisit, ${unstable.length} unstable. Written to 05-judge/judge-report.md`);
process.exit(verdict === 'ACCEPT' ? 0 : 1);
