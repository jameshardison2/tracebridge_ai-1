#!/usr/bin/env node
/**
 * TraceBridge AI — Training Data Ingestion Pipeline
 *
 * Reads the training-data/ folder produced by scraper.js and:
 *   1. Validates metadata.json schema for each record
 *   2. Extracts text from PDFs (if present)
 *   3. Outputs ingestion-ready JSONL — one record per line — for RAG indexing
 *   4. Produces a validation report flagging bad/missing records
 *
 * Usage:
 *   node ingest.js                              # process all records
 *   node ingest.js --input ./training-data      # custom input dir
 *   node ingest.js --output ./rag-chunks.jsonl  # custom output file
 *   node ingest.js --validate-only              # report without writing output
 */

const fs   = require('fs');
const path = require('path');

// ─── CLI ────────────────────────────────────────────────────────────────────

const args     = process.argv.slice(2);
const getArg   = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag  = (flag) => args.includes(flag);

const INPUT_DIR      = getArg('--input',  './training-data');
const OUTPUT_FILE    = getArg('--output', './rag-chunks.jsonl');
const VALIDATE_ONLY  = hasFlag('--validate-only');

// ─── Schema validator ────────────────────────────────────────────────────────

const REQUIRED_FIELDS = ['k_number','device_name','product_code','decision','decision_date'];

function validateMetadata(meta, filePath) {
  const errors = [];
  for (const f of REQUIRED_FIELDS) {
    if (!meta[f]) errors.push(`Missing required field: ${f}`);
  }
  if (!['SE','NSE'].includes(meta.decision)) errors.push(`Invalid decision: ${meta.decision}`);
  return errors;
}

// ─── Text extraction (lightweight — no external deps) ────────────────────────
// For production, pipe through a proper PDF text extractor (pdfjs, pdf-parse, etc.)
// This fallback reads any .txt sidecar if present, otherwise notes PDF-only.

function extractText(dir) {
  const txtPath = path.join(dir, 'extracted_text.txt');
  if (fs.existsSync(txtPath)) {
    return fs.readFileSync(txtPath, 'utf8').slice(0, 50000); // cap at ~50k chars
  }
  // Check for PDF existence for downstream processing note
  const pdfFiles = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
  if (pdfFiles.length) return `[PDF present — run pdf-extract pipeline on ${pdfFiles[0]}]`;
  return null;
}

// ─── Build RAG chunk ─────────────────────────────────────────────────────────

function buildChunk(meta, text, category) {
  return {
    // Identity
    id:               `tracebridge:${meta.k_number}`,
    k_number:         meta.k_number,
    category:         category,                // 'cleared' | 'nse'
    decision:         meta.decision,

    // Device context — used for retrieval filtering
    product_code:     meta.product_code,
    device_class:     meta.device_class,
    device_name:      meta.device_name,
    submission_type:  meta.submission_type,
    decision_date:    meta.decision_date,

    // Regulatory standard hints — used to route to correct gap-analysis prompt
    inferred_standard_areas: meta.inferred_standard_areas || [],
    deficiency_tags:         meta.deficiency_tags || [],

    // Source content for RAG embedding
    text_content: text,
    text_source:  text
      ? (text.startsWith('[PDF') ? 'pdf_pending' : 'extracted')
      : 'none',

    // Source links (kept for attribution in TraceBridge UI)
    source: meta.source,

    // Ingestion metadata
    ingested_at:      new Date().toISOString(),
    schema_version:   '1.0',
  };
}

// ─── Walk training-data directory ────────────────────────────────────────────

function walkCategory(categoryDir, category) {
  if (!fs.existsSync(categoryDir)) return [];
  const records = [];

  for (const folder of fs.readdirSync(categoryDir)) {
    const dir      = path.join(categoryDir, folder);
    const metaPath = path.join(dir, 'metadata.json');
    if (!fs.statSync(dir).isDirectory() || !fs.existsSync(metaPath)) continue;

    let meta;
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } catch (err) {
      records.push({ ok: false, folder, errors: [`Invalid JSON: ${err.message}`] });
      continue;
    }

    const errors = validateMetadata(meta, metaPath);
    const text   = extractText(dir);
    const chunk  = buildChunk(meta, text, category);

    records.push({ ok: errors.length === 0, folder, errors, chunk, meta });
  }

  return records;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║   TraceBridge AI — RAG Ingestion Pipeline              ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  const clearedRecords = walkCategory(path.join(INPUT_DIR, 'cleared'), 'cleared');
  const nseRecords     = walkCategory(path.join(INPUT_DIR, 'nse'),     'nse');
  const all            = [...clearedRecords, ...nseRecords];

  const valid   = all.filter(r => r.ok);
  const invalid = all.filter(r => !r.ok);

  console.log(`  Records found    : ${all.length}`);
  console.log(`  Valid            : ${valid.length}`);
  console.log(`  Invalid/errors   : ${invalid.length}`);

  if (invalid.length) {
    console.log('\n  ── Validation Errors ──');
    for (const r of invalid) {
      console.log(`  ✗ ${r.folder}`);
      for (const e of r.errors) console.log(`      ${e}`);
    }
  }

  if (VALIDATE_ONLY) {
    console.log('\n  Validate-only mode — no output written.\n');
    return;
  }

  // Write JSONL
  const lines = valid.map(r => JSON.stringify(r.chunk));
  fs.writeFileSync(OUTPUT_FILE, lines.join('\n') + '\n');

  // Stats breakdown
  const cleared = valid.filter(r => r.chunk.decision === 'SE').length;
  const nse     = valid.filter(r => r.chunk.decision === 'NSE').length;
  const withText = valid.filter(r => r.chunk.text_content && !r.chunk.text_content.startsWith('[PDF')).length;
  const pdfPending = valid.filter(r => r.chunk.text_source === 'pdf_pending').length;

  console.log(`\n  ── Output ──`);
  console.log(`  JSONL file  : ${path.resolve(OUTPUT_FILE)}`);
  console.log(`  Chunks      : ${valid.length} (${cleared} SE, ${nse} NSE)`);
  console.log(`  Text ready  : ${withText} records`);
  console.log(`  PDF pending : ${pdfPending} (need pdf-extract run)`);

  // Write validation report
  const reportPath = path.join(INPUT_DIR, 'ingestion_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    generated_at:  new Date().toISOString(),
    total:         all.length,
    valid:         valid.length,
    invalid:       invalid.length,
    output_file:   path.resolve(OUTPUT_FILE),
    invalid_records: invalid.map(r => ({ folder: r.folder, errors: r.errors })),
    next_steps: [
      `Feed ${path.resolve(OUTPUT_FILE)} into your RAG embedding pipeline`,
      'For records with text_source=pdf_pending, run: node pdf-extract.js',
      'Manually populate deficiency_tags[] in NSE metadata.json files for supervised training',
    ],
  }, null, 2));

  console.log(`  Report      : ${reportPath}`);
  console.log('\n  Done.\n');
}

main();
