#!/usr/bin/env node
/**
 * TraceBridge AI — Weekly Sync Runner
 *
 * Designed to be called by a cron job (or GitHub Action / Render cron task).
 * Pulls only NEW records since the last successful run — keeps training data
 * current without re-downloading everything.
 *
 * Cron schedule (run every Sunday at 2am):
 *   0 2 * * 0  /path/to/node /path/to/weekly-sync.js >> /var/log/tracebridge-sync.log 2>&1
 *
 * GitHub Actions example (.github/workflows/fda-sync.yml):
 *   schedule:
 *     - cron: '0 2 * * 0'
 *   steps:
 *     - run: node weekly-sync.js
 *     - run: node ingest.js
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STATE_FILE  = './sync-state.json';
const OUTPUT_DIR  = './training-data';
const JSONL_FILE  = './rag-chunks.jsonl';

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return { last_run: '2020-01-01', runs: [] };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function main() {
  const state   = loadState();
  const fromDate = state.last_run;
  const today   = todayISO();

  console.log(`\n[${new Date().toISOString()}] TraceBridge weekly sync`);
  console.log(`  From: ${fromDate}  →  To: ${today}`);

  try {
    // Step 1: Scrape new records
    const scrapeCmd = [
      'node scraper.js',
      `--from ${fromDate}`,
      `--to ${today}`,
      '--se 50',
      '--nse 50',
      `--output ${OUTPUT_DIR}`,
    ].join(' ');

    console.log(`  Running: ${scrapeCmd}`);
    execSync(scrapeCmd, { stdio: 'inherit' });

    // Step 2: Re-run ingestion pipeline
    const ingestCmd = `node ingest.js --input ${OUTPUT_DIR} --output ${JSONL_FILE}`;
    console.log(`  Running: ${ingestCmd}`);
    execSync(ingestCmd, { stdio: 'inherit' });

    // Step 3: Update state
    state.last_run = today;
    state.runs.push({ date: today, from: fromDate, status: 'success' });
    saveState(state);

    console.log(`  ✓ Sync complete. State saved to ${STATE_FILE}`);

  } catch (err) {
    console.error(`  ✗ Sync failed: ${err.message}`);
    state.runs.push({ date: today, from: fromDate, status: 'failed', error: err.message });
    saveState(state);
    process.exit(1);
  }
}

main();
