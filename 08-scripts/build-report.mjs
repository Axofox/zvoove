// Builds reports/index.html from deterministic results and captured evidence.
import fs from 'node:fs';
import path from 'node:path';

const RES = path.resolve('evidence'), OUT = path.resolve('reports');
fs.mkdirSync(OUT, { recursive: true });

const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ids = fs.readdirSync(RES).filter((f) => /^TC-.*\.json$/.test(f)).sort();
const cases = ids.map((f) => {
  const rec = JSON.parse(fs.readFileSync(path.join(RES, f)));
  const deterministicFailures = rec.deterministicFailures ?? [];
  return { ...rec, deterministicFailures, status: deterministicFailures.length ? 'FAIL' : 'PASS' };
});
const manualPath = path.join(RES, 'manual-run-2026-10-15.json');
const manualRun = fs.existsSync(manualPath) ? JSON.parse(fs.readFileSync(manualPath, 'utf8')) : null;
const manualCases = manualRun?.cases ?? [];
const count = (status) => cases.filter((c) => c.status === status).length;
const badge = (s = 'n/a') => `<span class="b ${s.toLowerCase()}">${esc(s)}</span>`;

const body = cases.map((c) => {
  return `<details id="${esc(c.id.toLowerCase())}" ${c.status === 'FAIL' ? 'open' : ''}><summary>${badge(c.status)} <b>${esc(c.id)}</b> ${esc(c.title)} <small>${c.deterministicFailures.length} failed checks</small></summary>
<p>${c.deterministicFailures.length ? `${c.deterministicFailures.length} deterministic check(s) failed.` : 'All recorded deterministic checks passed.'}</p>
${c.deterministicFailures.length ? `<ul>${c.deterministicFailures.map((failure) => `<li>${esc(failure)}</li>`).join('')}</ul>` : ''}
<table><tr><th>#</th><th>Action</th><th>Expected</th><th>Checks</th></tr>
${c.steps.map((s) => `<tr><td>${s.n}</td><td>${esc(s.action)}</td><td>${esc(s.expected)}</td>
<td>${s.error ? `<div class="bad">${esc(s.error)}</div>` : ''}${s.checks.map((k) => `<div class="${k.ok ? 'ok' : 'bad'}">${k.ok ? '✓' : '✗'} ${esc(k.name)}${k.detail ? ` <small>${esc(k.detail)}</small>` : ''}</div>`).join('')}</td></tr>`).join('')}
</table></details>`;
}).join('\n');
const findings = cases.filter((c) => c.status === 'FAIL');
const findingsIndex = findings.length
  ? `<h2>Failed cases</h2><ul>${findings.map((c) => `<li>${badge(c.status)} <a href="#${esc(c.id.toLowerCase())}">${esc(c.id)} — ${esc(c.title)}</a></li>`).join('')}</ul>`
  : '';
const manualCounts = (status) => manualCases.filter((c) => c.status === status).length;
const manualBody = manualCases.map((testCase) => `<details id="${esc(testCase.id.toLowerCase())}" ${testCase.status === 'FAIL' ? 'open' : ''}>
<summary>${badge(testCase.status)} <b>${esc(testCase.id)}</b> ${esc(testCase.title)} <small>${esc(testCase.severity ?? '')}</small></summary>
<p>${esc(testCase.summary)}</p>
<table><tr><th>#</th><th>Action</th><th>Expected</th><th>Observed</th><th>Result</th></tr>
${testCase.steps.map((step, index) => `<tr><td>${index + 1}</td><td>${esc(step.action)}</td><td>${esc(step.expected)}</td><td>${esc(step.observed)}</td><td>${badge(step.status)}</td></tr>`).join('')}
</table>
${testCase.evidence?.length ? `<p>Evidence: ${testCase.evidence.map((file) => `<a href="../evidence/${esc(file)}">${esc(file.split('/').at(-1))}</a>`).join(', ')}</p>` : '<p>No screenshot file captured for this case.</p>'}
</details>`).join('\n');
const manualSection = manualRun ? `<section><h2>Manual browser run — ${esc(manualRun.date)}</h2>
<p>${esc(manualRun.mode)} · ${esc(manualRun.target)}</p>
<p>${badge('PASS')} ${manualCounts('PASS')} &nbsp; ${badge('FAIL')} ${manualCounts('FAIL')} &nbsp; ${badge('SUSPICIOUS')} ${manualCounts('SUSPICIOUS')} &nbsp; ${badge('NOT_EXERCISED')} ${manualCases.flatMap((c) => c.steps).filter((s) => s.status === 'NOT_EXERCISED').length}</p>
${manualBody}${manualRun.notes?.length ? `<h3>Run notes</h3><ul>${manualRun.notes.map((note) => `<li>${esc(note)}</li>`).join('')}</ul>` : ''}</section>` : '';

fs.writeFileSync(path.join(OUT, 'index.html'), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QA evidence report</title>
<style>:root{color-scheme:light dark;--bg:#fff;--fg:#1a1a1a;--mut:#666;--line:#ddd;--ok:#1a7f37;--bad:#cf222e;--warn:#9a6700}
@media(prefers-color-scheme:dark){:root{--bg:#161616;--fg:#eee;--mut:#999;--line:#333;--ok:#3fb950;--bad:#ff7b72;--warn:#d29922}}
body{font:15px/1.5 system-ui;background:var(--bg);color:var(--fg);max-width:1100px;margin:0 auto;padding:16px}
details{border:1px solid var(--line);border-radius:8px;margin:10px 0;padding:8px 12px}summary{cursor:pointer}
table{border-collapse:collapse;width:100%;font-size:13px}td,th{border-top:1px solid var(--line);padding:6px;vertical-align:top;text-align:left}
.b{padding:1px 8px;border-radius:10px;color:#fff;font-size:12px;background:var(--mut)}.pass{background:var(--ok)}.fail{background:var(--bad)}.suspicious{background:var(--warn)}
.ok{color:var(--ok)}.bad{color:var(--bad)}small{color:var(--mut)}@media(max-width:700px){table{display:block;overflow-x:auto}}</style>
<h1>QA evidence report</h1><p>saucedemo.com · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC</p>
<section><h2>Historical automated results</h2><p>Retained Playwright evidence from the previous run; these cases were not re-executed in the manual session.</p>
<p>${badge('PASS')} ${count('PASS')} &nbsp; ${badge('FAIL')} ${count('FAIL')}</p>${findingsIndex}${body}</section>${manualSection}`);
console.log('Report written to reports/index.html');
