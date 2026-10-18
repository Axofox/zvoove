// Fails when a check reports a problem that the findings register (05-findings/) does not mention.
// Usage: node 04-scripts/check-register.mjs   (reads evidence/check-report.json and evidence/probe-report.json)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const argDir = process.argv.indexOf('--findings');
const findingsDir = argDir > -1 ? process.argv[argDir + 1] : path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '05-findings');
const statuses = ['unconfirmed', 'confirmed', 'fixed', 'rejected'];
const reports = ['evidence/check-report.json', 'evidence/probe-report.json'].filter((f) => fs.existsSync(f));
if (!reports.length) {
  console.error('No check reports in evidence/. Run check:observations and check:probes first.');
  process.exit(2);
}

const verdicts = Object.assign({}, ...reports.map((f) => JSON.parse(fs.readFileSync(f, 'utf8')).verdicts));
const read = (prefix) => fs.readdirSync(findingsDir).filter((f) => f.startsWith(prefix) && f.endsWith('.md')).map((f) => ({ file: f, text: fs.readFileSync(path.join(findingsDir, f), 'utf8') }));
const findings = read('F-').map((f) => ({ ...f, status: (/\*\*Status:\*\*\s*([a-z]+)/i.exec(f.text)?.[1] ?? 'unconfirmed').toLowerCase() }));
const decisions = read('D-');
const mentions = (entries, id) => entries.filter((e) => e.text.includes(`\`${id}\``)).map((e) => e.file);

const missing = [];
const stale = [];
const regressions = [];
for (const f of findings) if (!statuses.includes(f.status)) missing.push(`${f.file}: status "${f.status}" is not one of ${statuses.join(', ')}`);
for (const [id, verdict] of Object.entries(verdicts)) {
  const inFindings = mentions(findings, id);
  const inDecisions = mentions(decisions, id);
  if ((verdict === 'FAIL (stable)' || verdict === 'UNSTABLE') && !inFindings.length) missing.push(`${id} (${verdict}): add it to a finding in 05-findings/`);
  if (verdict === 'n/a' && !inDecisions.length) missing.push(`${id} (n/a): the shop lacks the feature; record the decision in a D- file`);
  for (const f of findings.filter((x) => x.text.includes(`\`${id}\``))) {
    const failing = verdict === 'FAIL (stable)' || verdict === 'UNSTABLE';
    if (f.status === 'fixed' && failing) regressions.push(`${id} (${verdict}) is back, but ${f.file} says fixed: a regression`);
    if (f.status === 'rejected' && failing) stale.push(`${id} still fails, but ${f.file} was rejected: change the check or the standard so it stops reporting it`);
  }
  if (verdict === 'pass' && inFindings.length) stale.push(`${id} passes now but ${inFindings.join(', ')} still lists it: a person reviews whether that finding is fixed`);
}

console.log(`Register check: ${Object.keys(verdicts).length} checks read from ${reports.join(' and ')}`);
if (stale.length) console.log(`\nFor a person to review (does not fail the run):\n- ${stale.join('\n- ')}`);
if (regressions.length) console.log(`\nRegressions (${regressions.length}):\n- ${regressions.join('\n- ')}`);
if (missing.length) console.log(`\nNot in the register (${missing.length}):\n- ${missing.join('\n- ')}`);
if (missing.length || regressions.length) process.exit(1);
console.log('\nEvery failing, unstable or n/a check is in the register, and nothing fixed has come back.');
