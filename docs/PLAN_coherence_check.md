# Plan: Coherence Check (Pre-eSTAR)

## 1. Existing Landscape Review

*   **Existing Routes:** The legacy app is heavily structured around `/dashboard/*` (which must remain untouched). The new flow skeleton exists at `/check/*` (`upload`, `findings`, `export`), but currently uses hardcoded mock data. We have several API routes like `api/upload`, `api/v2/evaluate/coherence`, and `api/gap` which contain previous iterations of logic.
*   **Current Upload & Ingestion:** `src/app/api/upload/route.ts` handles existing Firebase Storage uploads. `gemini-rest.ts` imports `mammoth`, indicating existing DOCX parsing capabilities.
*   **Gemini Evaluation Code:** Found in `src/lib/gemini.ts` (which includes mock generation) and `src/lib/gemini-rest.ts` (`queryGeminiRESTArray`).
*   **Rules Database:** Currently defined via `ComplianceRule` in `src/lib/firestore-types.ts`.
*   **Firestore Collections:** Legacy collections include `Upload`, `GapResult`, `ComplianceRule`. 

## 2. What We Will Reuse

*   **Firebase Configuration:** `src/lib/firebase-admin.ts` (`adminDb`) and Auth context.
*   **Gemini API Wrappers:** We will reuse the foundation of `src/lib/gemini-rest.ts`, adapting it to enforce structured JSON output via Zod as required by the new pipeline.
*   **Ingestion Utilities:** We will reuse `mammoth` for DOCX parsing and standard PDF parsing patterns already present in the codebase.
*   **Brand Tokens & Layout:** The existing Tailwind configuration and the layout shell of `/check/layout.tsx` match the spec's color palette (e.g., `#F6F5F1`, `#0E6660`), so the UI framework will be reused.

## 3. Implementation Steps

1.  **Tag & Branch:** `qsub-v1` tag already exists. We are actively on `redesign/pre-estar`.
2.  **Environment Variables:** Add `NEXT_PUBLIC_TB_UI` (classic | estar) to `.env.example`.
3.  **Data Model & Rules:** 
    *   Add new types to `src/lib/firestore-types.ts`: `Check`, `Finding`, `ReviewAction`, `GuidanceItem`.
    *   Define Firestore security rules to scope to `workspaceId` and enforce append-only on `reviewActions`.
4.  **Pipeline (Server Side):**
    *   Create `src/lib/check/extract.ts`, `sort.ts`, `retrieve.ts`, `detectMissing.ts`, `detectInconsistent.ts`, and `score.ts`.
    *   Implement Zod schema validation for Gemini responses.
    *   Add background job processing.
5.  **Pages:**
    *   Rewrite `/check/upload` to match the exact form fields (Device Name, Product Code, etc.) and handle the auto-sort UI.
    *   Rewrite `/check/findings` to fetch actual Firestore `findings` data, show the comparison quotes, and handle Accept/Dismiss/Assign actions.
    *   Rewrite `/check/export` to generate the Word/Excel/PDF reports with "Not for submission" branding.
6.  **Settings:** Implement the UI toggle and classic/new view switch.
7.  **Tests:** Implement unit tests for the pipeline and the "three-modes" fixture test.

## Open Questions / Clarifications
*   **OCR Support:** The spec says "Mark scanned pages that need OCR; if OCR is not available yet, log it and continue." I will use standard text extraction (e.g. `pdf-parse`) and if it yields empty text, mark it as needing OCR.
*   **Workspace ID:** The spec requires all records scoped to a workspace. I will assume the current `useAuth()` hook provides or implies a workspace context, otherwise I will default to a single user's `uid` as their workspace.
*   **Background Jobs:** Next.js Serverless doesn't natively support long-running background jobs without external queues (like Inngest) or Vercel functions maxDuration. I will use standard asynchronous execution with edge functions/max duration handling unless instructed to add a queue.
