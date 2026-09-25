# TraceBridge AI: Comprehensive Data Dictionary & Schema Definition
**Version:** 2.0 (Detailed Engineering Specification)
**Target Audience:** BU Spark Data Science & Engineering Teams, TraceBridge Core Contributors
**Database Engine:** Google Cloud Firestore (NoSQL Document Store)
**Vector Engine:** Vertex AI & Firestore Native Vector Search

---

## 1. Executive Summary
This document provides a highly detailed schema definition for all data entities within the TraceBridge AI ecosystem. It defines the exact JSON structure, field-level types, cardinality, and referential integrity mechanisms used across both the Regulatory Intelligence Engine (Module 1) and the Post-Market Surveillance Engine (Module 3).

---

## 2. Module 1: RAG & 510(k) Intelligence Entities

### 2.1 `knowledgeBase` Collection
**Purpose:** Stores the vectorized corpus of historical FDA precedents, ISO standards, and predicate device summaries. This is the core "ground truth" retrieved during RAG operations.
**Primary Key:** `documentId_chunkIndex`

| Field Name | Data Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `text_content` | `String` | **Yes** | The raw chunk text extracted from the regulatory source. Max 2,000 chars. |
| `source_file` | `String` | **Yes** | The filename or URI of the original source (e.g., `FDA_Guidance_Cybersecurity_2023.pdf`). |
| `k_number` | `String` | No | The 510(k) clearance number if the document is a predicate summary (e.g., `K192482`). |
| `device_name` | `String` | No | Extracted device trade name from the precedent. |
| `regulatory_standard` | `String` | No | If derived from a standard, the exact standard ID (e.g., `ISO 14971:2019`). |
| `embedding` | `Vector<768>` | **Yes** | 768-dimensional float32 vector generated via `gemini-embedding-2`. |
| `created_at` | `Timestamp` | **Yes** | System timestamp of ingestion. |

### 2.2 `uploads` Collection
**Purpose:** Represents a single "Submission Readiness" project created by an engineering user. It acts as the parent object for user-uploaded engineering documents and the resulting gap analysis.
**Primary Key:** `uploadId` (UUID v4)

| Field Name | Data Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `userId` | `String` | **Yes** | The Firebase Auth UID of the tenant/user who initiated the upload. |
| `projectName` | `String` | **Yes** | Human-readable name for the submission (e.g., `Horizon POD 510(k)`). |
| `productCode` | `String` | No | FDA 3-letter product code (e.g., `MKJ` for continuous glucose monitors). |
| `standards` | `Array<String>`| **Yes** | List of standards applied for the gap analysis (e.g., `["ISO 14971", "IEC 62304"]`). |
| `status` | `String` | **Yes** | `pending_upload`, `processing_embeddings`, `analyzing`, `complete`, `failed`. |
| `createdAt` | `Timestamp` | **Yes** | When the project was initiated. |

### 2.3 `documents` Collection (Sub-Entity of Uploads)
**Purpose:** Metadata and text extraction results for individual files uploaded to a specific project.
**Primary Key:** `documentId` (UUID v4)
**Foreign Key:** `uploadId` -> `uploads.uploadId`

| Field Name | Data Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `uploadId` | `String` | **Yes** | References the parent upload project. |
| `fileName` | `String` | **Yes** | Original uploaded filename (e.g., `Risk_Management_Plan.pdf`). |
| `mimeType` | `String` | **Yes** | `application/pdf`, `text/plain`, `application/vnd.openxmlformats...` |
| `sizeBytes` | `Number` | **Yes** | File size in bytes for audit limits. |
| `status` | `String` | **Yes** | `pending`, `chunking`, `embedded`, `failed`. |

### 2.4 `gapResults` Collection
**Purpose:** The structured output of the Gemini AI gap analysis, mapping FDA requirements against the user's uploaded documents.
**Primary Key:** `gapId` (UUID v4)
**Foreign Key:** `uploadId` -> `uploads.uploadId`

| Field Name | Data Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `uploadId` | `String` | **Yes** | References the parent upload project. |
| `standard` | `String` | **Yes** | The regulatory standard being evaluated (e.g., `FDA Cybersecurity 2023`). |
| `section` | `String` | **Yes** | The specific section or clause (e.g., `Section 4.1.2`). |
| `requirement` | `String` | **Yes** | The plaintext regulatory requirement being tested. |
| `status` | `String` | **Yes** | `compliant` (Passed), `gap_detected` (Failed/Missing), `needs_review` (Ambiguous). |
| `confidence` | `Number` | **Yes** | AI confidence score (0-100). |
| `missingRequirement`| `String` | No | Populated if `status == gap_detected`. Explains exactly what the engineers forgot to include. |
| `citations` | `Array<Object>`| No | Array containing `{ source: String, quote: String, section: String }`. Proof of compliance if `status == compliant`. |

---

## 3. Module 3: Post-Market Surveillance Entities

### 3.1 `complaints` Collection
**Purpose:** The central repository for all raw, incoming adverse events and their subsequent AI classifications.
**Primary Key:** `complaintId` (UUID v4)

| Field Name | Data Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `raw_text` | `String` | **Yes** | Unstructured narrative text of the adverse event. |
| `source` | `String` | **Yes** | Ingestion channel: `email`, `webhook`, `manual_entry`. |
| `status` | `String` | **Yes** | `pending_classification`, `classified`, `failed`. |
| `received_at` | `Timestamp` | **Yes** | Ingestion timestamp. |
| `device_component`| `String` | No | Extracted via Gemini (e.g., `Battery`, `Motor`, `Software`). |
| `failure_type` | `String` | No | Extracted failure mode (e.g., `Premature Drain`, `Unresponsive UI`). |
| `severity` | `String` | No | `critical` (Death/Injury risk), `major` (Device failure), `minor` (Cosmetic/Nuance). |
| `needs_mdr` | `Boolean` | No | Automatically set to `true` if AI determines FDA 30-day reporting applies. |

### 3.2 `alerts` Collection
**Purpose:** Generated automatically by backend CRON jobs. Used to signal critical issues (like "Systemic Trend Alerts") to the executive dashboard.
**Primary Key:** `alertId` (UUID v4)

| Field Name | Data Type | Required | Description / Allowed Values |
| :--- | :--- | :--- | :--- |
| `type` | `String` | **Yes** | `safety_signal` (Single severe event), `systemic_trend` (Statistically significant cluster). |
| `title` | `String` | **Yes** | Brief dashboard title (e.g., `Systemic Trend: Battery Premature Drain`). |
| `severity` | `String` | **Yes** | `high`, `medium`, `low`. Influences UI rendering (Red vs Yellow). |
| `status` | `String` | **Yes** | `open`, `acknowledged` (A human clicked it), `closed`. |
| `message` | `String` | **Yes** | Detailed AI synthesis of the issue and recommended regulatory action. |
| `detected_at` | `Timestamp` | **Yes** | When the CRON job flagged the anomaly. |

---

## 4. Evaluation Dataset Metadata (`annotated_outcomes.json`)
The Golden Dataset uses a lightweight JSON structure specifically for precision/recall testing.

| Field Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `filename` | `String` | **Yes** | The mock document being tested (e.g., `Risk_Management_Plan_DRAFT.txt`). |
| `rule_id` | `String` | **Yes** | The specific FDA/ISO rule being tested. |
| `requirement` | `String` | **Yes** | The text of the rule. |
| `expected_found`| `Boolean`| **Yes** | **Ground Truth.** If `true`, the document contains the evidence. If `false`, the document lacks it. |
| `ground_truth_reasoning` | `String` | **Yes** | Justification for why the human grader assigned true/false. Used to debug AI hallucination. |
