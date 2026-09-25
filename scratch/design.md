TraceBridge AI

Technical Design Document

Prepared by James N. Hardison II  |  Date: July 31, 2026  |  Status: Draft v1.0

1. Current Technology Stack

Layer

Tool / Service

Role

Cloud platform

Google Cloud Platform

Core infrastructure host

LLM

Gemini

RAG generation, classification, drafting

Vector database

Google Cloud vector database (Vertex AI Vector Search or equivalent)

Embeddings storage/retrieval for FDA guidance, ISO standards, submission precedent

Application data

Firebase

Real-time data, authentication

Relational data

PostgreSQL

Structured data: complaints, users, reports, tracking

Frontend

(existing frontend)

User-facing application

Backend

(existing backend)

API layer / business logic

2. High-Level System Architecture

TraceBridge AI is organized around a shared data backbone with four user-facing modules and one internal tool. Each module reads from and writes to shared Postgres tables and the vector database, allowing cross-module triggers (e.g., a complaint flag surfacing in the Submission Status Tracker).

Client (frontend) → Backend API → [ Module Services ] → Postgres (structured data) + Vector DB (embeddings) + Firebase (auth/real-time)

Module Services: RAG Guidance Service, Reporting Service, Complaints Service, Regulatory Intelligence Service, Submission Tracker Service.

Cross-cutting: Integration/Event Layer (webhooks or pub/sub) that propagates triggers between services — this is the 'closes the loop' backbone connecting Modules 1, 3, and 4 to the Submission Status Tracker.

3. Module-Level Design

3.1 Module 1 — RAG Regulatory Guidance Engine

Ingestion pipeline: public FDA guidance documents, 21 CFR text, ISO standards → chunked → embedded → stored in vector database.

Query flow: user question or uploaded device spec → embedding → vector similarity search → relevant chunks retrieved → passed to Gemini with a grounded-generation prompt → response returned with source citations and a confidence indicator.

Scheduled refresh job (weekly/monthly) re-ingests updated guidance from the regulatory intelligence feed (Module 4 dependency).

Output types: conversational Q&A, auto-drafted submission section text (flagged as draft, requiring human review).

3.2 Module 2 — Customized Compliance Reporting

Data source: Postgres (complaint records, submission tracker status, RAG interaction history).

Report generation: scheduled or on-demand SQL aggregation → templated PDF/HTML rendering (e.g., a reporting/PDF library).

Base reports (v1): Submission Readiness, Risk Summary, Competitive Landscape, Timeline Projection — fixed templates, parameterized by customer/device.

Customization layer (v1 approach, to validate with pilots): template selection UI first (lowest engineering cost); natural-language report builder ('describe what you want') is a stretch goal using Gemini to translate a request into a query against the report data model.

3.3 Module 3 — Complaints & Adverse Event Aggregation

Intake: lightweight connectors/webhooks for email, web form submission, and manual entry at MVP; additional channel connectors (CRM, warranty systems) are post-MVP.

Classification: Gemini-based (or lightweight supervised model trained on FDA MAUDE data) classification by device component, failure type, and severity; result stored in Postgres with confidence score.

Trend detection: scheduled job clusters recent complaints by component/failure type; flags clusters exceeding a configurable threshold within a time window.

Report generation: auto-drafted CAPA and MDR (21 CFR Part 803) templates populated from classified complaint data; requires human sign-off before submission.

Event emission: qualifying complaints (by severity/threshold) emit an event consumed by the Integration Layer, which raises a flag in Module 1/4 and the Submission Status Tracker.

3.4 Module 4 — Regulatory Change Impact Analysis

Data source: third-party regulatory intelligence subscription (RegDesk or IQVIA) accessed via their feed/API.

Scheduled job pulls new guidance relevant to the customer's device classification (keyword/taxonomy matching).

On a relevant change, system runs a semantic match against the customer's current submission sections (via vector search) to identify likely-affected sections.

Emits an event to the Integration Layer, flagging affected sections in the Submission Status Tracker and refreshing the relevant portion of the Module 1 knowledge base.

3.5 Internal Tool — Submission Status Tracker

Data model: FDA submission requirement checklist mapped to device specs (per submission type, e.g., 510(k)).

Tracks per-section status (not started / in progress / complete / flagged for review), populated manually by the user and automatically via events from Modules 3 and 4.

Surfaces guidance links back into Module 1 for any incomplete or flagged section.

4. Data Dictionary (BU Spark Deliverable — Initial Structure)

The following core entities define the shared data backbone. This is the starting structure to be finalized and delivered as part of the BU Spark data dictionary requirement.

Entity

Key Fields

Notes

Complaint

complaint_id, source_channel, received_date, device_component, failure_type, severity, classification_confidence, status, linked_capa_id, linked_mdr_id

Populated via Module 3 intake/classification

MDR/CAPA Record

record_id, complaint_id(s), report_type, generated_draft_text, reviewer, review_status, submitted_date

Auto-drafted, human-reviewed before submission

Device/Submission

device_id, device_class, submission_type, submission_sections[], overall_status

Backbone for Submission Status Tracker

Submission Section

section_id, device_id, requirement_ref, status, last_updated, flagged_reason

Populated/flagged by Modules 1, 3, 4

Regulatory Guidance Item

guidance_id, source, publish_date, device_class_relevance[], embedding_ref

Ingested from public FDA sources + RegDesk/IQVIA feed

Report

report_id, customer_id, report_type, parameters, generated_date, data_snapshot_ref

Module 2 output

Supplier (backlog)

supplier_id, certification_status, documents[], expiry_dates

Reserved for post-MVP Quality Control module

5. Data Security Architecture

Encryption at rest (Postgres, Firebase, vector DB) and in transit (TLS) across all services.

Role-based access control enforced at the API layer, scoped by customer account and module.

Audit logging of all data access and AI-generated outputs, stored separately from primary application data.

Data residency: U.S.-based GCP regions; documented in each customer's Data Processing Agreement.

Strict separation between customer data (never used for base-model training without explicit opt-in) and the shared public-data training corpus.

6. Testing Architecture

Unit tests per service (RAG relevance scoring, classification accuracy against labeled MAUDE samples, report rendering correctness) run in CI on every build.

Integration tests validate event propagation across the Integration Layer (complaint → flag → tracker; regulatory change → flag → tracker).

Pilot validation environment: sandboxed customer instance seeded with anonymized/consented real data for live accuracy review during development.

Accuracy tracking dashboard: false positive/negative rates for complaint classification and trend detection, reviewed on a rolling basis.

7. Explicit Phasing Notes

Phase 1 (MVP, target mid-August 2026): Modules 1–4 plus internal Submission Status Tracker, on the architecture above.

Phase 2 (Q4 2026 / Q1 2027): full cross-module integration hardening, Post-Market Surveillance module, Design Change Impact Analysis, Supplier Compliance Verification, direct FDA scraping/API in addition to third-party feed.

Phase 3 (later): autonomous AI agents (e.g., unsupervised monitoring/investigation agents), once sufficient usage data exists to validate reliability.

