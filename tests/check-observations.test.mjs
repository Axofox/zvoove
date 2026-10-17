// Tests the checker with no browser and no AI: fixed observations must always give the same verdicts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const script = path.join(here, '..', '04-scripts', 'check-observations.mjs');

function check(fixture) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'check-'));
  const result = spawnSync('node', [script, path.join(here, 'fixtures', fixture)], { cwd, encoding: 'utf8' });
  const report = JSON.parse(fs.readFileSync(path.join(cwd, 'evidence', 'check-report.json'), 'utf8'));
  return { status: result.status, verdicts: report.verdicts };
}

const failing = (verdicts) => Object.entries(verdicts).filter(([, v]) => v !== 'pass');

test('a correct shop passes every check and exits 0', () => {
  const { status, verdicts } = check('all-pass');
  assert.deepEqual(failing(verdicts), []);
  assert.equal(status, 0);
});

test('lost last name fails the form, summary and confirmation checks in every run', () => {
  const { status, verdicts } = check('last-name-lost');
  assert.deepEqual(failing(verdicts).map(([id]) => id), ['form-retains-input', 'summary-reached', 'confirmation']);
  assert.ok(failing(verdicts).every(([, v]) => v === 'FAIL (stable)'));
  assert.equal(status, 1);
});

test('a wrong grand total is caught and nothing else fails', () => {
  const { verdicts } = check('wrong-total');
  assert.deepEqual(failing(verdicts), [['grand-total', 'FAIL (stable)']]);
});

test('a cart badge that is not cleared after the order is caught', () => {
  const { verdicts } = check('badge-stuck');
  assert.deepEqual(failing(verdicts), [['cart-cleared', 'FAIL (stable)']]);
});

test('runs that disagree are reported UNSTABLE, never as a stable failure', () => {
  const { status, verdicts } = check('flaky');
  assert.deepEqual(failing(verdicts).map(([id]) => id), ['form-retains-input', 'summary-reached', 'confirmation']);
  assert.ok(failing(verdicts).every(([, v]) => v === 'UNSTABLE'));
  assert.equal(status, 1);
});

test('the same input gives the same verdicts ten times', () => {
  const first = JSON.stringify(check('last-name-lost').verdicts);
  for (let i = 0; i < 9; i += 1) assert.equal(JSON.stringify(check('last-name-lost').verdicts), first);
});
