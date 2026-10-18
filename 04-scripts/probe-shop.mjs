// Probing stage: runs the extra cases from 02-rules/test-types.md against SauceDemo and records facts.
// Every probe starts in a fresh, logged-in browser context, so one defect cannot hide the others.
// It never decides pass or fail; 04-scripts/check-probes.mjs does.
// Usage: node 04-scripts/probe-shop.mjs --user problem_user --runs 10 --out evidence/probes/problem_user
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const user = arg('user', 'problem_user');
const runs = Number(arg('runs', '3'));
const out = arg('out', `evidence/probes/${user}`);
const baseUrl = 'https://www.saucedemo.com/';
const backpack = 'sauce-labs-backpack';
const bikeLight = 'sauce-labs-bike-light';
const money = (text) => Number(text.replace(/[^0-9.]/g, ''));

async function open(browser, viewport = { width: 1280, height: 720 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const events = { dialogs: [], pageErrors: [] };
  page.on('dialog', (dialog) => {
    events.dialogs.push(dialog.message());
    dialog.dismiss().catch(() => {});
  });
  page.on('pageerror', (error) => events.pageErrors.push(error.message));
  await page.goto(baseUrl);
  await page.fill('[data-test="username"]', user);
  await page.fill('[data-test="password"]', 'secret_sauce');
  await page.click('[data-test="login-button"]');
  await page.waitForSelector('[data-test="inventory-container"]');
  return { context, page, events };
}

const badge = async (page) => {
  const el = page.locator('[data-test="shopping-cart-badge"]');
  return (await el.count()) ? Number(await el.innerText()) : 0;
};
const cartNames = (page) => page.locator('[data-test="inventory-item-name"]').allInnerTexts();

async function openCart(page) {
  await page.click('[data-test="shopping-cart-link"]');
  await page.waitForSelector('[data-test="cart-list"]');
}

async function toCheckoutForm(page) {
  await page.click(`[data-test="add-to-cart-${backpack}"]`);
  await openCart(page);
  await page.click('[data-test="checkout"]');
  await page.waitForSelector('[data-test="continue"]');
}

// Waits until the page settles after pressing Continue: the summary page or the error banner.
async function pressContinue(page) {
  await page.click('[data-test="continue"]');
  await Promise.race([
    page.waitForURL(/checkout-step-two/),
    page.locator('[data-test="error"]').waitFor(),
  ]).catch(() => {});
}

const errorText = async (page) => {
  const el = page.locator('[data-test="error"]');
  return (await el.count()) ? el.innerText() : null;
};

const probes = {
  async sorting(browser) {
    const { context, page } = await open(browser);
    const select = page.locator('[data-test="product-sort-container"]');
    const result = {};
    for (const option of ['az', 'za', 'lohi', 'hilo']) {
      await select.selectOption(option);
      result[option] = {
        names: await page.locator('[data-test="inventory-item-name"]').allInnerTexts(),
        prices: (await page.locator('[data-test="inventory-item-price"]').allInnerTexts()).map(money),
      };
    }
    await context.close();
    return result;
  },

  async listing(browser) {
    const { context, page } = await open(browser);
    const items = [];
    for (const item of await page.locator('[data-test="inventory-item"]').all()) {
      items.push({
        name: await item.locator('[data-test="inventory-item-name"]').innerText(),
        image: await item.locator('img').first().getAttribute('src'),
        description: await item.locator('[data-test="inventory-item-desc"]').innerText(),
      });
    }
    await context.close();
    return { items };
  },

  async cartRemoval(browser) {
    const { context, page } = await open(browser);
    await page.click(`[data-test="add-to-cart-${backpack}"]`);
    await page.click(`[data-test="add-to-cart-${bikeLight}"]`);
    await openCart(page);
    const start = { names: await cartNames(page), badge: await badge(page) };
    await page.click(`[data-test="remove-${bikeLight}"]`);
    const afterOne = { names: await cartNames(page), badge: await badge(page) };
    await page.click(`[data-test="remove-${backpack}"]`);
    const afterAll = { names: await cartNames(page), badge: await badge(page) };
    await context.close();
    return { start, afterOne, afterAll };
  },

  async addTwice(browser) {
    const { context, page } = await open(browser);
    await page.click(`[data-test="add-to-cart-${backpack}"]`);
    const secondAddControl = (await page.locator(`[data-test="add-to-cart-${backpack}"]`).count()) > 0;
    if (secondAddControl) await page.click(`[data-test="add-to-cart-${backpack}"]`);
    const badgeCount = await badge(page);
    await context.close();
    return { secondAddControl, badge: badgeCount };
  },

  async requiredFields(browser) {
    const { context, page } = await open(browser);
    await toCheckoutForm(page);
    const result = {};
    await pressContinue(page);
    result.empty = { error: await errorText(page), url: page.url() };
    await page.fill('[data-test="firstName"]', 'Alex');
    await pressContinue(page);
    result.firstNameOnly = { error: await errorText(page), url: page.url() };
    await page.fill('[data-test="lastName"]', 'Tester');
    await pressContinue(page);
    result.noPostalCode = { error: await errorText(page), url: page.url() };
    await context.close();
    return result;
  },

  async hostileInput(browser) {
    const payloads = {
      script: '<script>alert(1)</script>',
      image: '<img src=x onerror="alert(1)">',
      long: 'A'.repeat(600),
      special: `' " ; -- \\ /`,
    };
    const result = {};
    for (const [name, value] of Object.entries(payloads)) {
      const { context, page, events } = await open(browser);
      await toCheckoutForm(page);
      for (const field of ['firstName', 'lastName', 'postalCode']) await page.fill(`[data-test="${field}"]`, value);
      await pressContinue(page);
      await page.waitForTimeout(500);
      result[name] = {
        dialogs: events.dialogs,
        pageErrors: events.pageErrors,
        url: page.url(),
        pageHasText: (await page.locator('body').innerText()).trim().length > 0,
      };
      await context.close();
    }
    return result;
  },

  async refresh(browser) {
    const { context, page } = await open(browser);
    await toCheckoutForm(page);
    const badgeBefore = await badge(page);
    await page.fill('[data-test="firstName"]', 'Alex');
    await page.reload();
    await page.waitForSelector('[data-test="continue"]');
    const result = {
      badgeBefore,
      badgeAfter: await badge(page),
      url: page.url(),
      firstNameAfter: await page.inputValue('[data-test="firstName"]'),
    };
    await context.close();
    return result;
  },

  async shortScreen(browser) {
    const height = 700;
    const { context, page } = await open(browser, { width: 1280, height });
    const inView = async (selector) => {
      const box = await page.locator(selector).boundingBox();
      return Boolean(box) && box.y >= 0 && box.y + box.height <= height;
    };
    await page.click(`[data-test="add-to-cart-${backpack}"]`);
    await openCart(page);
    const checkoutInView = await inView('[data-test="checkout"]');
    await page.click('[data-test="checkout"]');
    await page.waitForSelector('[data-test="continue"]');
    const continueInView = await inView('[data-test="continue"]');
    await context.close();
    return { viewportHeight: height, checkoutInView, continueInView };
  },
};

fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (let i = 1; i <= runs; i += 1) {
  const result = { user, probes: {} };
  for (const [name, probe] of Object.entries(probes)) {
    try {
      result.probes[name] = await probe(browser);
    } catch (error) {
      result.probes[name] = { error: String(error.message).split('\n')[0] };
    }
  }
  fs.writeFileSync(path.join(out, `run-${String(i).padStart(2, '0')}.json`), `${JSON.stringify(result, null, 2)}\n`);
  const failed = Object.entries(result.probes).filter(([, p]) => p.error).map(([n, p]) => `${n}: ${p.error}`);
  console.log(`run ${i}/${runs} recorded${failed.length ? `; probes that did not complete: ${failed.join(' | ')}` : ''}`);
}
await browser.close();
