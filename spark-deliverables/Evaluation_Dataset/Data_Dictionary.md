# TraceBridge FDA 510(k) Data Dictionary

This document explains the schema for the records found in `fda_510k_filtered.jsonl`.

## Schema

* **device_name**: The commercial name of the medical device.
* **k_number**: The unique FDA 510(k) premarket notification number.
* **applicant**: The name of the company that submitted the 510(k).
* **advisory_committee_description**: The medical specialty category (e.g., Software, Cardiovascular, Neurology).
* **statement_or_summary**: 
  * **[CRITICAL NOTE]**: Due to limitations with the OpenFDA API, this field only returns an indicator (e.g., "Summary" or "Statement") rather than the actual document text. 
  * **Milestone 1 Task**: The student team must write a data pipeline to scrape the actual PDF summaries from the FDA accessdata site (`https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm`), extract the raw text, and populate a new `summary_text` field for each record before generating embeddings.
