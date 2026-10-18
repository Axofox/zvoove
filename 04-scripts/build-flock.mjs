// Draws the results as a flock: one sheep per check, in a pen per stage, with the person as the shepherd.
// Reads evidence/check-report.json, evidence/probe-report.json, evidence/explore-report.json (optional) and 05-findings/.
// Writes evidence/flock.html, one self-contained page. Nothing on it is typed by hand.
// Usage: node 04-scripts/build-flock.mjs [--out evidence/flock.html] [--fragment]
//   --fragment writes the page without <!doctype>/<html>/<head>/<body>, for hosts that wrap it themselves.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const out = arg('out', 'evidence/flock.html');
const fragment = process.argv.includes('--fragment');
const findingsDir = arg('findings', path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '05-findings'));
const readJson = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null);

const observe = readJson('evidence/check-report.json');
const probe = readJson('evidence/probe-report.json');
const explore = readJson('evidence/explore-report.json');
if (!observe && !probe) {
  console.error('No check reports in evidence/. Run check:observations and check:probes first.');
  process.exit(2);
}

// ---- the register: findings and decisions ----
const section = (text, heading) => {
  const m = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`).exec(text);
  return m ? m[1].trim() : '';
};
const plain = (t) => String(t).replace(/`/g, '');
const entries = fs.existsSync(findingsDir)
  ? fs.readdirSync(findingsDir).filter((f) => /^[FD]-\d+.*\.md$/.test(f)).sort().map((file) => {
    const text = fs.readFileSync(path.join(findingsDir, file), 'utf8');
    const id = /^([FD]-\d+)/.exec(file)[1];
    const decided = /\*\*Decided severity:\*\*\s*([^_\n(]+)/.exec(text)?.[1]?.trim();
    return {
      id,
      kind: id[0],
      title: plain(/^# [FD]-\d+:\s*(.+)$/m.exec(text)?.[1] ?? file),
      status: (/\*\*Status:\*\*\s*([a-z ]+)/i.exec(text)?.[1] ?? 'unconfirmed').trim().toLowerCase(),
      severity: decided || /\*\*Suggested severity:\*\*\s*([a-z]+)/i.exec(text)?.[1] || '',
      severityDecided: Boolean(decided),
      steps: section(text, 'Steps to reproduce').split('\n').filter((l) => /^\d+\./.test(l)).map((l) => plain(l.replace(/^\d+\.\s*/, ''))),
      expected: plain(/\*\*Expected:\*\*\s*(.+)/.exec(text)?.[1] ?? ''),
      actual: plain(/\*\*Actual:\*\*\s*(.+)/.exec(text)?.[1] ?? ''),
      text,
    };
  })
  : [];
const owner = (checkId) => entries.find((e) => e.text.includes(`\`${checkId}\``));

// ---- the sheep ----
const pens = [
  { key: 'observe', title: 'The flow', note: 'The seven steps of the task, run by a script', report: observe },
  { key: 'probe', title: 'The probes', note: 'Extra cases from the test types, each in its own browser', report: probe },
];
const flock = [];
for (const pen of pens) {
  if (!pen.report) continue;
  for (const [id, verdict] of Object.entries(pen.report.verdicts)) {
    const d = pen.report.details?.[id] ?? {};
    const e = owner(id);
    flock.push({ id, pen: pen.key, verdict, rule: d.rule ?? '', failing: d.failing ?? 0, total: d.total ?? pen.report.runs, example: d.example ?? '', entry: e?.id ?? null });
  }
}
const strays = (explore?.groups ?? []).map((g) => ({
  id: g.key,
  pen: 'explore',
  verdict: g.known?.length ? 'FAIL (stable)' : 'UNSTABLE',
  rule: `Seen in ${g.seen} of ${g.total} runs: ${g.cls}`,
  failing: g.seen,
  total: g.total,
  example: `${g.summary} (quote: "${g.quote}")`,
  entry: g.known?.length ? g.known[0].slice(0, 5) : null,
  stray: true,
}));
flock.push(...strays);

const state = (s) => ({ pass: 'pass', 'FAIL (stable)': 'fail', UNSTABLE: 'wobble', 'n/a': 'sleep' }[s.verdict]);
const count = (k) => flock.filter((s) => state(s) === k).length;
const entryById = Object.fromEntries(entries.map((e) => [e.id, { id: e.id, title: e.title, status: e.status, severity: e.severity, severityDecided: e.severityDecided, steps: e.steps, expected: e.expected, actual: e.actual }]));

// ---- drawing ----
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const wool = [[30, 30, 14], [44, 24, 15], [58, 30, 14], [36, 40, 13], [52, 40, 13]];
function sheepSvg(kind, i) {
  const dark = kind === 'fail' || kind === 'wobble';
  const body = (cls, clip) => `<g ${clip ? `clip-path="url(#half${i})"` : ''}>${wool.map(([x, y, r]) => `<circle class="${cls}" cx="${x}" cy="${kind === 'sleep' ? y + 9 : y}" r="${r}"/>`).join('')}</g>`;
  const head = kind === 'sleep'
    ? `<ellipse class="face" cx="73" cy="52" rx="9" ry="8"/><path class="eye-closed" d="M71 51 q3 3 6 0"/>`
    : `<g class="head"><ellipse class="face" cx="73" cy="35" rx="9" ry="10.5"/><ellipse class="face" cx="66" cy="26" rx="3.2" ry="5.5" transform="rotate(-25 66 26)"/><circle class="eye" cx="76" cy="32" r="2.1"/></g>`;
  const legs = kind === 'sleep' ? '' : `<g class="legs"><path d="M34 50v11M44 52v9M54 52v9M62 50v11"/></g>`;
  const z = kind === 'sleep' ? `<text class="z" x="62" y="26">z</text><text class="z z2" x="72" y="16">z</text>` : '';
  const split = kind === 'wobble' ? `<clipPath id="half${i}"><rect x="46" y="0" width="50" height="70"/></clipPath>` : '';
  const ring = kind === 'wobble' ? `<ellipse class="ring" cx="46" cy="38" rx="31" ry="26"/>` : '';
  const fleece = kind === 'wobble' ? body('wool', false) + body('coal', true) : body(dark ? 'coal' : 'wool', false);
  return `<svg viewBox="0 0 92 68" role="img" aria-hidden="true" focusable="false"><defs>${split}</defs>${legs}${ring}${fleece}${head}${z}</svg>`;
}
const dogSvg = (awake) => awake
  ? `<svg viewBox="0 0 110 70" aria-hidden="true" focusable="false" class="dog"><path class="dog-tail" d="M12 30 q-10 -8 -6 -20"/><ellipse class="dog-body" cx="46" cy="38" rx="30" ry="14"/><ellipse class="dog-chest" cx="72" cy="40" rx="9" ry="10"/><circle class="dog-body" cx="86" cy="26" r="11"/><path class="dog-ear" d="M80 18 q-7 -5 -9 6 q4 4 9 -2z"/><path class="dog-muzzle" d="M92 28 q10 2 9 7 q-6 3 -12 -1z"/><circle class="eye" cx="88" cy="24" r="1.8"/><path class="dog-leg" d="M26 48l-8 14M36 50l-3 13M60 50l4 13M70 48l9 14"/></svg>`
  : `<svg viewBox="0 0 110 60" aria-hidden="true" focusable="false" class="dog"><ellipse class="dog-body" cx="48" cy="40" rx="34" ry="14"/><path class="dog-tail" d="M14 42 q-8 4 -6 12"/><circle class="dog-body" cx="82" cy="42" r="11"/><path class="dog-ear" d="M76 34 q-8 -2 -8 8 q5 3 9 -3z"/><path class="eye-closed" d="M84 42 q3 3 6 0"/><text class="z" x="90" y="24">z</text><text class="z z2" x="100" y="14">z</text></svg>`;
const shepherdSvg = `<svg viewBox="0 0 70 120" aria-hidden="true" focusable="false" class="shepherd"><path class="crook" d="M56 112V28q0 -16 -14 -14"/><ellipse class="hat" cx="30" cy="22" rx="20" ry="5"/><path class="hat" d="M18 22q2 -14 12 -14t12 14z"/><circle class="skin" cx="30" cy="31" r="9"/><circle class="eye" cx="27" cy="30" r="1.3"/><circle class="eye" cx="33" cy="30" r="1.3"/><path class="smile" d="M26 34q4 3 8 0"/><path class="coat" d="M14 112q-2 -52 16 -72q18 20 16 72z"/><path class="scarf" d="M21 41q9 6 18 0v5q-9 5 -18 0z"/></svg>`;

const label = { pass: 'white sheep', fail: 'black sheep', wobble: 'wobbly sheep', sleep: 'sleeping sheep' };
const tagText = (s) => {
  if (!s.entry) return '';
  const e = entryById[s.entry];
  const glyph = { unconfirmed: '?', confirmed: '✓', fixed: '★', rejected: '×' }[e?.status] ?? '?';
  return `<span class="tag t-${e?.status ?? 'unconfirmed'}">${esc(s.entry)} ${glyph}</span>`;
};
const sheepButton = (s, i) => {
  const k = state(s);
  const what = { pass: 'passed', fail: `failed in ${s.failing} of ${s.total} runs`, wobble: s.stray ? `appeared in ${s.failing} of ${s.total} runs and is not in the register` : `gave different results between runs (${s.failing} of ${s.total} failed)`, sleep: 'does not apply, the shop has no such feature' }[k];
  const shown = s.stray ? s.id.split(':').slice(1).join(' ') : s.id;
  return `<button type="button" class="sheep s-${k}" data-i="${i}" style="--d:${(i * 0.37) % 2.4}s" aria-pressed="false" aria-label="${esc(`${shown}, ${label[k]}, ${what}${s.entry ? `, finding ${s.entry}` : ''}`)}">${tagText(s) || '<span class="tag tag-empty"></span>'}${sheepSvg(k, i)}<span class="name">${esc(shown)}</span></button>`;
};

const open = flock.filter((s) => state(s) === 'fail' || state(s) === 'wobble');
const waiting = entries.filter((e) => e.kind === 'F' && e.status === 'unconfirmed').length;
const confirmed = entries.filter((e) => e.kind === 'F' && e.status === 'confirmed').length;
const fixed = entries.filter((e) => e.kind === 'F' && e.status === 'fixed').length;
const decisions = entries.filter((e) => e.kind === 'D').length;
const speech = entries.length
  ? `${waiting ? `${waiting} finding${waiting > 1 ? 's' : ''} waiting for me to look.` : 'Nothing is waiting for me.'}${confirmed ? ` ${confirmed} confirmed.` : ''}${fixed ? ` ${fixed} fixed.` : ''}${decisions ? ` ${decisions} question${decisions > 1 ? 's' : ''} to decide.` : ''}`
  : 'No findings written down yet.';

const penHtml = (pen, list) => `<section class="pen" aria-labelledby="pen-${pen.key}"><div class="fence" aria-hidden="true"></div><header><h2 id="pen-${pen.key}">${esc(pen.title)}</h2><p>${esc(pen.note)}</p></header><div class="sheep-grid">${list.map((s) => sheepButton(s, flock.indexOf(s))).join('')}</div></section>`;
const penBlocks = pens.filter((p) => p.report).map((p) => penHtml(p, flock.filter((s) => s.pen === p.key))).join('\n');

const m = explore?.metrics ?? [];
const sum = (k) => m.reduce((a, x) => a + x[k], 0);
const explorePen = `<section class="pen pen-explore" aria-labelledby="pen-explore"><div class="fence" aria-hidden="true"></div><header><h2 id="pen-explore">The explorer</h2><p>A local model, kept on a short lead: every claim needs a quote from the page</p></header>
<div class="dog-row">${dogSvg(Boolean(explore))}<p class="dog-says">${explore
    ? `${esc(explore.model)} walked ${explore.sessions} session${explore.sessions > 1 ? 's' : ''}. ${sum('accepted')} claims kept, ${sum('rejected')} thrown out for having no quote, ${sum('repeats')} repeated or unusable steps stopped.`
    : 'The dog has not been out yet. Run <code>npm run explore</code> and then <code>npm run explore:report</code>, and what it finds appears here as strays outside the fence.'}</p></div>
${strays.length ? `<div class="sheep-grid strays">${strays.map((s) => sheepButton(s, flock.indexOf(s))).join('')}</div>` : ''}</section>`;

const runsText = [observe && `${observe.runs} runs of the flow`, probe && `${probe.runs} runs of the probes`].filter(Boolean).join(', ');
const data = { flock, entries: entryById };

const css = `
/* Layout: one pasture, three pens under a fence, the shepherd above them, a notebook panel below */
:root {
  --sky: #eef3ea; --grass: #d9e6c3; --grass-deep: #b9d19a; --fence: #a9794a; --wool: #fffdf6; --wool-line: #cfc8b4;
  --coal: #2c2b35; --coal-line: #14131a; --face: #46414f; --ink: #1f2a22; --muted: #5b6a5e; --panel: #fffdf6; --line: #c9d3b8;
  --warn: #c98a1b; --alarm: #c4372c; --ok: #2f7d4f; --accent: #2f7d4f;
  --display: 'Bricolage Grotesque', 'Trebuchet MS', system-ui, sans-serif; --body: 'Figtree', system-ui, sans-serif; --mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --sky: #101a24; --grass: #1d3025; --grass-deep: #2a4733; --fence: #8a6340; --wool: #ece8da; --wool-line: #9d977f;
  --coal: #0d0d12; --coal-line: #000; --face: #3b3744; --ink: #e8efe4; --muted: #a2b2a4; --panel: #16221b; --line: #2f4838;
  --warn: #e0a640; --alarm: #ee6a5d; --ok: #6cc28b; --accent: #6cc28b; color-scheme: dark; } }
:root[data-theme="dark"] {
  --sky: #101a24; --grass: #1d3025; --grass-deep: #2a4733; --fence: #8a6340; --wool: #ece8da; --wool-line: #9d977f;
  --coal: #0d0d12; --coal-line: #000; --face: #3b3744; --ink: #e8efe4; --muted: #a2b2a4; --panel: #16221b; --line: #2f4838;
  --warn: #e0a640; --alarm: #ee6a5d; --ok: #6cc28b; --accent: #6cc28b; color-scheme: dark; }
body { background: var(--sky); color: var(--ink); font-family: var(--body); line-height: 1.5; }
* { box-sizing: border-box; }
.wrap { max-width: 72rem; margin: 0 auto; padding-block: 1.5rem 3rem; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
h1, h2 { font-family: var(--display); line-height: 1.1; text-wrap: balance; margin: 0; }
h1 { font-size: clamp(2rem, 5vw, 3.2rem); font-weight: 800; letter-spacing: -0.02em; }
h2 { font-size: 1.35rem; font-weight: 700; }
code, .mono { font-family: var(--mono); font-size: 0.86em; }
.top { display: grid; grid-template-columns: 1fr auto; gap: 1rem 2rem; align-items: end; }
.top p { margin: 0.5rem 0 0; color: var(--muted); max-width: 40rem; }
.count { display: flex; flex-wrap: wrap; gap: 0.4rem 1.2rem; margin-top: 1rem; font-variant-numeric: tabular-nums; font-weight: 600; }
.count span::before { content: ''; display: inline-block; width: 0.8em; height: 0.8em; border-radius: 50%; margin-right: 0.4em; vertical-align: -0.08em; border: 2px solid var(--wool-line); background: var(--wool); }
.count .c-fail::before { background: var(--coal); border-color: var(--coal-line); }
.count .c-wobble::before { background: linear-gradient(90deg, var(--wool) 50%, var(--coal) 50%); border-color: var(--coal-line); }
.count .c-sleep::before { background: var(--grass-deep); border-style: dashed; }
.shepherd-box { display: flex; align-items: flex-end; gap: 0.6rem; }
.shepherd { width: 4.2rem; height: auto; flex: none; }
.bubble { position: relative; background: var(--panel); border: 2px solid var(--line); padding: 0.55rem 0.8rem; max-width: 16rem; font-size: 0.92rem; margin-bottom: 3rem; }
.bubble::after { content: ''; position: absolute; left: -9px; bottom: 10px; border: 8px solid transparent; border-right-color: var(--line); border-left: 0; }
.pasture { margin-top: 1.5rem; background: linear-gradient(var(--grass), var(--grass-deep)); padding: 1.2rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr)); gap: 1.4rem; align-items: start; }
.pen { position: relative; padding-top: 1.3rem; min-width: 0; }
.pen header { margin-bottom: 0.6rem; }
.pen header p { margin: 0.2rem 0 0; color: var(--muted); font-size: 0.9rem; }
.fence { position: absolute; inset: 0 0 auto 0; height: 1.1rem; background:
  linear-gradient(var(--fence), var(--fence)) 0 0.25rem / 100% 0.22rem no-repeat,
  linear-gradient(var(--fence), var(--fence)) 0 0.7rem / 100% 0.22rem no-repeat,
  repeating-linear-gradient(90deg, var(--fence) 0 0.35rem, transparent 0.35rem 1.4rem); }
.sheep-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(6rem, 1fr)); gap: 0.6rem 0.2rem; }
.sheep { appearance: none; background: none; border: 0; padding: 0.15rem 0.1rem 0.3rem; font: inherit; color: inherit; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 0.1rem; min-width: 0; border-radius: 6px; }
.sheep svg { width: 4.9rem; height: auto; overflow: visible; }
.sheep:hover { background: color-mix(in srgb, var(--wool) 35%, transparent); }
.sheep:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.sheep[aria-pressed="true"] { background: color-mix(in srgb, var(--wool) 55%, transparent); box-shadow: 0 0 0 2px var(--ink); }
.name { font-family: var(--mono); font-size: 0.64rem; line-height: 1.15; max-width: 100%; overflow-wrap: anywhere; text-align: center; color: var(--ink); }
.tag { font-family: var(--mono); font-size: 0.64rem; font-weight: 700; padding: 0 0.35rem; background: var(--warn); color: #1b1608; min-height: 1rem; line-height: 1rem; border-radius: 3px; }
.tag-empty { visibility: hidden; }
.t-confirmed { background: var(--alarm); color: #fff; }
.t-fixed { background: var(--ok); color: #fff; }
.t-rejected { background: var(--muted); color: #fff; text-decoration: line-through; }
.wool { fill: var(--wool); stroke: var(--wool-line); stroke-width: 1.4; }
.coal { fill: var(--coal); stroke: var(--coal-line); stroke-width: 1.4; }
.face { fill: var(--face); }
.s-fail .face { fill: var(--coal-line); }
.eye { fill: var(--wool); }
.s-pass .eye { fill: #fff; }
.eye-closed { fill: none; stroke: var(--wool); stroke-width: 1.8; stroke-linecap: round; }
.legs path { stroke: var(--face); stroke-width: 3.2; stroke-linecap: round; fill: none; }
.ring { fill: none; stroke: var(--warn); stroke-width: 1.6; stroke-dasharray: 3 4; }
.z { font-family: var(--display); font-weight: 800; font-size: 11px; fill: var(--ink); opacity: 0.7; }
.s-sleep { opacity: 0.88; }
.s-sleep svg { filter: saturate(0.6); }
@media (prefers-reduced-motion: no-preference) {
  .s-pass .head { transform-box: fill-box; transform-origin: 70% 90%; animation: graze 3.6s ease-in-out var(--d) infinite; }
  .s-wobble svg { animation: wobble 1.4s ease-in-out var(--d) infinite; transform-origin: 50% 90%; }
  .s-fail .head { transform-box: fill-box; transform-origin: 70% 90%; animation: glare 5s ease-in-out var(--d) infinite; }
  .z { animation: drift 3s ease-in-out infinite; } .z2 { animation-delay: 1.2s; }
}
@keyframes graze { 0%, 55%, 100% { transform: rotate(0); } 70%, 85% { transform: rotate(22deg) translateY(2px); } }
@keyframes wobble { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
@keyframes glare { 0%, 80%, 100% { transform: rotate(0); } 90% { transform: rotate(-8deg); } }
@keyframes drift { 0%, 100% { transform: translateY(0); opacity: 0.35; } 50% { transform: translateY(-4px); opacity: 0.85; } }
.dog-row { display: flex; align-items: center; gap: 0.8rem; }
.dog { width: 5.6rem; height: auto; flex: none; }
.dog-body, .dog-chest { fill: var(--face); } .dog-chest { fill: var(--wool); } .dog-ear { fill: var(--coal); } .dog-muzzle { fill: var(--wool); }
.dog-tail, .dog-leg { fill: none; stroke: var(--face); stroke-width: 4; stroke-linecap: round; }
.dog-says { margin: 0; font-size: 0.92rem; min-width: 0; }
.strays { margin-top: 0.8rem; padding-top: 0.6rem; border-top: 2px dashed var(--fence); }
.sheep[data-i].s-fail .name, .sheep.s-wobble .name { font-weight: 700; }
.shepherd .hat { fill: var(--fence); } .shepherd .skin { fill: #e3b88f; } .shepherd .coat { fill: var(--ok); } .shepherd .scarf { fill: var(--alarm); }
.shepherd .crook { fill: none; stroke: var(--fence); stroke-width: 4; stroke-linecap: round; } .shepherd .eye { fill: var(--coal); } .shepherd .smile { fill: none; stroke: var(--coal); stroke-width: 1.4; stroke-linecap: round; }
.panel { margin-top: 1.4rem; background: var(--panel); border: 2px solid var(--line); padding: 1.1rem 1.3rem; display: grid; gap: 0.7rem; }
.panel h2 { font-size: 1.15rem; }
.panel p { margin: 0; }
.panel .rule { color: var(--muted); }
.panel blockquote { margin: 0; padding: 0.5rem 0.8rem; border-left: 4px solid var(--warn); background: color-mix(in srgb, var(--warn) 12%, transparent); font-family: var(--mono); font-size: 0.82rem; overflow-wrap: anywhere; }
.panel ol { margin: 0.2rem 0 0; padding-left: 1.3rem; }
.panel .next { font-weight: 600; }
.pill { display: inline-block; font-family: var(--mono); font-size: 0.74rem; font-weight: 700; padding: 0.1rem 0.5rem; border-radius: 3px; background: var(--warn); color: #1b1608; }
.legend { margin-top: 1.2rem; display: flex; flex-wrap: wrap; gap: 0.5rem 1.6rem; font-size: 0.86rem; color: var(--muted); }
.foot { margin-top: 1.2rem; font-size: 0.82rem; color: var(--muted); }
@media (max-width: 40rem) { .top { grid-template-columns: 1fr; } .bubble { margin-bottom: 1rem; } .shepherd-box { order: -1; } }
`;

const script = `
const data = JSON.parse(document.getElementById('flock-data').textContent);
const panel = document.getElementById('panel');
const kindText = { pass: 'Passed in every run.', fail: 'Failed in every run.', wobble: 'Gave different results between runs.', sleep: 'Does not apply: the shop has no such feature.' };
const stateOf = (s) => ({ pass: 'pass', 'FAIL (stable)': 'fail', UNSTABLE: 'wobble', 'n/a': 'sleep' }[s.verdict]);
const next = { unconfirmed: 'Follow the steps on saucedemo.com, then set Status to confirmed or rejected in the finding file.', confirmed: 'Confirmed. It stays black until the shop is fixed, then set Status to fixed.', fixed: 'Fixed. If its check fails again the run goes red.', rejected: 'Rejected. Change the check or the standard so it stops reporting this.' };
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function show(i) {
  const s = data.flock[i], k = stateOf(s), e = s.entry ? data.entries[s.entry] : null;
  document.querySelectorAll('.sheep').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.i) === i)));
  let html = '<h2><span class="mono">' + esc(s.id) + '</span></h2>';
  html += '<p class="rule">' + esc(s.rule || '') + '</p>';
  html += '<p>' + (k === 'fail' ? 'Failed in ' + s.failing + ' of ' + s.total + ' runs.' : k === 'wobble' && !s.stray ? 'Failed in ' + s.failing + ' of ' + s.total + ' runs, so it cannot be trusted yet.' : k === 'wobble' ? 'Reported by the explorer; not in the register yet.' : kindText[k]) + '</p>';
  if (s.example) html += '<blockquote>' + esc(s.example) + '</blockquote>';
  if (e) {
    html += '<p><span class="pill">' + esc(e.id) + ' ' + esc(e.status) + '</span> ' + esc(e.title) + (e.severity ? ' &middot; ' + (e.severityDecided ? 'severity' : 'suggested severity') + ': <strong>' + esc(e.severity) + '</strong>' : '') + '</p>';
    if (e.steps.length) html += '<div><strong>Steps to reproduce</strong><ol>' + e.steps.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol></div>';
    if (e.expected) html += '<p><strong>Expected:</strong> ' + esc(e.expected) + '</p>';
    if (e.actual) html += '<p><strong>Actual:</strong> ' + esc(e.actual) + '</p>';
    html += '<p class="next">The shepherd: ' + esc(next[e.status] || '') + '</p>';
  } else if (k === 'fail' || k === 'wobble') {
    html += '<p class="next">The shepherd: this is not written down yet. Add it to a finding in 05-findings/.</p>';
  }
  panel.innerHTML = html;
}
document.querySelectorAll('.sheep').forEach((b) => b.addEventListener('click', () => show(Number(b.dataset.i))));
const first = data.flock.findIndex((s) => stateOf(s) === 'fail' || stateOf(s) === 'wobble');
show(first > -1 ? first : 0);
`;

const body = `<div class="wrap">
<div class="top"><div><h1>The SheepSure flock</h1>
<p>Every check is a sheep. White ones passed, black ones failed, wobbly ones could not make up their mind between runs, and sleeping ones belong to a feature the shop does not have. Press a sheep to see why.</p>
<div class="count" aria-label="Flock count"><span>${count('pass')} white</span><span class="c-fail">${count('fail')} black</span><span class="c-wobble">${count('wobble')} wobbly</span><span class="c-sleep">${count('sleep')} asleep</span></div></div>
<div class="shepherd-box">${shepherdSvg}<p class="bubble">${esc(speech)}</p></div></div>
<div class="pasture">${penBlocks}
${explorePen}</div>
<section class="panel" id="panel" aria-live="polite" aria-label="Details of the chosen sheep"></section>
<div class="legend"><span>White sheep: passed</span><span>Black sheep: failed</span><span>Half and half, dashed: unstable</span><span>Lying down with z: not applicable</span><span>Tag: <b class="tag">F-001 ?</b> waiting, ✓ confirmed, ★ fixed, × rejected</span></div>
<p class="foot">${esc(runsText)} of ${open.length ? 'problem_user' : 'the shop'} on saucedemo.com. Built by <code>04-scripts/build-flock.mjs</code> from <code>evidence/</code> and <code>05-findings/</code>; a person's verdict lives in the finding files.</p>
</div>
<script type="application/json" id="flock-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
<script>${script}</script>`;

const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Figtree:wght@400;600&family=JetBrains+Mono:wght@500;700&display=swap">';
const head = `<title>SheepSure Flock</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n${fonts}\n<style>${css}</style>`;
const html = fragment
  ? `${head}\n${body}\n`
  : `<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n${head}\n</head><body style="margin:0">\n${body}\n</body></html>\n`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`Flock written to ${out}: ${count('pass')} white, ${count('fail')} black, ${count('wobble')} wobbly, ${count('sleep')} asleep`);
