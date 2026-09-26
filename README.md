# TraceBridge AI

Pre-submission audit for FDA 510(k) packages. TraceBridge checks that a submission's evidence hangs together across documents (intended use, risk controls, requirements, verification) and flags gaps against FDA guidance and the RTA checklist, with source citations.

Status: private beta. Live at [tracebridge.ai](https://tracebridge.ai).

> **BU Spark contributors:** read the [BU Spark collaboration guide](BU_SPARK_WORKFLOW.md) before starting. All student pull requests target the `bu-spark` branch, never `main`.

## Stack

- Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript
- Firebase: Auth, Firestore, Storage (client SDK plus Admin SDK on the server)
- Google Gemini for analysis (`src/lib/gemini.ts`, `src/lib/gemini-rest.ts`)
- Playwright for end-to-end tests
- Hosted on Vercel

## Getting started

Requires Node.js 20 or later.

```bash
git clone https://github.com/tracebridgeai-lab/tracebridge_ai.git
cd tracebridge_ai
npm ci
cp .env.example .env.local   # then fill in the values you were given
npm run dev                  # http://localhost:3000
```

No Gemini key yet? Set `GEMINI_MOCK_MODE="true"` in `.env.local` to run the app with mock analysis results.

Before opening a pull request, `npm run build` must pass and the files you changed must lint clean (`npx eslint <files>`).

## Environment variables

All variables are listed in [`.env.example`](.env.example). Put real values only in `.env.local`, which is git-ignored.

| Variable | Used for |
| --- | --- |
| `FIREBASE_*` | Admin SDK on the server (Firestore, Storage, token checks) |
| `NEXT_PUBLIC_FIREBASE_*` | Client SDK in the browser |
| `GEMINI_API_KEY`, `GEMINI_MOCK_MODE` | Analysis engine, or mock mode for local work |
| `ADMIN_EMAILS` | Emails allowed to call operator-only routes (global rule seeding, live evals) |
| `BETA_ACCOUNT_PASSWORD` | Only for `scripts/create-beta-accounts.ts` |

Never commit keys, tokens, passwords, or `.env` files. If you think a secret was committed, tell James right away rather than deleting it quietly.

## Repository layout

| Path | What it holds |
| --- | --- |
| `src/app/` | Pages (landing, login, dashboard) and API routes under `src/app/api/` |
| `src/lib/` | Gap engine, Gemini clients, Firebase setup, eSTAR formatting, auth helpers |
| `src/pipeline/` | FDA 510(k) scraper and ingestion to RAG-ready JSONL ([pipeline README](src/pipeline/README.md)) |
| `scripts/` | Seeding, evaluation, and synthetic data generation scripts (run with `npx tsx`) |
| `scripts/synthetic_dataset/` | Synthetic compliant and deficient packages by FDA product code |
| `demo_data/` | Mock submission documents for demos and stress tests |
| `FDA_Test_Dossiers/` | Small test dossiers with known pass and fail outcomes |
| `phase_2_files/` | FDA guidance and regulatory rule templates |
| `tests/e2e/` | Playwright tests |

All documents in `demo_data/`, `FDA_Test_Dossiers/`, and `scripts/synthetic_dataset/` are synthetic. Do not add real company submission files to this repository.

## Useful scripts

```bash
npm run seed:firestore     # seed Firestore with base data
npm run parse:templates    # parse regulatory rule templates
npm run eval:hostile       # run the evaluation engine against test documents
npx playwright test        # end-to-end tests (starts the dev server)
```
