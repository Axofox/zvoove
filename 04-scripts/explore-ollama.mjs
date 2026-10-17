// Exploratory stage: a local Ollama model chooses what to do next; Playwright does it; code checks every claim.
// The model proposes actions from a fixed menu and may report a suspicious observation with a quote.
// Code rejects any observation whose quote is not on the page. Code, not the model, detects script errors and dialogs.
// Usage: node 04-scripts/explore-ollama.mjs --runs 3 --model qwen2.5:7b --user problem_user
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const user = arg('user', 'problem_user');
const runs = Number(arg('runs', '3'));
const model = arg('model', 'qwen2.5:7b');
const host = arg('host', 'http://localhost:11434');
const baseUrl = arg('base-url', 'https://www.saucedemo.com/');
const temperature = Number(arg('temperature', '0.3'));
const seed = Number(arg('seed', '1'));
const contextSize = Number(arg('ctx', '4096'));
const standardsChars = Number(arg('standards-chars', '3500'));
const only = arg('charter', '');
const out = arg('out', `evidence/explore/${user}`);
const origin = new URL(baseUrl).origin;

const categories = [
  'sorting-or-filtering', 'image', 'price-or-total', 'cart-count-or-contents', 'form-field-input',
  'validation-message', 'navigation', 'layout-or-visibility', 'security-or-error', 'text-or-copy', 'other',
];
const actionTypes = ['click', 'fill', 'select', 'back', 'done'];
const schema = {
  type: 'object',
  properties: {
    action: {
      type: 'object',
      properties: { type: { enum: actionTypes }, id: { type: 'integer' }, text: { type: 'string' } },
      required: ['type'],
    },
    observation: {
      type: 'object',
      properties: { category: { enum: [...categories, 'none'] }, summary: { type: 'string' }, quote: { type: 'string' } },
      required: ['category', 'summary', 'quote'],
    },
  },
  required: ['action', 'observation'],
};

const standards = ['02-rules/quality-standards.md', '02-rules/test-types.md']
  .filter((f) => fs.existsSync(f))
  .map((f) => fs.readFileSync(f, 'utf8'))
  .join('\n\n');

const systemPrompt = `You are an exploratory tester of an online shop. You choose what to do next and you report what looks wrong.

Rules:
- Work only from the page you are shown. Never guess what is on other pages.
- Pick exactly one action: click (an element id), fill (an element id and text), select (an element id and an option), back, or done.
- Report at most one observation per step, only when something on the CURRENT page breaks one of the standards below. "observation" uses the category "none" (with empty summary and quote) otherwise.
- An observation needs a category from the list, a short summary, and a quote: 2 to 8 words copied exactly from the page text, an element label or an image file name. If you cannot quote it, do not report it.
- You do not decide whether the shop passes or fails. A person does.
- Stop with "done" when your mission is covered or you are repeating yourself.

Categories: ${categories.join(', ')}

Standards the shop is held to:
${standards.slice(0, standardsChars)}`;

const normalise = (text) => String(text).toLowerCase().replace(/\s+/g, ' ').trim();

async function snapshot(page) {
  return page.evaluate(() => {
    document.querySelectorAll('[data-explorer-id]').forEach((el) => el.removeAttribute('data-explorer-id'));
    const shown = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
    const elements = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea')].filter(shown).slice(0, 30);
    const list = elements.map((el, id) => {
      el.setAttribute('data-explorer-id', String(id));
      const tag = el.tagName.toLowerCase();
      const entry = {
        id,
        tag,
        type: el.getAttribute('type') || undefined,
        label: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('data-test') || '').trim().slice(0, 70),
        value: tag === 'input' || tag === 'textarea' || tag === 'select' ? String(el.value).slice(0, 70) : undefined,
      };
      if (tag === 'select') entry.options = [...el.options].map((o) => o.value).slice(0, 12);
      return entry;
    });
    const images = [...document.querySelectorAll('img')].filter(shown).slice(0, 12).map((img) => ({ alt: img.alt, src: (img.getAttribute('src') || '').slice(0, 120) }));
    return { url: location.href, text: document.body.innerText.slice(0, 1200), elements: list, images };
  });
}

const corpus = (snap) => normalise([snap.url, snap.text, ...snap.elements.flatMap((e) => [e.label, e.value, ...(e.options ?? [])]), ...snap.images.flatMap((i) => [i.alt, i.src])].join(' '));

const keyOf = (snap, el, text) => `${new URL(snap.url).pathname}|${el.tag}|${el.label}|${text ?? ''}`;

function describe(snap, tried) {
  const done = (e) => ['a', 'button'].includes(e.tag) && tried.has(keyOf(snap, e, ''));
  const open = snap.elements.filter((e) => !done(e)).slice(0, 18);
  const els = open.map((e) => `[${e.id}] ${e.tag}${e.type ? `:${e.type}` : ''} "${e.label}"${e.value !== undefined ? ` value="${e.value}"` : ''}${e.options ? ` options=${e.options.join('|')}` : ''}`).join('\n');
  const finished = snap.elements.filter(done).map((e) => `"${e.label}"`).join(', ');
  const imgs = snap.images.map((i) => `alt="${i.alt}" src="${i.src}"`).join('\n');
  return `URL: ${snap.url}\n\nPage text:\n${snap.text}\n\nElements you can use (use ONLY these ids: ${open.map((e) => e.id).join(', ') || 'none, choose back or done'}):\n${els}\n\nAlready clicked on this page, not offered again: ${finished || 'nothing'}\n\nImages:\n${imgs || '(none)'}`;
}

async function askModel(charter, step, history, reported, snap, stepSeed, tried) {
  const user = `Mission: ${charter.mission}\nThings to check, in any order:\n${(charter.checklist ?? []).map((c) => `- ${c}`).join('\n') || '- (none)'}\nStep ${step} of at most ${charter.maxSteps}.\n\nRecent steps:\n${history.slice(-5).join('\n') || '(none yet)'}\n\nAlready reported (do not repeat):\n${reported.join('\n') || '(nothing)'}\n\n${describe(snap, tried)}`;
  const response = await fetch(`${host}/api/chat`, {
    method: 'POST',
    signal: AbortSignal.timeout(240000),
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      format: schema,
      options: { temperature, seed: stepSeed, num_ctx: contextSize },
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: user }],
    }),
  });
  if (!response.ok) throw new Error(`Ollama answered ${response.status}: ${(await response.text()).slice(0, 200)}`);
  return JSON.parse((await response.json()).message.content);
}

async function perform(page, action) {
  const target = page.locator(`[data-explorer-id="${action.id}"]`);
  if (['click', 'fill', 'select'].includes(action.type) && !(await target.count())) return 'no such element id';
  if (action.type === 'click') await target.click({ timeout: 3000 });
  else if (action.type === 'fill') await target.fill(String(action.text ?? '').slice(0, 600), { timeout: 3000 });
  else if (action.type === 'select') {
    const choice = String(action.text ?? '');
    await target.selectOption(choice, { timeout: 3000 }).catch(() => target.selectOption({ label: choice }, { timeout: 3000 }));
  } else if (action.type === 'back') await page.goBack();
  await page.waitForTimeout(300);
  return 'ok';
}

async function session(browser, charter, run) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const events = { dialogs: [], pageErrors: [] };
  page.on('dialog', (d) => { events.dialogs.push(d.message()); d.dismiss().catch(() => {}); });
  page.on('pageerror', (e) => events.pageErrors.push(e.message));
  await page.goto(baseUrl);
  await page.fill('[data-test="username"]', user);
  await page.fill('[data-test="password"]', 'secret_sauce');
  await page.click('[data-test="login-button"]');
  await page.waitForSelector('[data-test="inventory-container"]');

  const log = { user, run, charter: charter.id, model, temperature, seed, steps: [], observations: [], rejected: [], invalidResponses: 0, stoppedBecause: 'budget' };
  const history = [];
  const reported = [];
  const seen = new Set();
  const tried = new Set();
  let repeatsInARow = 0;
  log.repeats = 0;
  for (let step = 1; step <= charter.maxSteps; step += 1) {
    const snap = await snapshot(page);
    let reply;
    console.log(`  ${charter.id} run ${run} step ${step}/${charter.maxSteps}: asking the model...`);
    try {
      reply = await askModel(charter, step, history, reported, snap, seed + run * 1000 + step, tried);
    } catch (error) {
      log.invalidResponses += 1;
      log.steps.push({ step, url: snap.url, error: String(error.message).slice(0, 200) });
      if (/Ollama answered|fetch failed|timeout|aborted/i.test(error.message)) { log.stoppedBecause = `model unavailable: ${error.message}`; break; }
      continue;
    }
    const entry = { step, url: snap.url, action: reply.action };
    const obs = reply.observation && reply.observation.category !== 'none' && reply.observation.quote ? reply.observation : null;
    if (obs) {
      const grounded = corpus(snap).includes(normalise(obs.quote)) && normalise(obs.quote).length >= 3;
      const key = `${obs.category}|${new URL(snap.url).pathname}|${normalise(obs.quote)}`;
      if (!grounded) log.rejected.push({ step, reason: 'quote not on the page', ...obs });
      else if (!seen.has(key)) {
        seen.add(key);
        log.observations.push({ step, path: new URL(snap.url).pathname, ...obs });
        reported.push(`${obs.category}: ${obs.summary}`);
      }
      entry.observation = grounded ? 'accepted' : 'rejected';
    }
    if (reply.action.type === 'done') { entry.result = 'done'; log.steps.push(entry); log.stoppedBecause = 'model said done'; break; }
    const chosen = snap.elements[reply.action.id];
    const actionKey = ['click', 'select', 'fill'].includes(reply.action.type) && chosen ? keyOf(snap, chosen, reply.action.type === 'click' ? '' : reply.action.text) : null;
    if (actionKey && tried.has(actionKey)) {
      entry.result = 'repeat, not executed';
      log.repeats += 1;
      repeatsInARow += 1;
      log.steps.push(entry);
      console.log(`  ${charter.id} run ${run} step ${step}/${charter.maxSteps}: ${reply.action.type} #${reply.action.id} -> repeat, not executed`);
      history.push(`step ${step}: ${reply.action.type} #${reply.action.id} "${chosen.label}" -> you already did this on this page; choose something different`);
      if (repeatsInARow >= 3) { log.stoppedBecause = 'stuck: three repeated actions in a row'; break; }
      continue;
    }
    if (actionKey) tried.add(actionKey);
    try {
      entry.result = await perform(page, reply.action);
      if (entry.result === 'no such element id') {
        log.repeats += 1;
        repeatsInARow += 1;
        if (repeatsInARow >= 3) {
          log.steps.push(entry);
          log.stoppedBecause = 'stuck: three unusable actions in a row';
          break;
        }
      } else repeatsInARow = 0;
    } catch (error) {
      entry.result = `failed: ${String(error.message).split('\n')[0].slice(0, 120)}`;
    }
    if (!page.url().startsWith(origin)) { await page.goBack().catch(() => {}); entry.result = 'left the site, went back'; }
    log.steps.push(entry);
    console.log(`  ${charter.id} run ${run} step ${step}/${charter.maxSteps}: ${reply.action.type}${reply.action.id !== undefined ? ` #${reply.action.id}` : ''} -> ${entry.result}${entry.observation ? `, observation ${entry.observation}` : ''}`);
    history.push(`step ${step}: ${reply.action.type}${reply.action.id !== undefined ? ` #${reply.action.id}` : ''}${reply.action.text ? ` "${reply.action.text.slice(0, 40)}"` : ''} -> ${entry.result}`);
  }
  log.codeDetected = [
    ...events.dialogs.map((m) => ({ category: 'security-or-error', summary: 'A dialog opened', quote: m })),
    ...events.pageErrors.map((m) => ({ category: 'security-or-error', summary: 'The page raised a script error', quote: m })),
  ];
  await context.close();
  return log;
}

const version = await fetch(`${host}/api/version`).then((r) => r.json()).then((j) => j.version).catch(() => null);
if (!version) {
  console.error(`Cannot reach Ollama at ${host}. Start it (ollama serve) and pull the model (ollama pull ${model}).`);
  process.exit(2);
}
const charters = fs.readdirSync('06-charters').filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join('06-charters', f), 'utf8'))).filter((c) => !only || c.id === only);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (let run = 1; run <= runs; run += 1) {
  for (const charter of charters) {
    const log = { ollamaVersion: version, ...(await session(browser, charter, run)) };
    fs.writeFileSync(path.join(out, `run-${String(run).padStart(2, '0')}-${charter.id}.json`), `${JSON.stringify(log, null, 2)}\n`);
    console.log(`run ${run}/${runs} ${charter.id}: ${log.steps.length} steps, ${log.observations.length} accepted, ${log.rejected.length} rejected, ${log.invalidResponses} invalid replies, stopped: ${log.stoppedBecause}`);
  }
}
await browser.close();
