#!/usr/bin/env node
/**
 * TraceBridge AI - FDA 510(k) Training Data Scraper
 *
 * Pulls cleared (SE) and failed (NSE) 510(k) submissions from the FDA's
 * public APIs, downloads decision PDFs, generates normalized metadata.json
 * for each record, and produces a matched-pairs report (same product code,
 * one SE + one NSE) - the highest-signal training data for gap analysis.
 *
 * Output structure:
 *   ./training-data/
 *     cleared/{K-number}_{product_code}_{year}/
 *       decision_summary.pdf
 *       metadata.json
 *     nse/{K-number}_{product_code}_{year}/
 *       nse_letter.pdf
 *       metadata.json
 *     matched_pairs.json          ← same product code, one SE + one NSE
 *     run_summary.json            ← stats from this run
 *
 * Usage:
 *   node scraper.js                          # default: 50 SE + 50 NSE
 *   node scraper.js --se 100 --nse 100       # custom counts
 *   node scraper.js --product-code FRN       # filter by product code
 *   node scraper.js --from 2020-01-01        # filter by date
 *   node scraper.js --dry-run                # metadata only, skip PDFs
 */

const fetch = require('node-fetch');
const fs    = require('fs');
const path  = require('path');

// ─────────────────────────── CLI args ──────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const hasFlag = (flag) => args.includes(flag);

const CONFIG = {
  seCount:      parseInt(getArg('--se',     '50'), 10),
  nseCount:     parseInt(getArg('--nse',    '50'), 10),
  productCode:  getArg('--product-code',    null),
  fromDate:     getArg('--from',            '2018-01-01'),
  toDate:       getArg('--to',              new Date().toISOString().slice(0, 10)),
  outputDir:    getArg('--output',          './training-data'),
  dryRun:       hasFlag('--dry-run'),
  delayMs:      parseInt(getArg('--delay',  '800'), 10),   // ms between PDF downloads
  maxRetries:   3,
};

// ─────────────────────────── Constants ─────────────────────────────────────

const OPENFDA_BASE = 'https://api.fda.gov/device/510k.json';

// SE decision codes in OpenFDA
const SE_CODES  = ['SESK', 'SESE', 'SESU', 'SESP', 'SESN', 'SESD'];
// NSE decision codes
const NSE_CODES = ['NSED', 'NSEN', 'NSES'];

// Standard → product code family mappings for deficiency tag inference
// (Heuristic - TraceBridge prompt engine handles the real logic)
const STANDARD_HINTS = {
  software:       ['QMB', 'QMF', 'QMG', 'QMH', 'IYO', 'NQB'],
  cybersecurity:  ['QMB', 'QMF', 'IYO'],
  biocompatibility:['FRN','KZE','LYZ','OZO','OZP'],
  electrical_safety: ['IYN','IYO','KZE'],
  sterility:      ['KZH','KZI','KZJ','GEI'],
  performance:    ['QMG','QMH','FRN','LYZ'],
};

// ─────────────────────────── Helpers ───────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function log(msg, level = 'info') {
  const prefix = { info: '  ·', ok: '  ✓', warn: '  ⚠', error: '  ✗', head: '\n──' };
  console.log(`${prefix[level] || '  ·'} ${msg}`);
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function sanitize(str) {
  return (str || 'unknown').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 40);
}

/** Extract 2-digit year from K-number (e.g. K221234 → '22') */
function kNumberYear(kNumber) {
  const match = (kNumber || '').match(/^[Kk](\d{2})/);
  return match ? match[1] : null;
}

/** Build the accessdata PDF URL for a cleared submission */
function pdfUrl(kNumber) {
  const yr = kNumberYear(kNumber);
  if (!yr) return null;
  return `https://www.accessdata.fda.gov/cdrh_docs/pdf${yr}/${kNumber.toUpperCase()}.pdf`;
}

/** Infer which regulatory standards are likely relevant based on product code */
function inferStandardHints(productCode) {
  const hints = [];
  for (const [standard, codes] of Object.entries(STANDARD_HINTS)) {
    if (codes.includes(productCode)) hints.push(standard);
  }
  return hints;
}

/** Map raw OpenFDA decision_code to a human label */
function decisionLabel(code) {
  if (SE_CODES.includes(code))  return 'SE';
  if (NSE_CODES.includes(code)) return 'NSE';
  return code || 'UNKNOWN';
}

// ─────────────────────────── OpenFDA query ─────────────────────────────────

async function fetchOpenFDA(decisionCodes, limit, skip = 0) {
  const codeFilter = decisionCodes.map(c => `"${c}"`).join(',');
  const dateFilter = `decision_date:[${CONFIG.fromDate.replace(/-/g,'')}+TO+${CONFIG.toDate.replace(/-/g,'')}]`;
  const productFilter = CONFIG.productCode ? `+AND+product_code:"${CONFIG.productCode}"` : '';

  const url =
    `${OPENFDA_BASE}` +
    `?search=decision_code:(${codeFilter})+AND+${dateFilter}${productFilter}` +
    `&limit=${Math.min(limit, 100)}&skip=${skip}` +
    `&sort=decision_date:desc`;

  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenFDA ${resp.status}: ${text.slice(0, 200)}`);
  }
  const json = await resp.json();
  return json.results || [];
}

/** Paginate OpenFDA to collect `total` records */
async function collectRecords(decisionCodes, total) {
  const records = [];
  let skip = 0;
  while (records.length < total) {
    const batch = await fetchOpenFDA(decisionCodes, Math.min(total - records.length, 100), skip);
    if (!batch.length) break;
    records.push(...batch);
    skip += batch.length;
    await sleep(300);
  }
  return records.slice(0, total);
}

// ─────────────────────────── PDF download ──────────────────────────────────

async function downloadPdf(url, destPath, retries = CONFIG.maxRetries) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(url, { timeout: 30000 });
      if (!resp.ok) return { ok: false, reason: `HTTP ${resp.status}` };
      const buffer = await resp.buffer();
      // Sanity-check: real PDFs start with %PDF
      if (buffer.slice(0, 4).toString() !== '%PDF') {
        return { ok: false, reason: 'Not a PDF (HTML or redirect)' };
      }
      fs.writeFileSync(destPath, buffer);
      return { ok: true, bytes: buffer.length };
    } catch (err) {
      if (attempt === retries) return { ok: false, reason: err.message };
      await sleep(1000 * attempt);
    }
  }
}

// ─────────────────────────── Metadata builder ──────────────────────────────

function buildMetadata(record, decision, pdfResult) {
  const productCode  = record.product_code || 'UNKNOWN';
  const standardHints = inferStandardHints(productCode);

  return {
    k_number:         record.k_number,
    device_name:      record.device_name,
    applicant:        record.applicant,
    product_code:     productCode,
    device_class:     record.device_class || null,
    decision:         decision,          // 'SE' | 'NSE'
    decision_code:    record.decision_code,
    decision_date:    record.decision_date,
    date_received:    record.date_received,
    regulation_number: record.regulation_number,
    submission_type:  record.submission_type_id,
    review_advisory_committee: record.review_advisory_committee,
    // Heuristic hints - used by TraceBridge RAG to select relevant standards
    inferred_standard_areas: standardHints,
    // Populated post-review by TraceBridge validation pipeline
    deficiency_tags:  [],
    // Source links
    source: {
      fda_db_url: `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=${record.k_number}`,
      openfda_url: `https://api.fda.gov/device/510k.json?search=k_number:"${record.k_number}"`,
      pdf_url:     pdfUrl(record.k_number),
    },
    pdf_downloaded:   pdfResult?.ok === true,
    pdf_size_bytes:   pdfResult?.bytes || null,
    pdf_skip_reason:  pdfResult?.reason || null,
    scraped_at:       new Date().toISOString(),
    tracebridge_schema_version: '1.0',
  };
}

// ─────────────────────────── Process one record ────────────────────────────

async function processRecord(record, category) {
  const decision   = decisionLabel(record.decision_code);
  const yr         = (record.decision_date || '').slice(0, 4);
  const folderName = `${record.k_number}_${sanitize(record.product_code)}_${yr}`;
  const dir        = path.join(CONFIG.outputDir, category, folderName);
  ensureDir(dir);

  let pdfResult = { ok: false, reason: 'dry-run' };

  if (!CONFIG.dryRun) {
    const url  = pdfUrl(record.k_number);
    const dest = path.join(dir, category === 'cleared' ? 'decision_summary.pdf' : 'nse_letter.pdf');
    if (url) {
      pdfResult = await downloadPdf(url, dest);
      await sleep(CONFIG.delayMs);
    } else {
      pdfResult = { ok: false, reason: 'Could not construct PDF URL' };
    }
  }

  const meta = buildMetadata(record, decision, pdfResult);
  fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify(meta, null, 2));

  return { folderName, dir, meta, pdfOk: pdfResult.ok };
}

// ─────────────────────────── Matched pairs ─────────────────────────────────

function buildMatchedPairs(seRecords, nseRecords) {
  const seByCode  = {};
  const nseByCode = {};

  for (const r of seRecords)  (seByCode[r.product_code]  = seByCode[r.product_code]  || []).push(r);
  for (const r of nseRecords) (nseByCode[r.product_code] = nseByCode[r.product_code] || []).push(r);

  const pairs = [];
  for (const code of Object.keys(seByCode)) {
    if (nseByCode[code]) {
      pairs.push({
        product_code: code,
        cleared: seByCode[code].map(r => r.k_number),
        failed:  nseByCode[code].map(r => r.k_number),
        note: 'Same product code - cleared vs. failed. High-signal training pair.',
      });
    }
  }
  return pairs;
}

// ─────────────────────────── Main ──────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   TraceBridge AI - FDA 510(k) Training Data Scraper  ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  log(`Date range : ${CONFIG.fromDate} → ${CONFIG.toDate}`);
  log(`Target     : ${CONFIG.seCount} cleared (SE) + ${CONFIG.nseCount} failed (NSE)`);
  log(`Product code filter: ${CONFIG.productCode || 'none (all)'}`);
  log(`Dry run    : ${CONFIG.dryRun ? 'YES (no PDFs downloaded)' : 'NO'}`);
  log(`Output dir : ${path.resolve(CONFIG.outputDir)}`);

  ensureDir(path.join(CONFIG.outputDir, 'cleared'));
  ensureDir(path.join(CONFIG.outputDir, 'nse'));

  // ── 1. Fetch metadata from OpenFDA ───────────────────────────────────────

  log('Fetching cleared (SE) records from OpenFDA...', 'head');
  let seRecords;
  try {
    seRecords = await collectRecords(SE_CODES, CONFIG.seCount);
    log(`Retrieved ${seRecords.length} SE records`, 'ok');
  } catch (err) {
    log(`Failed to fetch SE records: ${err.message}`, 'error');
    seRecords = [];
  }

  log('Fetching NSE records from OpenFDA...', 'head');
  let nseRecords;
  try {
    nseRecords = await collectRecords(NSE_CODES, CONFIG.nseCount);
    log(`Retrieved ${nseRecords.length} NSE records`, 'ok');
  } catch (err) {
    log(`Failed to fetch NSE records: ${err.message}`, 'error');
    nseRecords = [];
  }

  // ── 2. Process + download ─────────────────────────────────────────────────

  const stats = { se: { total: 0, pdfOk: 0, pdfFail: 0 }, nse: { total: 0, pdfOk: 0, pdfFail: 0 } };

  log(`Processing ${seRecords.length} cleared submissions...`, 'head');
  for (let i = 0; i < seRecords.length; i++) {
    const r = seRecords[i];
    process.stdout.write(`\r  [${i + 1}/${seRecords.length}] ${r.k_number} - ${(r.device_name || '').slice(0, 40).padEnd(40)}`);
    try {
      const result = await processRecord(r, 'cleared');
      stats.se.total++;
      result.pdfOk ? stats.se.pdfOk++ : stats.se.pdfFail++;
    } catch (err) {
      log(`\n  Error on ${r.k_number}: ${err.message}`, 'error');
    }
  }
  console.log();

  log(`Processing ${nseRecords.length} NSE submissions...`, 'head');
  for (let i = 0; i < nseRecords.length; i++) {
    const r = nseRecords[i];
    process.stdout.write(`\r  [${i + 1}/${nseRecords.length}] ${r.k_number} - ${(r.device_name || '').slice(0, 40).padEnd(40)}`);
    try {
      const result = await processRecord(r, 'nse');
      stats.nse.total++;
      result.pdfOk ? stats.nse.pdfOk++ : stats.nse.pdfFail++;
    } catch (err) {
      log(`\n  Error on ${r.k_number}: ${err.message}`, 'error');
    }
  }
  console.log();

  // ── 3. Matched pairs ──────────────────────────────────────────────────────

  log('Building matched pairs (same product code, SE + NSE)...', 'head');
  const pairs = buildMatchedPairs(seRecords, nseRecords);
  fs.writeFileSync(
    path.join(CONFIG.outputDir, 'matched_pairs.json'),
    JSON.stringify({ generated_at: new Date().toISOString(), count: pairs.length, pairs }, null, 2)
  );
  log(`Found ${pairs.length} matched pairs`, pairs.length > 0 ? 'ok' : 'warn');

  // ── 4. Run summary ────────────────────────────────────────────────────────

  const summary = {
    generated_at:  new Date().toISOString(),
    config:        CONFIG,
    results: {
      cleared: stats.se,
      nse:     stats.nse,
      matched_pairs: pairs.length,
    },
    output_dir: path.resolve(CONFIG.outputDir),
    next_steps: [
      '1. Review matched_pairs.json - these are your highest-signal training records',
      '2. Manually annotate deficiency_tags[] in each NSE metadata.json',
      '3. Feed cleared + NSE pairs into TraceBridge RAG ingestion pipeline',
      '4. Re-run weekly with --from set to last run date to stay current',
    ],
  };

  fs.writeFileSync(
    path.join(CONFIG.outputDir, 'run_summary.json'),
    JSON.stringify(summary, null, 2)
  );

  // ── 5. Print summary ──────────────────────────────────────────────────────

  console.log('\n╔══════════════════════ Run Complete ══════════════════════╗');
  console.log(`║  Cleared (SE) : ${String(stats.se.total).padStart(4)} records  |  PDFs: ${stats.se.pdfOk} ok / ${stats.se.pdfFail} failed`);
  console.log(`║  NSE          : ${String(stats.nse.total).padStart(4)} records  |  PDFs: ${stats.nse.pdfOk} ok / ${stats.nse.pdfFail} failed`);
  console.log(`║  Matched pairs: ${String(pairs.length).padStart(4)}`);
  console.log(`║  Output       : ${path.resolve(CONFIG.outputDir)}`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');
}

main().catch(err => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
