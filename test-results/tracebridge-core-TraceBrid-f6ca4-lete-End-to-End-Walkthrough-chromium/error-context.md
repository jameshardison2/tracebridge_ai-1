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
Error: page.waitForURL: Test timeout of 180000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/dashboard/upload" until "load"
  navigated to "https://www.tracebridge.ai/dashboard"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - button [ref=e5]:
        - img [ref=e6]
      - link "TraceBridge UI" [ref=e9] [cursor=pointer]:
        - /url: /
        - img [ref=e10]
        - generic [ref=e12]: TraceBridge UI
      - navigation [ref=e13]:
        - link "Overview" [ref=e14] [cursor=pointer]:
          - /url: /dashboard
          - img [ref=e15]
          - generic [ref=e20]: Overview
        - link "Submit Audit" [ref=e21] [cursor=pointer]:
          - /url: /dashboard/upload
          - img [ref=e22]
          - generic [ref=e25]: Submit Audit
        - link "Compliance Intelligence" [ref=e26] [cursor=pointer]:
          - /url: /dashboard/results
          - img [ref=e27]
          - generic [ref=e32]: Compliance Intelligence
        - link "Pipeline (Triage)" [ref=e33] [cursor=pointer]:
          - /url: /dashboard/pipeline
          - img [ref=e34]
          - generic [ref=e35]: Pipeline (Triage)
        - link "Reports" [ref=e36] [cursor=pointer]:
          - /url: /dashboard/reports
          - img [ref=e37]
          - generic [ref=e40]: Reports
        - link "Roster Config" [ref=e41] [cursor=pointer]:
          - /url: /dashboard/team
          - img [ref=e42]
          - generic [ref=e47]: Roster Config
        - link "System Logs" [ref=e48] [cursor=pointer]:
          - /url: /dashboard/logs
          - img [ref=e49]
          - generic [ref=e52]: System Logs
      - generic [ref=e53]:
        - generic [ref=e54]:
          - generic [ref=e56]: T
          - generic [ref=e57]:
            - paragraph [ref=e58]: User
            - paragraph [ref=e59]: test1777749409006@tracebridge.ai
        - button "Sign Out" [ref=e60]:
          - img [ref=e61]
          - generic [ref=e64]: Sign Out
    - main [ref=e65]:
      - generic [ref=e67]:
        - generic [ref=e68]:
          - generic [ref=e69]:
            - heading "Quality Regulatory Dashboard" [level=1] [ref=e70]
            - paragraph [ref=e71]: Master index of IEC 62304 and ISO 14971 active compliance audits.
          - generic [ref=e72]:
            - button "Inject 30 Demo Audits" [ref=e73]:
              - img [ref=e74]
              - text: Inject 30 Demo Audits
            - link "Initiate Device Audit" [active] [ref=e76] [cursor=pointer]:
              - /url: /dashboard/upload
              - img [ref=e77]
              - text: Initiate Device Audit
        - generic [ref=e80]:
          - heading "TraceBridge Operating Mechanism" [level=2] [ref=e81]: TraceBridge Operating Mechanism
          - generic [ref=e83]:
            - link "1 Submit Audit Upload MedTech documentation to directly target ISO/FDA protocols." [ref=e84] [cursor=pointer]:
              - /url: /dashboard/upload
              - generic [ref=e85]: "1"
              - generic [ref=e86]:
                - heading "Submit Audit" [level=3] [ref=e87]
                - paragraph [ref=e88]: Upload MedTech documentation to directly target ISO/FDA protocols.
              - img [ref=e89]
            - generic [ref=e91]:
              - generic [ref=e92]: "2"
              - generic [ref=e93]:
                - heading "AI Detection" [level=3] [ref=e94]
                - paragraph [ref=e95]: Google Gemini systematically parses architecture and intelligently flags gaps.
              - img [ref=e96]
            - link "3 Execute Triage Formally assign and remediate issues using the interactive Pipeline Tracker." [ref=e98] [cursor=pointer]:
              - /url: /dashboard/pipeline
              - generic [ref=e99]: "3"
              - generic [ref=e100]:
                - heading "Execute Triage" [level=3] [ref=e101]
                - paragraph [ref=e102]: Formally assign and remediate issues using the interactive Pipeline Tracker.
              - img [ref=e103]
            - generic [ref=e105]:
              - generic [ref=e106]: "4"
              - generic [ref=e107]:
                - heading "FDA Checkout" [level=3] [ref=e108]
                - paragraph [ref=e109]: Export your signed-off trace items flawlessly to the FDA eCopy CSV Format.
        - generic [ref=e111]:
          - generic [ref=e112]:
            - generic [ref=e113]:
              - img [ref=e114]
              - generic [ref=e116]: Total Audits
            - text: "0"
          - generic [ref=e117]:
            - generic [ref=e118]:
              - img [ref=e119]
              - generic [ref=e122]: Approved Scans
            - text: "0"
          - generic [ref=e123]:
            - generic [ref=e124]:
              - img [ref=e125]
              - generic [ref=e128]: Pending
            - text: "0"
          - generic [ref=e129]:
            - generic [ref=e130]:
              - img [ref=e131]
              - generic [ref=e133]: Active Processing
            - text: "0"
        - generic [ref=e134]:
          - heading "Master System Query List" [level=2] [ref=e136]:
            - img [ref=e137]
            - text: Master System Query List
          - generic [ref=e140]:
            - img [ref=e141]
            - paragraph [ref=e144]: No audit records found in the current index.
            - link "Start Initial Record Ingestion →" [ref=e145] [cursor=pointer]:
              - /url: /dashboard/upload
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
> 42  |     await page.waitForURL('**/dashboard/upload');
      |                ^ Error: page.waitForURL: Test timeout of 180000ms exceeded.
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
  60  |     await page.locator('button', { hasText: 'Run Gap Analysis' }).click();
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
  73  |     // Verify FDA Precedent badge is visible in modal
  74  |     await expect(page.locator('text=FDA Historical Precedent')).toBeVisible();
  75  | 
  76  |     // Close Modal
  77  |     await page.keyboard.press('Escape');
  78  |     await page.waitForTimeout(500);
  79  | 
  80  |     // 4. Regulatory Artifact Hub (Reports)
  81  |     await page.locator('text=Reports').click();
  82  |     await page.waitForURL('**/dashboard/reports');
  83  |     await page.waitForLoadState('networkidle');
  84  |     await takeScreenshot(page, '07_Reports_Hub_Initial');
  85  | 
  86  |     // Switch to CAPA Template
  87  |     await page.locator('button', { hasText: 'CAPA' }).click();
  88  |     await page.waitForTimeout(500);
  89  |     await takeScreenshot(page, '08_Reports_Hub_CAPA');
  90  | 
  91  |     // Switch to 510(k) Template
  92  |     await page.locator('button', { hasText: '510(k)' }).click();
  93  |     await page.waitForTimeout(500);
  94  |     await takeScreenshot(page, '09_Reports_Hub_510k');
  95  |     
  96  |     // Verify the Export buttons exist
  97  |     await expect(page.locator('button', { hasText: '510k-Matrix' }).first()).toBeVisible();
  98  | 
  99  |     // 5. Customer Discovery Hub
  100 |     await page.locator('text=Roster Config').click();
  101 |     await page.waitForURL('**/dashboard/team');
  102 |     await page.waitForLoadState('networkidle');
  103 |     await takeScreenshot(page, '10_Customer_Discovery_Hub');
  104 |     
  105 |     await expect(page.locator('text=Platform ROI Metrics')).toBeVisible();
  106 |   });
  107 | });
  108 | 
```