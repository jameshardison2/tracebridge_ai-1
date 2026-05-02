# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tracebridge-core.spec.ts >> TraceBridge AI - E2E Core Workflow >> Complete End-to-End Walkthrough
- Location: tests/e2e/tracebridge-core.spec.ts:11:7

# Error details

```
Test timeout of 180000ms exceeded.
```

```
Error: locator.click: Test timeout of 180000ms exceeded.
Call log:
  - waiting for locator('button').filter({ hasText: 'Run Gap Analysis' })
    - locator resolved to <button disabled class="btn-primary w-full py-4 text-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    336 × waiting for element to be visible, enabled and stable
        - element is not enabled
      - retrying click action
        - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - generic [ref=e12]:
    - complementary [ref=e13]:
      - button [ref=e14]:
        - img [ref=e15]
      - link "TraceBridge UI" [ref=e18] [cursor=pointer]:
        - /url: /
        - img [ref=e19]
        - generic [ref=e21]: TraceBridge UI
      - navigation [ref=e22]:
        - link "Overview" [ref=e23] [cursor=pointer]:
          - /url: /dashboard
          - img [ref=e24]
          - generic [ref=e29]: Overview
        - link "Submit Audit" [ref=e30] [cursor=pointer]:
          - /url: /dashboard/upload
          - img [ref=e31]
          - generic [ref=e34]: Submit Audit
        - link "Compliance Intelligence" [ref=e35] [cursor=pointer]:
          - /url: /dashboard/results
          - img [ref=e36]
          - generic [ref=e41]: Compliance Intelligence
        - link "Pipeline (Triage)" [ref=e42] [cursor=pointer]:
          - /url: /dashboard/pipeline
          - img [ref=e43]
          - generic [ref=e44]: Pipeline (Triage)
        - link "Reports" [ref=e45] [cursor=pointer]:
          - /url: /dashboard/reports
          - img [ref=e46]
          - generic [ref=e49]: Reports
        - link "Roster Config" [ref=e50] [cursor=pointer]:
          - /url: /dashboard/team
          - img [ref=e51]
          - generic [ref=e56]: Roster Config
        - link "System Logs" [ref=e57] [cursor=pointer]:
          - /url: /dashboard/logs
          - img [ref=e58]
          - generic [ref=e61]: System Logs
      - generic [ref=e62]:
        - generic [ref=e63]:
          - generic [ref=e65]: AT
          - generic [ref=e66]:
            - paragraph [ref=e67]: Automation Tester
            - paragraph [ref=e68]: test1777754315700@tracebridge.ai
        - button "Sign Out" [ref=e69]:
          - img [ref=e70]
          - generic [ref=e73]: Sign Out
    - main [ref=e74]:
      - generic [ref=e76]:
        - generic [ref=e77]:
          - heading "New Analysis" [level=1] [ref=e78]
          - paragraph [ref=e79]: Upload your V&V documents for automatic compliance gap detection.
        - generic [ref=e80]:
          - generic [ref=e81]:
            - generic [ref=e82]:
              - heading "1. Device Classification" [level=3] [ref=e83]
              - button "AI Auto-Detect" [ref=e84]:
                - img [ref=e85]
                - text: AI Auto-Detect
            - generic [ref=e88]:
              - heading "1. Select Medical Device Type" [level=2] [ref=e89]
              - paragraph [ref=e90]: TraceBridge uses the FDA Product Code to automatically optimize your gap analysis algorithm.
              - generic [ref=e91]:
                - generic:
                  - img
                - textbox "Search for a medical device (e.g. Glucose Monitor, Scalpel)..." [ref=e92]
          - generic [ref=e93]:
            - heading "2. Data Ingestion Stream" [level=3] [ref=e94]
            - generic [ref=e95]:
              - button "ɢ Greenlight Guru API Sync Master DHR/QMS Records" [active] [ref=e96]:
                - generic [ref=e97]:
                  - generic [ref=e98]: ɢ
                  - generic [ref=e99]:
                    - heading "Greenlight Guru API" [level=4] [ref=e100]
                    - paragraph [ref=e101]: Sync Master DHR/QMS Records
                - img [ref=e102]
              - button "Atlassian Jira Sync SaMD Spec & Test Cases" [ref=e104]:
                - generic [ref=e105]:
                  - img [ref=e107]
                  - generic [ref=e109]:
                    - heading "Atlassian Jira" [level=4] [ref=e110]
                    - paragraph [ref=e111]: Sync SaMD Spec & Test Cases
                - img [ref=e112]
            - generic [ref=e116]: Or upload manually
            - generic [ref=e118]: Local File Drive Array
            - generic [ref=e119] [cursor=pointer]:
              - img [ref=e121]
              - paragraph [ref=e124]: Drop entire 1,500+ page DHF Submissions
              - paragraph [ref=e125]: Powered by a 1M+ Token Processing Window. Supports unstructured PDF, DOCX, and TXT.
            - generic [ref=e126]:
              - generic [ref=e127]:
                - img [ref=e128]
                - generic [ref=e131]:
                  - paragraph [ref=e132]: FDA_510k_Executive_Summary_v3.pdf
                  - paragraph [ref=e133]: 0.00 MB
                - button [ref=e134]:
                  - img [ref=e135]
              - generic [ref=e138]:
                - img [ref=e139]
                - generic [ref=e142]:
                  - paragraph [ref=e143]: ISO_14971_Risk_Management_Report.pdf
                  - paragraph [ref=e144]: 0.00 MB
                - button [ref=e145]:
                  - img [ref=e146]
              - generic [ref=e149]:
                - img [ref=e150]
                - generic [ref=e153]:
                  - paragraph [ref=e154]: IEC_62304_Software_Architecture_Spec.docx
                  - paragraph [ref=e155]: 0.00 MB
                - button [ref=e156]:
                  - img [ref=e157]
              - generic [ref=e160]:
                - img [ref=e161]
                - generic [ref=e164]:
                  - paragraph [ref=e165]: Cybersecurity_Threat_Model_SBOM.pdf
                  - paragraph [ref=e166]: 0.00 MB
                - button [ref=e167]:
                  - img [ref=e168]
          - generic [ref=e171]:
            - heading "3. Security & Execution Parameters" [level=3] [ref=e172]
            - generic [ref=e173]:
              - generic [ref=e174]:
                - generic [ref=e175]:
                  - heading "Zero Data Retention (ZDR)" [level=4] [ref=e176]:
                    - img [ref=e177]
                    - text: Zero Data Retention (ZDR)
                  - paragraph [ref=e182]: Permanently destroy file artifacts from the database immediately following the gap analysis. Disables Trace Inspection.
                - checkbox [checked] [ref=e184]
              - generic [ref=e186]:
                - heading "AI Inference Engine" [level=4] [ref=e187]:
                  - img [ref=e188]
                  - text: AI Inference Engine
                - combobox [ref=e191]:
                  - option "Google Gemini Cloud (Enterprise ZDR API)" [selected]
                  - option "Air-Gapped Local Server (LLaMA 3 - localhost:11434)"
          - button "Run Gap Analysis" [disabled] [ref=e192] [cursor=pointer]:
            - img [ref=e193]
            - text: Run Gap Analysis
          - generic [ref=e195]:
            - heading "Enterprise Security & Data Privacy" [level=4] [ref=e196]:
              - img [ref=e197]
              - text: Enterprise Security & Data Privacy
            - generic [ref=e200]:
              - generic [ref=e201]:
                - img [ref=e203]
                - generic [ref=e205]:
                  - paragraph [ref=e206]: Transit & Inference (RAM)
                  - paragraph [ref=e207]: The document is encrypted and sent to Google Cloud. The Gemini LLM reads the document in temporary memory (RAM) to generate the gap analysis.
              - generic [ref=e208]:
                - img [ref=e210]
                - generic [ref=e215]:
                  - paragraph [ref=e216]: Zero Data Retention (ZDR)
                  - paragraph [ref=e217]: The moment the analysis is returned to the user, Google completely purges the data. It is never written to a disk, never saved to a database, and never used to train future models.
              - generic [ref=e218]:
                - img [ref=e220]
                - generic [ref=e223]:
                  - paragraph [ref=e224]: Enterprise Air-Gapped Available
                  - paragraph [ref=e225]: Need absolute control? Deploy TraceBridge locally on your own private, air-gapped servers using open-source Foundational Models.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import * as path from 'path';
  3   | 
  4   | test.describe('TraceBridge AI - E2E Core Workflow', () => {
  5   | 
  6   |   // A helper function to save screenshots with readable names
  7   |   const takeScreenshot = async (page: any, name: string) => {
  8   |     await page.screenshot({ path: `test-screenshots/${name}.png`, fullPage: true });
  9   |   };
  10  | 
  11  |   test('Complete End-to-End Walkthrough', async ({ page }) => {
  12  |     test.setTimeout(180000); // 3 minutes for full AI analysis pipeline
  13  | 
  14  |     // 0. Authentication (Signup as dummy user to access dashboard)
  15  |     await page.goto('/login');
  16  |     await page.waitForLoadState('networkidle');
  17  |     await takeScreenshot(page, '00_Login_Page');
  18  | 
  19  |     // Click to Signup
  20  |     await page.locator('button', { hasText: 'Request Provisioning' }).click();
  21  |     
  22  |     // Fill out form
  23  |     const randomEmail = `test${Date.now()}@tracebridge.ai`;
  24  |     await page.locator('input[placeholder="John Doe"]').fill('Automation Tester');
  25  |     await page.locator('input[placeholder="name@company.com"]').fill(randomEmail);
  26  |     await page.locator('input[placeholder="••••••••"]').fill('SecurePassword123!');
  27  |     
  28  |     // Submit Provision Request
  29  |     await page.locator('button', { hasText: 'Submit Provision Request' }).click();
  30  |     
  31  |     // 1. Landing / Dashboard Hub
  32  |     await page.waitForURL('**/dashboard', { timeout: 30000 });
  33  |     await page.waitForLoadState('networkidle');
  34  |     await takeScreenshot(page, '01_Dashboard_Home');
  35  |     
  36  |     // Verify Dashboard Loaded
  37  |     await expect(page.locator('text=Quality Regulatory Dashboard')).toBeVisible();
  38  | 
  39  |     // 2. Data Ingestion Stream (Upload)
  40  |     // Use the UI button to navigate instead of goto to prevent interrupt loops
  41  |     await page.locator('text=Initiate Device Audit').click();
  42  |     await page.waitForURL('**/dashboard/upload');
  43  |     await page.waitForLoadState('networkidle');
  44  |     await takeScreenshot(page, '02_Upload_Page_Initial');
  45  | 
  46  |     // Click Greenlight Guru Button (it triggers a window.alert and handles Quick Load Demo)
  47  |     page.on('dialog', dialog => dialog.accept());
  48  |     await page.locator('text=Greenlight Guru API').click();
  49  |     
  50  |     // Give the demo files a second to load into the UI
  51  |     await page.waitForTimeout(1000);
  52  |     await takeScreenshot(page, '03_Upload_Page_Files_Loaded');
  53  | 
  54  |     // Check ZDR toggle
  55  |     const zdrToggle = page.locator('input[type="checkbox"]');
  56  |     await zdrToggle.check({ force: true });
  57  |     await takeScreenshot(page, '04_Upload_Page_ZDR_Enabled');
  58  | 
  59  |     // Run Gap Analysis
> 60  |     await page.locator('button', { hasText: 'Run Gap Analysis' }).click();
      |                                                                   ^ Error: locator.click: Test timeout of 180000ms exceeded.
  61  |     
  62  |     // 3. Results / Triage Pipeline
  63  |     // Waiting for the progress bar to finish and redirect to results
  64  |     await page.waitForURL('**/dashboard/results', { timeout: 120000 });
  65  |     await page.waitForLoadState('networkidle');
  66  |     await takeScreenshot(page, '05_Results_Dashboard');
  67  | 
  68  |     // Click on a critical gap to open Triage Modal
  69  |     await page.locator('button', { hasText: 'View Gap Analysis' }).first().click();
  70  |     await page.waitForTimeout(1000);
  71  |     await takeScreenshot(page, '06_Results_Triage_Modal');
  72  |     
  73  |     // Expand Technical AI Analysis
  74  |     await page.locator('summary', { hasText: 'View Technical AI Analysis' }).click();
  75  |     await page.waitForTimeout(500);
  76  | 
  77  |     // Verify FDA Precedent badge is visible in modal
  78  |     await expect(page.locator('text=FDA Historical Precedent')).toBeVisible();
  79  | 
  80  |     // Close Modal
  81  |     await page.keyboard.press('Escape');
  82  |     await page.waitForTimeout(500);
  83  | 
  84  |     // 4. Regulatory Artifact Hub (Reports)
  85  |     await page.locator('text=Reports').click();
  86  |     await page.waitForURL('**/dashboard/reports');
  87  |     await page.waitForLoadState('networkidle');
  88  |     await takeScreenshot(page, '07_Reports_Hub_Initial');
  89  | 
  90  |     // Switch to CAPA Template
  91  |     await page.locator('button', { hasText: 'CAPA' }).click();
  92  |     await page.waitForTimeout(500);
  93  |     await takeScreenshot(page, '08_Reports_Hub_CAPA');
  94  | 
  95  |     // Switch to 510(k) Template
  96  |     await page.locator('button', { hasText: '510(k)' }).click();
  97  |     await page.waitForTimeout(500);
  98  |     await takeScreenshot(page, '09_Reports_Hub_510k');
  99  |     
  100 |     // Verify the Export buttons exist
  101 |     await expect(page.locator('button', { hasText: '510k-Matrix' }).first()).toBeVisible();
  102 | 
  103 |     // 5. Customer Discovery Hub
  104 |     await page.locator('text=Roster Config').click();
  105 |     await page.waitForURL('**/dashboard/team');
  106 |     await page.waitForLoadState('networkidle');
  107 |     await takeScreenshot(page, '10_Customer_Discovery_Hub');
  108 |     
  109 |     await expect(page.locator('text=Team Workspace').first()).toBeVisible();
  110 |   });
  111 | });
  112 | 
```