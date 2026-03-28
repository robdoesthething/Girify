#!/usr/bin/env node
/**
 * IMMUTABLE QUALITY GATE — DO NOT MODIFY
 *
 * This file is the evaluation harness for the UX/game-feel autoresearch loop.
 * The agent is forbidden from modifying this file. Ever.
 *
 * A change is KEPT if and only if quality_status is PASS.
 * A change is DISCARDED if quality_status is FAIL.
 *
 * Usage:
 *   node scripts/quality.js > quality.log 2>&1
 *   grep "^quality_status:" quality.log
 */

import { spawnSync } from 'child_process';

const checks = [
  { name: 'type-check', args: ['run', 'type-check'] },
  { name: 'lint', args: ['run', 'lint'] },
  { name: 'test', args: ['test', '--', '--run'] },
];

const results = [];
let anyFailed = false;

for (const check of checks) {
  const result = spawnSync('npm', check.args, {
    stdio: 'pipe',
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0' },
  });

  const passed = result.status === 0;
  if (!passed) anyFailed = true;

  results.push({
    name: check.name,
    status: passed ? 'PASS' : 'FAIL',
    stderr: result.stderr?.trim().slice(0, 500) ?? '',
    stdout: result.stdout?.trim().slice(-500) ?? '',
  });
}

// ---- OUTPUT (agent reads quality_status via grep) ----
console.log('---');
console.log(`quality_status: ${anyFailed ? 'FAIL' : 'PASS'}`);
for (const r of results) {
  console.log(`  ${r.name.padEnd(12)} ${r.status}`);
}
console.log('---');

if (anyFailed) {
  for (const r of results.filter(r => r.status === 'FAIL')) {
    console.log(`\n[FAIL] ${r.name}:`);
    if (r.stdout) console.log(r.stdout);
    if (r.stderr) console.log(r.stderr);
  }
}
