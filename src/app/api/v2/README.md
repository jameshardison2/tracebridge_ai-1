# TraceBridge API v2 (BU Spark! Workspace)

Welcome to the BU Spark! workspace. 

To keep things organized and prevent you from accidentally breaking the live TraceBridge website, **all your backend work this semester should happen inside this `v2` folder.**

You will see many other folders in the `src/app/api/` directory (like `analyze`, `eval-core`, `rules`, etc.). Those belong to the legacy Version 4 of TraceBridge (the strict ISO/IEC rule checker). You can look at them for reference on how to call the Gemini API or parse PDFs, but please do not modify them.

## Your Routes

We have already scaffolded the two main AI routes you need to build:

1. **/evaluate/gaps** (`Version 5 - Core MVP`)
   * **Goal:** Take a single document, search the Firestore Vector database for historical 510(k) precedents, and have Gemini find gaps.
   * **Focus:** Sprints 1-4.

2. **/evaluate/coherence** (`Version 6 - Stretch Goal`)
   * **Goal:** Take two documents from the same package and have Gemini compare them inwardly for logical contradictions.
   * **Focus:** Only after Version 5 is fully working.

Good luck!
