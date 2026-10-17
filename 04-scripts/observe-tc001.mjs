// Deterministic reference observer: runs the TC-001 happy flow on SauceDemo and records facts as JSON.
// It never decides pass or fail; 04-scripts/check-observations.mjs does.
// Usage: node 04-scripts/observe-tc001.mjs --user problem_user --runs 10 --out evidence/observations/problem_user
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const user = arg('user', 'problem_user');
const runs = Number(arg('runs', '3'));
const out = arg('out', `evidence/observations/${user}`);
const baseUrl = 'https://www.saucedemo.com/';
const products = ['Sauce Labs Backpack', 'Sauce Labs Bike Light'];
const customer = { firstName: 'Alex', lastName: 'Tester', postalCode: '12345' };

const money = (text) => Number(text.replace(/[^0-9.]/g, ''));
const slug = (name) => name.toLowerCase().replace(/ /g, '-');

async function badgeCount(page) {
  const badge = page.locator('[data-test="shopping-cart-badge"]');
  return (await badge.count()) ? Number(await badge.innerText()) : 0;
}

async function observeOnce(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(baseUrl);
  await page.fill('[data-test="username"]', user);
  await page.fill('[data-test="password"]', 'secret_sauce');
  await page.click('[data-test="login-button"]');
  await page.waitForSelector('[data-test="inventory-container"]');

  const listingPrices = {};
  for (const name of products) {
    const item = page.locator('[data-test="inventory-item"]', { hasText: name });
    listingPrices[name] = money(await item.locator('[data-test="inventory-item-price"]').innerText());
  }
  for (const name of products) {
    await page.click(`[data-test="add-to-cart-${slug(name)}"]`);
  }

  await page.click('[data-test="shopping-cart-link"]');
  await page.waitForSelector('[data-test="cart-list"]');
  const cartBadge = await badgeCount(page);
  const cart = [];
  for (const row of await page.locator('[data-test="inventory-item"]').all()) {
    cart.push({
      name: await row.locator('[data-test="inventory-item-name"]').innerText(),
      price: money(await row.locator('[data-test="inventory-item-price"]').innerText()),
      qty: Number(await row.locator('[data-test="item-quantity"]').innerText()),
    });
  }

  await page.click('[data-test="checkout"]');
  const typed = {};
  for (const [field, value] of Object.entries(customer)) {
    await page.fill(`[data-test="${field}"]`, value);
    typed[field] = value;
  }
  const retained = {};
  for (const field of Object.keys(customer)) {
    retained[field] = await page.inputValue(`[data-test="${field}"]`);
  }
  await page.click('[data-test="continue"]');

  let summary = null;
  if (await page.locator('[data-test="subtotal-label"]').count()) {
    summary = {
      itemTotal: money(await page.locator('[data-test="subtotal-label"]').innerText()),
      tax: money(await page.locator('[data-test="tax-label"]').innerText()),
      total: money(await page.locator('[data-test="total-label"]').innerText()),
    };
  }

  let shown = false;
  if (summary) {
    await page.click('[data-test="finish"]');
    shown = (await page.locator('[data-test="complete-header"]').count()) > 0;
  }
  const badgeAfter = await badgeCount(page);
  await context.close();
  return { added: products, listingPrices, cartBadge, cart, form: { typed, retained }, summary, confirmation: { shown, badgeAfter } };
}

fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (let i = 1; i <= runs; i += 1) {
  const observation = await observeOnce(browser);
  fs.writeFileSync(path.join(out, `run-${String(i).padStart(2, '0')}.json`), `${JSON.stringify({ user, ...observation }, null, 2)}\n`);
  console.log(`run ${i}/${runs} recorded`);
}
await browser.close();
