// Compares the checker's verdicts with the human-confirmed answer key. Exit 1 on any difference.
// Usage: node 04-scripts/compare-expected.mjs <evidence/check-report.json> <expected/<user>.json>
import fs from 'node:fs';

const [reportFile, expectedFile] = process.argv.slice(2);
const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
const expected = JSON.parse(fs.readFileSync(expectedFile, 'utf8'));
const lines = [];
for (const [id, want] of Object.entries(expected.verdicts)) {
  const got = report.verdicts[id] ?? 'missing';
  if (got !== want) lines.push(`${id}: expected ${want}, got ${got}`);
}
if (report.runs < expected.minRuns) lines.push(`needs at least ${expected.minRuns} runs, got ${report.runs}`);
console.log(lines.length ? `Differs from the answer key:\n${lines.join('\n')}` : `Matches the answer key (${Object.keys(expected.verdicts).length} checks, ${report.runs} runs).`);
process.exit(lines.length ? 1 : 0);
