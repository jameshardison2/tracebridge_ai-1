# TraceBridge AI: BU Spark Collaboration Guide

How the BU Spark Fall 2026 team works in this repository: branches, pull requests, data, and confidentiality.

## 1. Branches

| Branch | Purpose | Deploys to | Rules |
| --- | --- | --- | --- |
| `main` | Live product | tracebridge.ai (Vercel) | Protected. No direct pushes. James merges releases. |
| `bu-spark` | Team integration branch | Vercel preview | Students open pull requests here. |
| `spark/<feature>` | Individual or pair work, branched from `bu-spark` | Local or Vercel preview | Delete after merge. |

## 2. Quick start

```bash
git clone https://github.com/tracebridgeai-lab/tracebridge_ai.git
cd tracebridge_ai
npm ci
cp .env.example .env.local        # fill in the values shared with you privately
git checkout bu-spark
git pull origin bu-spark
git checkout -b spark/<your-feature>   # e.g. spark/fda-scraper, spark/eval-metrics
npm run dev
```

Set `GEMINI_MOCK_MODE="true"` if you are working without a Gemini key.

## 3. Pull requests

1. Run `npm run build` locally; it must pass. Run `npx eslint <files you changed>` and fix any errors in those files. The codebase has older lint errors being cleaned up separately; do not add new ones.
2. Push your branch: `git push -u origin spark/<your-feature>`.
3. Open a pull request with base `bu-spark`, never `main`.
4. In the description, state the problem solved, how you tested it, and any dataset changes.
5. At least one teammate reviews before merge.

## 4. Semester workstreams

Deliverables come from the Student Educational Project Agreement.

| Workstream | Deliverable | Starting point |
| --- | --- | --- |
| Data | FDA accessdata scraper and ~80,000-record 510(k) index (Milestone 1) | `src/pipeline/` |
| Retrieval | Vector database seeding scripts | `src/pipeline/ingest.js`, `scripts/` |
| Engine | Gap-detection pipeline with a source citation on every finding | `src/lib/gap-engine.ts`, `src/app/api/v2/evaluate/` |
| Evaluation | Precision, recall, and accuracy against the ground-truth answer key | `scripts/eval-engine.ts`, `FDA_Test_Dossiers/` |
| Stretch | Cross-document consistency checks | `src/app/api/v2/evaluate/coherence/` |

## 5. Data rules

- GitHub rejects files over 100 MB. Large corpora (for example the filtered 510(k) JSONL, about 500 MB) stay out of git and are shared through the team drive.
- `*.jsonl`, `*.zip`, and archive files are git-ignored. Do not force-add them.
- Only public FDA data and synthetic documents belong in this repository.
- The ground-truth answer key and mock submissions with planted gaps are shared with the team separately.

## 6. Confidentiality and security

This project runs under the Student Educational Project Agreement, which includes a mutual confidentiality clause.

- Do not share non-public project material outside the team, BU Spark staff, and James.
- Never commit API keys, tokens, passwords, or `.env` files. Report any accidental commit to James immediately.
- Competitor research uses public sources only.
