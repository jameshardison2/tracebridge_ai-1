# TraceBridge AI — FDA 510(k) Training Data Scraper

Pulls publicly available 510(k) submission data from the FDA's OpenFDA API
and accessdata portal, structures it for ongoing RAG training, and keeps
the dataset current via a weekly sync runner.

---

## Quick Start

```bash
npm install

# First run — pull 50 cleared + 50 NSE, last 5 years
node scraper.js

# Metadata only, no PDF downloads (fast test)
node scraper.js --dry-run

# Targeted run — specific product code, last 2 years
node scraper.js --product-code FRN --from 2023-01-01 --se 100 --nse 100

# Convert scraped data → RAG-ready JSONL
node ingest.js

# Weekly incremental sync (runs scraper + ingest, tracks last-run date)
node weekly-sync.js
```

---

## Output Structure

```
training-data/
  cleared/
    K241234_FRN_2024/
      decision_summary.pdf       ← actual FDA submission PDF (FOIA-released)
      metadata.json              ← normalized record
  nse/
    K221111_FRN_2022/
      nse_letter.pdf
      metadata.json
  matched_pairs.json             ← same product code, SE + NSE pairs
  run_summary.json               ← stats from last scraper run
  ingestion_report.json          ← stats from last ingest run

rag-chunks.jsonl                 ← feed this into your RAG embedder
sync-state.json                  ← tracks last-run date for incremental sync
```

---

## metadata.json Schema

```json
{
  "k_number":         "K241234",
  "device_name":      "Cardiac Monitor XR",
  "applicant":        "Acme Medical Devices",
  "product_code":     "FRN",
  "device_class":     "2",
  "decision":         "SE",
  "decision_code":    "SESK",
  "decision_date":    "20240315",
  "date_received":    "20231201",
  "regulation_number":"870.2340",
  "submission_type":  "Traditional",
  "inferred_standard_areas": ["electrical_safety"],

  "deficiency_tags":  [],
  ← MANUALLY POPULATE for NSE records — this is your supervised training signal
    Example values: "missing_risk_analysis", "inadequate_IEC62304_traceability",
    "no_biocompatibility_data", "cybersecurity_plan_absent", etc.

  "source": {
    "fda_db_url": "https://www.accessdata.fda.gov/scripts/cdrh/...",
    "pdf_url":    "https://www.accessdata.fda.gov/cdrh_docs/pdf24/K241234.pdf"
  },
  "pdf_downloaded": true,
  "scraped_at": "2026-05-01T00:00:00Z"
}
```

---

## Priority: Annotate deficiency_tags on NSE Records

The `deficiency_tags[]` array in each NSE `metadata.json` is your ground truth
for supervised training. After scraping, manually review each NSE letter and
tag the deficiencies using a consistent vocabulary:

| Tag | Meaning |
|-----|---------|
| `missing_risk_analysis` | No ISO 14971 risk management file |
| `inadequate_SE_argument` | Substantial equivalence not demonstrated |
| `missing_performance_testing` | No bench/clinical testing data |
| `software_doc_absent` | No IEC 62304 lifecycle documentation |
| `cybersecurity_plan_absent` | No cybersecurity documentation (SaMD) |
| `no_biocompatibility_data` | ISO 10993 testing missing |
| `electrical_safety_missing` | IEC 60601 data absent |
| `labeling_deficiency` | Indications/warnings incomplete |
| `predicate_mismatch` | Predicate device not substantially equivalent |
| `sterility_data_missing` | Sterility/bioburden data absent |

---

## Matched Pairs — Highest-Signal Training Data

`matched_pairs.json` lists product codes where you have BOTH a cleared AND a
failed submission. These are the most valuable training records because device
type is controlled — the only variable is submission quality.

Prioritize manually annotating the NSE records in matched pairs first.

---

## Ongoing Sync (post-deployment)

Add to cron or GitHub Actions:

```
# Every Sunday at 2am
0 2 * * 0  node /path/to/weekly-sync.js >> sync.log 2>&1
```

`weekly-sync.js` reads `sync-state.json` to know the last successful run date
and only fetches new records, so you're never re-downloading the full dataset.

---

## Notes

- PDFs come from FDA's FOIA-released documents — all public domain
- NSE letters are publicly available but less consistently linked than cleared ones
- RTA letters require direct FOIA requests to CDRH-FOIStatus@fda.hhs.gov
- OpenFDA API is rate-limited to ~240 requests/minute; the scraper respects this
