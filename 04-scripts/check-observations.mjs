// Applies the quality standards to what an agent OBSERVED. The agent never decides pass or fail.
// Usage: node 04-scripts/check-observations.mjs <dir with TC-001-run*.json files>
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2] ?? 'evidence/observations';
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
if (!files.length) {
  console.error(`No observation files in ${dir}`);
  process.exit(2);
}
const cents = (n) => Math.round(Number(n) * 100);

// Each check: id, the rule it comes from, and a function that returns an error text or null.
const checks = [
  ['cart-contents', 'Cart: exactly the items the user added', (o) => {
    const want = o.added.slice().sort().join(',');
    const got = o.cart.map((i) => i.name).sort().join(',');
    return want === got ? null : `added [${want}] but cart has [${got}]`;
  }],
  ['badge-matches-cart', 'Product page: counter reflects the quantity', (o) => {
    const qty = o.cart.reduce((a, i) => a + i.qty, 0);
    return o.cartBadge === qty ? null : `badge ${o.cartBadge}, cart quantity ${qty}`;
  }],
  ['price-consistency', 'Data Integrity: same price on listing, cart and summary', (o) => {
    const bad = o.cart.filter((i) => cents(i.price) !== cents(o.listingPrices[i.name]));
    return bad.length ? bad.map((i) => `${i.name}: listing ${o.listingPrices[i.name]}, cart ${i.price}`).join('; ') : null;
  }],
  ['form-retains-input', 'Checkout Form: every field keeps the text typed', (o) => {
    const lost = Object.keys(o.form.typed).filter((k) => o.form.retained[k] !== o.form.typed[k]);
    return lost.length ? lost.map((k) => `${k}: typed "${o.form.typed[k]}", kept "${o.form.retained[k]}"`).join('; ') : null;
  }],
  ['summary-reached', 'Order Summary: checkout can proceed with valid data', (o) => (o.summary ? null : 'summary page was never reached')],
  ['item-total', 'Order Summary: item total equals the sum of item prices', (o) => {
    if (!o.summary) return null;
    const sum = o.cart.reduce((a, i) => a + cents(i.price) * i.qty, 0);
    return sum === cents(o.summary.itemTotal) ? null : `sum ${sum / 100}, shown ${o.summary.itemTotal}`;
  }],
  ['grand-total', 'Order Summary: grand total equals item total plus tax', (o) => {
    if (!o.summary) return null;
    const sum = cents(o.summary.itemTotal) + cents(o.summary.tax);
    return sum === cents(o.summary.total) ? null : `${o.summary.itemTotal} + ${o.summary.tax} = ${sum / 100}, shown ${o.summary.total}`;
  }],
  ['confirmation', 'Order Confirmation: a clear confirmation is shown', (o) => (o.confirmation?.shown ? null : 'no confirmation shown')],
  ['cart-cleared', 'Order Confirmation: cart is cleared after the order', (o) => (!o.confirmation?.shown || o.confirmation.badgeAfter === 0 ? null : `badge still ${o.confirmation.badgeAfter}`)],
];

// A file holds one run, or {"runs": [...]} for several.
const observations = files.flatMap((f) => {
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  return (data.runs ?? [data]).map((o, i) => ({ file: data.runs ? `${f}#${i + 1}` : f, o }));
});
const runs = observations.map(({ file, o }) => {
  const failed = {};
  for (const [id, , fn] of checks) {
    const err = fn(o);
    if (err) failed[id] = err;
  }
  return { file, failed };
});

const ids = checks.map(([id]) => id);
const rows = ids.map((id) => {
  const hits = runs.filter((r) => id in r.failed).length;
  const verdict = hits === 0 ? 'pass' : hits === runs.length ? 'FAIL (stable)' : 'UNSTABLE';
  const rule = checks.find(([i]) => i === id)[1];
  const detail = runs.find((r) => id in r.failed)?.failed[id] ?? '';
  return `| ${id} | ${rule} | ${hits}/${runs.length} | ${verdict} | ${detail.replace(/\|/g, '/')} |`;
});
const unstable = rows.filter((r) => r.includes('UNSTABLE')).length;
const report = `# Check report\n\nRuns: ${runs.length} (${runs.map((r) => r.file).join(', ')})\n\n| Check | Standard | Runs failing | Result | Example |\n|---|---|---|---|---|\n${rows.join('\n')}\n\n${unstable ? `${unstable} check(s) gave different results between runs: the agent or the page is not repeatable, do not trust those.` : 'Every check gave the same result in every run.'}\n`;
console.log(report);
fs.mkdirSync('evidence', { recursive: true });
fs.writeFileSync('evidence/check-report.md', report);
const verdicts = Object.fromEntries(ids.map((id, n) => [id, rows[n].split('|')[4].trim()]));
fs.writeFileSync('evidence/check-report.json', `${JSON.stringify({ runs: runs.length, verdicts }, null, 2)}\n`);
process.exit(rows.some((r) => !r.includes('| pass |')) ? 1 : 0);
