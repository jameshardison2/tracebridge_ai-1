TraceBridge AI

Research & Development Log

Entry Date: July 31, 2026  |  Logged by: James N. Hardison II

1. Strategic Direction Decision

Following consultation with Tim Buntel (Innovation Pathway), reaffirmed original TraceBridge AI value proposition: a RAG-based regulatory compliance assistant for early-stage and mid-market medtech companies. Explicitly decided NOT to pivot toward a 'Q-Sub Drift' detection product as the primary focus.

Rationale: the Q-Sub Drift concept originated from an offhand comment by a car rental customer expressing skepticism that AI could replace an experienced regulatory engineer. Tim Buntel's assessment: this reaction likely reflected the individual's own professional threat perception rather than validated market signal.

Decision: retain Q-Sub Drift as a differentiated capability/talking point within the broader RAG guidance module, but do not restructure the company around it.

2. Competitive Analysis

2.1 Greenlight Guru

Positioning: the leading purpose-built QMS for medical devices — design controls, risk management, CAPA, clinical data management, document management, and audits in one platform.

Customer-reported strengths (Capterra, G2, TrustRadius, Gartner Peer Insights):

Comprehensive, end-to-end traceability across design controls.

Strong audit trail support, 21 CFR Part 11 compliance.

Robust risk management functionality.

Customer-reported weaknesses / requested improvements:

Pricing is a barrier, especially for pre-validation startups; ROI concerns raised in reviews.

Navigation/search difficulty — users report struggling to locate documents without knowing exactly what they're looking for.

Dated interface relative to modern SaaS products.

Too many clicks for common workflows; limited in-app file type support.

Weak external-collaboration options — no easy way to get supplier/consultant signatures without granting full user licenses.

Clinical module integration (AE, concomitant medications, subject profile, visit modules) not fully integrated — unscheduled visits hard to locate.

User allocation/licensing model perceived as too restrictive for the price.

2.2 Ketryx

Positioning: AI-native connected lifecycle management platform overlaying existing developer tools (Jira, GitHub, GitLab, TestRail, Azure DevOps) to automate FDA/EU MDR/ISO 13485/IEC 62304 compliance documentation. Founded 2021, Somerville, MA. Raised $14M Series A (Lightspeed, E14 Fund, Ubiquity Ventures) and $39M Series B. Customers include DeepHealth, HeartFlow, Beacon Biosignals, Aignostics; used by 3 of the top 5 global medtech companies.

Claimed strengths: reduces documentation time up to 90%, accelerates release cycles up to 10x, free tier available for pre-market companies with under $2M in funding, flexible monthly pricing with no minimum commitment for startups.

Identified gaps / limitations:

Requires an existing developer toolchain (Jira/GitHub/etc.) to deliver its core value — leaves out companies without established engineering infrastructure.

Enterprise/scaling-company orientation; public customer review volume is sparse, suggesting concentration among large, technically mature medtech firms.

Exact pricing not publicly listed beyond tier names (Essentials/Enterprise), a friction point for budget-conscious early-stage buyers.

2.3 TraceBridge AI Positioning Versus Competitors

Gap Identified

TraceBridge AI Response

Greenlight Guru pricing excludes startups

Priced for bootstrapped/early-stage budgets; no enterprise QMS commitment required

Greenlight Guru clunky navigation/search

Natural-language RAG search over compliance content

Greenlight Guru dated UI, weak dashboards

Modern UI; proactive AI-generated reporting suite (Module 2)

Greenlight Guru limited external collaboration

Reserved for post-MVP: guest/comment-only access tiers

Ketryx requires developer toolchain

Standalone — no Jira/GitHub dependency required to start

Both: no one solving complaint-volume-at-scale well for smaller/scaling teams

Module 3 (Complaints Aggregation) positioned as lead/primary revenue product

3. Market Validation — Third-Party Evidence

Industry pain points below were independently corroborated via the Greenlight Guru 2025 Medical Device Industry Report (536 QA/RA professionals surveyed), the Veeva 2023 Regulatory Benchmark Report, and IQVIA's 2025 analysis of MedTech compliance trends, in addition to direct customer discovery (DEKA interview).

Complaint/adverse-event management breaks down at volume: manual complaint intake, triage, investigation, MDR assembly, and PSUR generation do not scale with headcount as complaint volume grows (per Smarteeva industry commentary; Gartner cites up to 50% processing-time reduction from automation).

Data silos across regulatory, quality, and safety functions reduce productivity; Greenlight Guru's 2025 report found companies that break down silos are 6x more likely to meet compliance objectives, yet 43% still rely on outdated tools.

Regulatory intelligence monitoring remains largely manual; IQVIA (2025) describes most organizations operating in reactive 'maintenance mode' rather than proactive monitoring, with critical data trapped in disconnected spreadsheets.

Direct validation: DEKA Research & Development (via interview discussion) confirmed complaint aggregation has become unmanageable as the company scales, and represents a problem they would pay significantly to solve.

4. MVP Module Decision

Final MVP scope (superseding earlier 7-module brainstorm, which is retained below as backlog):

Module

Role

Status

1. RAG Regulatory Guidance Engine

Core/foundation — differentiator vs. generic tools

MVP

2. Customized Compliance Reporting

Visibility layer; base + user-customizable reports

MVP

3. Complaints & Adverse Event Aggregation

Primary revenue driver; validated by DEKA discovery

MVP

4. Regulatory Change Impact Analysis

Closes the loop; flags affected submission sections on guidance change

MVP

Submission Status Tracker

Internal tool; required for BU Spark deliverable and customer visibility

MVP (internal)

Explicitly deferred to backlog (Phase 2/3): Post-Market Surveillance Automation, Design Change Impact Analysis, Supplier/Subcontractor Compliance Verification, Clinical Data Integration/Harmonization, autonomous AI agents, direct FDA website scraping/API integration.

5. Data Sourcing & Model Training Strategy

Base model training data: public FDA guidance documents, 21 CFR text, ISO standards, and publicly filed FDA submission dockets — no cost, no privacy exposure, available immediately.

Complaints/adverse event training data: FDA MAUDE database (public, large historical dataset).

Regulatory currency: subscribe to a third-party regulatory intelligence feed (RegDesk or IQVIA) for ongoing FDA/EU MDR change monitoring; retrain/refresh on a quarterly-to-semiannual cadence. Direct FDA scraping and a custom regulatory API integration are reserved for a later phase once revenue supports the build cost.

Pilot customer data: anonymized, consented historical complaint data contributed by pilot customers in exchange for discounted early pricing — improves model accuracy over time without holding up launch.

Explicit customer commitment: customer data is never used to train shared/base models without separate, explicit opt-in.

6. Data Security & Adoption Risk Mitigation

Identified as a required workstream given the regulated environment TraceBridge operates in.

Security baseline: SOC 2 compliance path, encryption at rest/in transit, role-based access control, full audit logging, defined U.S. data residency, and a standard Data Processing Agreement for every customer.

AI liability/trust positioning: TraceBridge is marketed as an intelligence assistant, not a replacement for a qualified regulatory professional; all outputs carry confidence indicators and human-review disclaimers to protect customers and TraceBridge legally.

Training transparency: explicit, customer-facing confirmation that TraceBridge does not train on customer data by default.

Integration friction: build API/import workflows so customers using Greenlight Guru or another eQMS are not forced into duplicate manual data entry.

7. Testing & Validation Methodology

Unit testing during development: RAG relevance/coherence, complaint classification accuracy, trend detection accuracy, report rendering/calculation correctness — automated test suites with mock data, ongoing (not deferred to post-build).

Integration testing: cross-module data flows — complaints triggering regulatory/tracker flags; regulatory changes propagating to the quality/tracker layer.

Pilot validation testing: real (anonymized, consented) complaint and regulatory data run through the system in parallel with development, using the 3 pilot customers as the primary validation ground for usability and edge cases unit tests will not catch.

Accuracy validation: manual sampling of AI-generated complaint classifications against ground truth; regulatory-expert review of RAG guidance outputs; ongoing false-positive/false-negative tracking with iterative model refinement.

Compliance documentation: all testing methodology and results documented to support future audit trail and customer due-diligence conversations.

Timeline: unit/integration testing ongoing throughout development; pilot validation begins as soon as early module versions are functional (mid-to-late August 2026 timeframe).

8. AI Agents — Explicit Deferral Decision

Decision: do not build autonomous AI agents for MVP. Rationale: current modules (interactive RAG, complaint surfacing, generated reports) deliver sufficient standalone value; agents add engineering and testing complexity without enough existing customer usage data to make them reliable. Revisit in Q4 2026/Q1 2027 once pilot usage patterns are established.

9. Backlog — Full Idea Set (Reserved for Later Phases)

Captured from July 31, 2026 brainstorm session, for future prioritization:

Post-market surveillance automation (field performance/warranty/service data correlation to design specs; mandatory long-term but too large in scope for MVP).

Design change impact analysis (automated traceability when a design change is made — flags affected requirements/risk/submission documentation).

Supplier and subcontractor compliance verification (automated ISO 13485 documentation collection, validation, and expiry monitoring).

Clinical data integration and harmonization across trial sites/formats.

Direct FDA website scraping pipeline and/or direct FDA API integration (once cost-justified).

Autonomous AI agents for unsupervised monitoring/investigation.

Broader enterprise integration bridge to Greenlight Guru or similar QMS platforms for customers that graduate to enterprise tooling (upsell/partnership path).

Guest/comment-only external collaboration access tiers (directly responsive to a Greenlight Guru customer complaint).

10. Adjacent Business Idea Considered & Set Aside

A mobile/roadside EV charging service concept was explored during this session (prompted by an unrelated rental-car conversation) and researched for market viability. Finding: the market already has multiple active entrants (Bee Charge EV, Squatch Unplugged, Lightning eMotors, AAA expansion into EV roadside service), making it a capital-intensive, competitive space rather than an open opportunity. Decision: not pursued; documented here only for completeness of today's research session.

11. Next Actions

Finalize BU Spark data dictionary deliverable (see Design Document, Section 4) by end of July 2026.

Build operational MVP (Modules 1–4 + Submission Status Tracker) targeting mid-August 2026.

Draft pilot outreach one-pager/pitch deck leading with the Complaints module and DEKA-style validated pain point.

Recruit a minimum of 3 pilot customers by end of summer 2026, leveraging J&J MedTech/Abbott/Insulet network and Boston-area early-stage medtech contacts.

Evaluate and select regulatory intelligence subscription vendor (RegDesk vs. IQVIA) for Module 4.

