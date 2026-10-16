// Deterministic pre-checks for qa/test-cases.md. Free to run; the AI judge only reviews what these cannot decide.
import fs from 'node:fs';

const file = process.argv[2] ?? 'qa/test-cases.md';
const text = fs.readFileSync(file, 'utf8');
const problems = [];
const add = (id, msg) => problems.push(`${id}: ${msg}`);

const parts = text.split(/^(?=<a id="tc-\d+"><\/a>)/m).slice(1);
const required = ['**Category:**', '**Based on:**', '**Preconditions:**', '**Pass criteria:**', '**Fail criteria:**', '**Screenshot:**'];
const categories = new Set(['Happy Flow', 'Cart CRUD', 'Negative', 'Security', 'State', 'UI', 'Data Integrity']);
const seen = new Set();

for (const part of parts) {
  const anchor = part.match(/^<a id="tc-(\d+)">/)[1];
  const id = `TC-${anchor}`;
  const heading = part.match(/^## (TC-\d+) — (.+)$/m);
  if (!heading) add(id, 'missing "## TC-nnn — title" heading');
  else if (heading[1] !== id) add(id, `heading says ${heading[1]}`);
  if (seen.has(id)) add(id, 'duplicate id');
  seen.add(id);
  for (const field of required) if (!part.includes(field)) add(id, `missing ${field}`);
  const category = part.match(/\*\*Category:\*\* (.+)/)?.[1]?.trim();
  if (category && !categories.has(category)) add(id, `unknown category "${category}"`);
  const rows = part.split('\n').filter((l) => /^\| \d+ \|/.test(l));
  if (!rows.length) add(id, 'no step rows');
  rows.forEach((row, i) => {
    const cells = row.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length !== 3) add(id, `step ${i + 1} does not have 3 columns`);
    else if (!cells[1]) add(id, `step ${i + 1} has no expected outcome`);
    if (Number(cells[0]) !== i + 1) add(id, `step numbers are not sequential at row ${i + 1}`);
  });
  const shot = part.match(/\*\*Screenshot:\*\* \[([^\]]+)\]\(([^)]+)\)/);
  if (shot && (shot[1] !== shot[2] || !shot[2].startsWith('../evidence/screenshots/'))) add(id, 'screenshot label and link disagree or are outside ../evidence/screenshots/');
  if (/### Result|\*\*Actual outcome:\*\*/.test(part)) add(id, 'plan contains an executed result (Actual outcome); keep results out of the plan');
}

for (const link of text.matchAll(/\]\(#(tc-\d+)\)/g)) if (!seen.has(link[1].toUpperCase())) add(link[1], 'findings table links to a case that does not exist');
for (const c of categories) if (!new RegExp(`\\*\\*Category:\\*\\* ${c}\\b`).test(text)) add('coverage', `no case in category "${c}"`);
if (/^## Run Findings/m.test(text)) add('plan', 'plan file contains "Run Findings"; the generator must not claim results (move them to qa/history or evidence)');
if (/Phase \d CLI results|captured screenshot links/i.test(text)) add('plan', 'header claims executed results in a plan-only file');

console.log(`${parts.length} cases checked in ${file}`);
if (problems.length) {
  console.log(problems.map((p) => `- ${p}`).join('\n'));
  process.exit(1);
}
console.log('no deterministic problems');
