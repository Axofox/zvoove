// Applies the quality standards to what the probes OBSERVED. The probes never decide pass or fail.
// Usage: node 04-scripts/check-probes.mjs <dir with run-NN.json files from probe-shop.mjs>
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2] ?? 'evidence/probes';
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
if (!files.length) {
  console.error(`No probe files in ${dir}`);
  process.exit(2);
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const ascending = (list) => list.every((v, i) => i === 0 || list[i - 1] <= v);
const descending = (list) => list.every((v, i) => i === 0 || list[i - 1] >= v);
const duplicates = (items, key) => {
  const seen = new Map();
  for (const item of items) seen.set(item[key], [...(seen.get(item[key]) ?? []), item.name]);
  return [...seen.entries()].filter(([, names]) => names.length > 1);
};

// A check returns null (pass), an error text (fail), or { skip: reason } when its precondition does not exist.
// `probe` names the probe it reads; a probe that threw is reported as a failure of every check on it.
const checks = [
  ['sort-az', 'sorting', 'Product Page: sort control changes the list', (p) => (same(p.az.names, [...p.az.names].sort()) ? null : `A to Z gave [${p.az.names}]`)],
  ['sort-za', 'sorting', 'Product Page: sort control changes the list', (p) => (same(p.za.names, [...p.az.names].reverse()) ? null : `Z to A gave [${p.za.names}], A to Z gave [${p.az.names}]`)],
  ['sort-price-low-high', 'sorting', 'Product Page: sort control changes the list', (p) => (ascending(p.lohi.prices) ? null : `prices [${p.lohi.prices}]`)],
  ['sort-price-high-low', 'sorting', 'Product Page: sort control changes the list', (p) => (descending(p.hilo.prices) ? null : `prices [${p.hilo.prices}]`)],
  ['product-images-distinct', 'listing', 'Product Page: each product shows its own image', (p) => {
    const dup = duplicates(p.items, 'image');
    return dup.length ? dup.map(([src, names]) => `${names.join(' + ')} share ${src}`).join('; ') : null;
  }],
  ['product-descriptions-distinct', 'listing', 'Product Page: different products do not share a description', (p) => {
    const dup = duplicates(p.items, 'description');
    return dup.length ? dup.map(([, names]) => `${names.join(' + ')} share a description`).join('; ') : null;
  }],
  ['cart-remove-one', 'cartRemoval', 'Test types, Cart CRUD: removing an item updates list and counter', (p) => (
    same(p.afterOne.names, ['Sauce Labs Backpack']) && p.afterOne.badge === 1 ? null : `after removing the Bike Light: [${p.afterOne.names}], badge ${p.afterOne.badge}`
  )],
  ['cart-empty', 'cartRemoval', 'Test types, Cart CRUD: emptying the cart leaves no items and no counter', (p) => (
    p.afterAll.names.length === 0 && p.afterAll.badge === 0 ? null : `after removing everything: [${p.afterAll.names}], badge ${p.afterAll.badge}`
  )],
  ['cart-add-twice', 'addTwice', 'Test types, Cart CRUD: adding the same item twice counts both units', (p) => {
    if (!p.secondAddControl) return { skip: 'the shop offers no second Add control' };
    return p.badge === 2 ? null : `badge ${p.badge} after two adds`;
  }],
  ['required-fields-block', 'requiredFields', 'Checkout Form: required fields are enforced', (p) => {
    const open = Object.entries(p).filter(([, r]) => !r.error || !r.url.includes('checkout-step-one'));
    return open.length ? open.map(([step, r]) => `${step}: error ${JSON.stringify(r.error)}, url ${r.url}`).join('; ') : null;
  }],
  ['required-fields-named', 'requiredFields', 'Checkout Form: the message says what is missing', (p) => {
    const lastName = /last name/i.test(p.firstNameOnly.error ?? '');
    const postalCode = /postal code/i.test(p.noPostalCode.error ?? '');
    return lastName && postalCode ? null : `first name only gave ${JSON.stringify(p.firstNameOnly.error)}; no postal code gave ${JSON.stringify(p.noPostalCode.error)}`;
  }],
  ['xss-not-executed', 'hostileInput', 'Test types, Security: script injection does not execute', (p) => {
    const ran = ['script', 'image'].filter((k) => p[k].dialogs.length);
    return ran.length ? `dialog opened for: ${ran.join(', ')}` : null;
  }],
  ['long-input-handled', 'hostileInput', 'Test types, Security: 500+ characters do not break the app', (p) => (
    p.long.pageErrors.length || !p.long.pageHasText ? `page errors [${p.long.pageErrors}], page has text ${p.long.pageHasText}` : null
  )],
  ['special-chars-handled', 'hostileInput', 'Test types, Security: special characters do not break the app', (p) => (
    p.special.pageErrors.length || !p.special.pageHasText ? `page errors [${p.special.pageErrors}], page has text ${p.special.pageHasText}` : null
  )],
  ['refresh-keeps-cart', 'refresh', 'Test types, State: a refresh mid-checkout does not silently lose the cart', (p) => (
    p.badgeAfter === p.badgeBefore ? null : `cart badge ${p.badgeBefore} before the refresh, ${p.badgeAfter} after`
  )],
  ['short-screen-cart-button', 'shortScreen', 'Test types, UI: Checkout is reachable at 700px height', (p) => (p.checkoutInView ? null : 'Checkout button is not inside the 700px viewport')],
  ['short-screen-continue-button', 'shortScreen', 'Test types, UI: Continue is reachable at 700px height', (p) => (p.continueInView ? null : 'Continue button is not inside the 700px viewport')],
];

const runs = files.map((f) => ({ file: f, data: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) }));
const outcome = (run, [, probe, , fn]) => {
  const p = run.data.probes?.[probe];
  if (!p) return { failed: `probe ${probe} missing` };
  if (p.error) return { failed: `probe did not complete: ${p.error}` };
  try {
    const result = fn(p);
    if (result && result.skip) return { skip: result.skip };
    return result ? { failed: result } : {};
  } catch (error) {
    return { failed: `probe data incomplete: ${error.message}` };
  }
};

const rows = checks.map((check) => {
  const results = runs.map((run) => outcome(run, check));
  const failing = results.filter((r) => r.failed);
  const skipped = results.filter((r) => r.skip);
  let verdict = 'pass';
  if (skipped.length === results.length) verdict = 'n/a';
  else if (failing.length === results.length) verdict = 'FAIL (stable)';
  else if (failing.length || skipped.length) verdict = 'UNSTABLE';
  const detail = (failing[0]?.failed ?? skipped[0]?.skip ?? '').replace(/\|/g, '/');
  return { id: check[0], rule: check[2], failing: failing.length, verdict, detail };
});

const unstable = rows.filter((r) => r.verdict === 'UNSTABLE').length;
const table = rows.map((r) => `| ${r.id} | ${r.rule} | ${r.failing}/${runs.length} | ${r.verdict} | ${r.detail} |`).join('\n');
const report = `# Probe report\n\nRuns: ${runs.length}\n\n| Check | Standard | Runs failing | Result | Example |\n|---|---|---|---|---|\n${table}\n\n${unstable ? `${unstable} check(s) gave different results between runs: the probe or the page is not repeatable, do not trust those.` : 'Every check gave the same result in every run.'}\n`;
console.log(report);
fs.mkdirSync('evidence', { recursive: true });
fs.writeFileSync('evidence/probe-report.md', report);
fs.writeFileSync('evidence/probe-report.json', `${JSON.stringify({ runs: runs.length, verdicts: Object.fromEntries(rows.map((r) => [r.id, r.verdict])), details: Object.fromEntries(rows.map((r) => [r.id, { rule: r.rule, failing: r.failing, total: runs.length, example: r.detail }])) }, null, 2)}\n`);
process.exit(rows.some((r) => r.verdict !== 'pass' && r.verdict !== 'n/a') ? 1 : 0);
