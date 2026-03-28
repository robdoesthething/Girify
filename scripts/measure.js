#!/usr/bin/env node
/**
 * IMMUTABLE EVALUATION HARNESS — DO NOT MODIFY
 *
 * This file is the ground truth for autoresearch. It defines what "better" means.
 * The agent is forbidden from modifying this file. Ever.
 *
 * Metric: total_gz_kb — total gzipped size of all JS assets in dist/assets/
 *         Lower is better. Chunk count and names don't matter — only the sum.
 *
 * Usage:
 *   node scripts/measure.js > run.log 2>&1
 *   grep "^total_gz_kb:" run.log
 */

import { spawnSync } from 'child_process';
import { readdirSync, readFileSync } from 'fs';
import { gzipSync } from 'zlib';
import { join } from 'path';

const startMs = Date.now();

// Run the production build.
// Force SENTRY_AUTH_TOKEN empty so the Sentry upload plugin is disabled
// (it would fail without credentials and is not part of what we're measuring).
const result = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, SENTRY_AUTH_TOKEN: '' },
});

if (result.status !== 0) {
  console.log('build_status: FAILED');
  process.exit(1);
}

const buildMs = Date.now() - startMs;

// Measure every .js file in dist/assets/ by compressing it ourselves.
// We use zlib level 9 (max) for a consistent, reproducible number across runs.
const distAssets = join(process.cwd(), 'dist', 'assets');
let totalGzBytes = 0;
const chunks = [];

for (const file of readdirSync(distAssets)) {
  if (!file.endsWith('.js')) continue;
  const content = readFileSync(join(distAssets, file));
  const gzipped = gzipSync(content, { level: 9 });
  const gzKb = gzipped.length / 1024;
  totalGzBytes += gzipped.length;
  chunks.push({ file, gzKb });
}

chunks.sort((a, b) => b.gzKb - a.gzKb);

const totalGzKb = totalGzBytes / 1024;
const buildSeconds = buildMs / 1000;

// ---- OUTPUT (agent reads these lines via grep) ----
console.log('---');
console.log(`total_gz_kb:    ${totalGzKb.toFixed(2)}`);
console.log(`build_seconds:  ${buildSeconds.toFixed(1)}`);
console.log(`chunk_count:    ${chunks.length}`);
console.log('---');
console.log('breakdown (gzip level 9):');
for (const { file, gzKb } of chunks) {
  console.log(`  ${gzKb.toFixed(2).padStart(8)} kB  ${file}`);
}
